/**
 * "Where can I cut?"
 *
 * The budget answers what things cost. This answers which of those costs are
 * worth attacking, and it tries hard not to moralise: every suggestion here is
 * derived from the user's own spending rather than from an opinion about how
 * anyone should live. Two tiers, kept separate on purpose —
 *
 *   certain     — cancel it and the money stops. No behaviour change.
 *   behavioural — real savings, but only if you actually do something
 *                 differently. Never presented as money already banked.
 */

import {cents, isCashflow, occurredAt} from "./analytics"
import type {
  BucketReport,
  ExcludedSpend,
  SubscriptionGenre,
} from "./buckets"
import {
  bucketOf,
  CHARGES_PER_YEAR,
  isCancelledMerchant,
  merchantKey,
  SUBSCRIPTION_GENRES,
  subscriptionGenre,
} from "./buckets"
import type {MonthBucket} from "./period"
import {monthKeyOf} from "./period"
import type {UpTransaction} from "./types"

const WEEKS_PER_MONTH = 52 / 12

/* ------------------------------------------------------------------ *
 * Essential vs discretionary
 * ------------------------------------------------------------------ */

export type Necessity = "essential" | "discretionary" | "unclear"

/**
 * Up category slug → whether the money had a choice about leaving.
 *
 * Anything unlisted is "unclear" rather than being forced into a side: a
 * mis-filed essential would make the discretionary share look worse than it
 * is, and a tool that overstates the problem stops being worth trusting.
 */
export const CATEGORY_NECESSITY: Record<string, Necessity> = {
  // -- Essential ----------------------------------------------------------
  groceries: "essential",
  utilities: "essential",
  internet: "essential",
  "mobile-phone": "essential",
  "rent-and-mortgage": "essential",
  "rates-and-insurance": "essential",
  "home-insurance-and-rates": "essential",
  "home-maintenance-and-improvements": "essential",
  "health-and-medical": "essential",
  "education-and-student-loans": "essential",
  "car-insurance-and-maintenance": "essential",
  "car-repayments": "essential",
  fuel: "essential",
  "public-transport": "essential",
  "toll-roads": "essential",
  parking: "essential",
  pets: "essential",
  "life-admin": "essential",

  // -- Discretionary ------------------------------------------------------
  takeaway: "discretionary",
  "restaurants-and-cafes": "discretionary",
  "pubs-and-bars": "discretionary",
  booze: "discretionary",
  "tobacco-and-vaping": "discretionary",
  "lottery-and-gambling": "discretionary",
  hobbies: "discretionary",
  "holidays-and-travel": "discretionary",
  "events-and-gigs": "discretionary",
  "tv-music-and-streaming": "discretionary",
  "games-and-software": "discretionary",
  "clothing-and-accessories": "discretionary",
  "hair-and-beauty": "discretionary",
  "homeware-and-appliances": "discretionary",
  technology: "discretionary",
  "news-magazines-and-books": "discretionary",
  "taxis-and-share-cars": "discretionary",
  "gifts-and-charity": "discretionary",
  // A gym is the textbook cancellable recurring cost, so it sits here — but
  // it's the entry most likely to be wrong for a given person. Move it.
  "fitness-and-wellbeing": "discretionary",
}

/** Whether this particular transaction was optional. */
export function necessityOf(tx: UpTransaction): Necessity {
  // Every named streaming/software service is discretionary by definition,
  // whatever category Up filed it under.
  if (bucketOf(tx) === "subscriptions") return "discretionary"

  const childId = tx.relationships.category.data?.id
  const child = childId ? CATEGORY_NECESSITY[childId] : undefined
  if (child) return child

  const parentId = tx.relationships.parentCategory.data?.id
  const parent = parentId ? CATEGORY_NECESSITY[parentId] : undefined
  return parent ?? "unclear"
}

/* ------------------------------------------------------------------ *
 * Opportunities
 * ------------------------------------------------------------------ */

export type OpportunityKind =
  | "fees"
  | "overlap"
  | "price-rise"
  | "habit"
  | "drift"

export type Evidence = {label: string; value: string; note?: string}

export type Opportunity = {
  id: string
  kind: OpportunityKind
  title: string
  /** What was found, stated as fact. */
  detail: string
  /** What to do about it. */
  action: string
  /** The saving if the action is taken, over a year. */
  annualCents: number
  perWeekCents: number
  evidence: Evidence[]
}

export type SavingsReport = {
  months: number
  essentialPerMonthCents: number
  discretionaryPerMonthCents: number
  unclearPerMonthCents: number
  /** Discretionary as a fraction of all classified spend, 0-1. */
  discretionaryShare: number
  subscriptionAnnualCents: number
  subscriptionCount: number
  certain: Opportunity[]
  behavioural: Opportunity[]
  certainAnnualCents: number
  /** Upper bound — behavioural items can describe the same dollar twice. */
  behaviouralAnnualCents: number
  /**
   * Already cancelled. Not a suggestion — it's the part of the history above
   * that has stopped on its own, kept visible so the averages can be read
   * against it.
   */
  cancelled: ExcludedSpend[]
  cancelledAnnualCents: number
  /**
   * In the Subscriptions bucket but matching no genre, so overlap detection
   * can't see them. Surfaced rather than dropped: a service missing from the
   * genre lists is invisible to every comparison on this panel, and silence
   * is exactly how that goes unnoticed.
   */
  ungrouped: {name: string; annualCents: number}[]
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

const annualise = (windowTotal: number, months: number) =>
  months === 0 ? 0 : Math.round((windowTotal / months) * 12)

const perWeek = (annual: number) => Math.round(annual / 52)

function opportunity(
  fields: Omit<Opportunity, "perWeekCents">,
): Opportunity {
  return {...fields, perWeekCents: perWeek(fields.annualCents)}
}

/* -- Fees and interest ---------------------------------------------- */

/**
 * Charges that buy nothing. Phrases rather than single words, because
 * "interest" and "fee" on their own collide with ordinary merchant names.
 */
const FEE_PHRASES = [
  "account fee",
  "monthly account fee",
  "annual fee",
  "card fee",
  "service fee",
  "maintenance fee",
  "overdrawn",
  "overdraw",
  "dishonour",
  "dishonor",
  "late fee",
  "late payment",
  "overdue fee",
  "penalty",
  "interest charge",
  "interest charged",
  "purchase interest",
  "cash advance",
  "atm fee",
  "atm operator fee",
  "withdrawal fee",
  "foreign transaction fee",
  "international transaction fee",
  "currency conversion fee",
  "overseas transaction fee",
]

const FEE_PATTERN = new RegExp(
  `(?<![a-z0-9])(${FEE_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![a-z0-9])`,
  "i",
)

/** Whether a description names a fee, penalty or interest charge. */
export function isFeeCharge(description: string): boolean {
  return FEE_PATTERN.test(description)
}

function feeOpportunity(
  spend: UpTransaction[],
  months: number,
): Opportunity | null {
  const charges = spend.filter((tx) => isFeeCharge(tx.attributes.description))
  if (charges.length === 0) return null

  const total = charges.reduce((sum, tx) => sum + Math.abs(cents(tx)), 0)
  if (total === 0) return null

  const byMerchant = new Map<string, {total: number; count: number}>()
  for (const tx of charges) {
    const key = tx.attributes.description.trim()
    const entry = byMerchant.get(key) ?? {total: 0, count: 0}
    entry.total += Math.abs(cents(tx))
    entry.count += 1
    byMerchant.set(key, entry)
  }

  return opportunity({
    id: "fees",
    kind: "fees",
    title: "Fees and interest",
    detail: `${charges.length} charges over ${months} months that bought nothing — fees, penalties and interest.`,
    action:
      "Every one of these is avoidable: switch the account, pay before the due date, or use a card without the foreign-transaction fee.",
    annualCents: annualise(total, months),
    evidence: [...byMerchant.entries()]
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5)
      .map(([label, {total: value, count}]) => ({
        label,
        value: `$${(value / 100).toFixed(2)}`,
        note: `${count}×`,
      })),
  })
}

/* -- Overlapping subscriptions -------------------------------------- */

type MerchantTotal = {key: string; name: string; total: number; count: number}

function subscriptionTotals(
  spend: UpTransaction[],
): Map<string, MerchantTotal> {
  const totals = new Map<string, MerchantTotal>()

  for (const tx of spend) {
    if (bucketOf(tx) !== "subscriptions") continue
    // Suggesting you drop a service you already dropped is worse than saying
    // nothing — it makes every other row on the panel suspect.
    if (isCancelledMerchant(tx.attributes.description)) continue
    const key = merchantKey(tx)
    const entry = totals.get(key) ?? {
      key,
      name: tx.attributes.description.trim(),
      total: 0,
      count: 0,
    }
    entry.total += Math.abs(cents(tx))
    entry.count += 1
    totals.set(key, entry)
  }

  return totals
}

function overlapOpportunities(
  merchants: MerchantTotal[],
  months: number,
): {opportunities: Opportunity[]; claimed: Set<string>} {
  const byGenre = new Map<SubscriptionGenre, MerchantTotal[]>()

  for (const merchant of merchants) {
    const genre = subscriptionGenre(merchant.name)
    if (!genre || !SUBSCRIPTION_GENRES[genre].overlapping) continue
    const list = byGenre.get(genre) ?? []
    list.push(merchant)
    byGenre.set(genre, list)
  }

  const opportunities: Opportunity[] = []
  const claimed = new Set<string>()

  for (const [genre, list] of byGenre) {
    if (list.length < 2) continue

    const sorted = [...list].sort((a, b) => b.total - a.total)
    const combined = sorted.reduce((sum, m) => sum + m.total, 0)
    // Keeping the one you spend most on is the conservative read: it says
    // nothing about which you watch, only what the saving looks like if the
    // genre collapses to a single service.
    const saving = combined - sorted[0].total
    if (saving === 0) continue

    const label = SUBSCRIPTION_GENRES[genre].label.toLowerCase()
    for (const merchant of sorted) claimed.add(merchant.key)

    opportunities.push(
      opportunity({
        id: `overlap-${genre}`,
        kind: "overlap",
        title: `${sorted.length} ${label} services`,
        detail: `They cost ${money(annualise(combined, months))} a year between them. Services in the same genre substitute for each other, so paying for all of them means paying several times for the same evening.`,
        action: `Keep ${sorted[0].name} — the one you spend most on — and drop the rest.`,
        annualCents: annualise(saving, months),
        evidence: sorted.map((merchant) => ({
          label: merchant.name,
          value: money(annualise(merchant.total, months)),
          note: `${merchant.count} charges`,
        })),
      }),
    )
  }

  return {opportunities, claimed}
}

/**
 * Whole dollars once the number is big enough that cents are noise, but exact
 * below that — a subscription going "$14 to $17" hides that it went from
 * $13.99 to $16.99, and the whole point of the row is the precise amount.
 */
function money(value: number): string {
  const dollars = value / 100
  return Math.abs(dollars) < 100
    ? `$${dollars.toFixed(2)}`
    : `$${Math.round(dollars).toLocaleString("en-AU")}`
}

/* -- Price rises ----------------------------------------------------- */

/** A rise has to clear both bars to count: proportional and absolute. */
const RISE_RATIO = 0.05
const RISE_MIN_CENTS = 100

function priceRiseOpportunities(
  buckets: BucketReport,
  spend: UpTransaction[],
  skip: Set<string>,
): Opportunity[] {
  const charges = new Map<string, UpTransaction[]>()
  for (const tx of spend) {
    if (bucketOf(tx) !== "subscriptions") continue
    const key = merchantKey(tx)
    const list = charges.get(key)
    if (list) list.push(tx)
    else charges.set(key, [tx])
  }

  const found: Opportunity[] = []

  for (const sub of buckets.subscriptions) {
    if (skip.has(sub.id)) continue

    const history = (charges.get(sub.id) ?? []).sort(
      (a, b) =>
        new Date(occurredAt(a)).getTime() - new Date(occurredAt(b)).getTime(),
    )
    if (history.length < 4) continue

    const half = Math.floor(history.length / 2)
    const before = median(history.slice(0, half).map((tx) => Math.abs(cents(tx))))
    const after = median(history.slice(half).map((tx) => Math.abs(cents(tx))))

    const delta = after - before
    if (before === 0) continue
    if (delta < RISE_MIN_CENTS) continue
    if (delta / before < RISE_RATIO) continue

    const perYear = CHARGES_PER_YEAR[sub.recurrence]

    found.push(
      opportunity({
        id: `rise-${sub.id}`,
        kind: "price-rise",
        title: `${sub.description} costs more than it did`,
        // The headline figure on this card is the rise, not the bill, so the
        // full price at the new rate is said here rather than left folded
        // away in the evidence — otherwise the small number beside the
        // merchant's name reads as what the merchant costs.
        detail: `It went from ${money(before)} to ${money(after)} a charge partway through the window — ${Math.round((delta / before) * 100)}% more, without you agreeing to anything. At the new price it costs ${money(after * perYear)} a year.`,
        action:
          "Worth deciding again at the new price rather than the old one. Cancelling usually surfaces a retention offer.",
        annualCents: Math.round(delta * perYear),
        evidence: [
          {label: "Was", value: money(before), note: "earlier charges"},
          {label: "Now", value: money(after), note: "recent charges"},
          {
            label: "Full cost",
            value: money(after * perYear),
            note: `${sub.recurrence}, ${perYear}× a year`,
          },
        ],
      }),
    )
  }

  return found.sort((a, b) => b.annualCents - a.annualCents)
}

/* -- Habit spending -------------------------------------------------- */

/** Charges per month before something counts as a habit rather than a treat. */
const HABIT_PER_MONTH = 1.5
/** Above this, it isn't the frequency that's the problem. */
const HABIT_MAX_CENTS = 4000
const HABIT_LIMIT = 3

function habitOpportunities(
  spend: UpTransaction[],
  months: number,
): Opportunity[] {
  const byMerchant = new Map<string, UpTransaction[]>()

  for (const tx of spend) {
    // Subscriptions are handled above, and by definition aren't a habit you
    // can trim a bit — they're all-or-nothing.
    if (bucketOf(tx) === "subscriptions") continue
    if (isCancelledMerchant(tx.attributes.description)) continue
    if (necessityOf(tx) !== "discretionary") continue

    const key = merchantKey(tx)
    const list = byMerchant.get(key)
    if (list) list.push(tx)
    else byMerchant.set(key, [tx])
  }

  const candidates: Opportunity[] = []

  for (const [key, all] of byMerchant) {
    if (all.length < months * HABIT_PER_MONTH) continue

    const amounts = all.map((tx) => Math.abs(cents(tx)))
    const typical = median(amounts)
    if (typical === 0 || typical > HABIT_MAX_CENTS) continue

    const total = amounts.reduce((sum, value) => sum + value, 0)
    const annual = annualise(total, months)
    const perWeekVisits = all.length / (months * WEEKS_PER_MONTH)

    candidates.push(
      opportunity({
        id: `habit-${key}`,
        kind: "habit",
        title: all[0].attributes.description.trim(),
        detail: `${all.length} charges over ${months} months — about ${perWeekVisits.toFixed(1)} a week at ${money(typical)} a time. Individually invisible; ${money(annual)} a year.`,
        action: `Halving it saves ${money(Math.round(annual / 2))} a year and still leaves ${(perWeekVisits / 2).toFixed(1)} a week.`,
        // Halved, not eliminated — a suggestion that assumes you'll stop
        // entirely is a suggestion nobody acts on.
        annualCents: Math.round(annual / 2),
        evidence: [
          {label: "Typical charge", value: money(typical)},
          {label: "Charges", value: String(all.length), note: `${months} months`},
          {label: "Yearly cost", value: money(annual)},
        ],
      }),
    )
  }

  return candidates
    .sort((a, b) => b.annualCents - a.annualCents)
    .slice(0, HABIT_LIMIT)
}

/* -- Drift against your own baseline --------------------------------- */

/** Months at the end of the window treated as "lately". */
const RECENT_MONTHS = 3
const DRIFT_RATIO = 0.15
const DRIFT_MIN_PER_MONTH = 3000

function driftOpportunities(buckets: BucketReport): Opportunity[] {
  if (buckets.months < RECENT_MONTHS * 2) return []

  const found: Opportunity[] = []

  for (const bucket of buckets.buckets) {
    const recent = bucket.monthly.slice(-RECENT_MONTHS)
    const earlier = bucket.monthly.slice(0, -RECENT_MONTHS)
    if (earlier.length === 0) continue

    const recentAvg =
      recent.reduce((sum, m) => sum + m.cents, 0) / recent.length
    const baseline =
      earlier.reduce((sum, m) => sum + m.cents, 0) / earlier.length

    if (baseline === 0) continue
    const delta = recentAvg - baseline
    if (delta < DRIFT_MIN_PER_MONTH) continue
    if (delta / baseline < DRIFT_RATIO) continue
    // Every recent month has to clear the baseline, not just the average of
    // them. Over a short window a single quarterly bill landing in the recent
    // half drags the mean up on its own, and "running hot" is a claim about a
    // sustained change rather than one expensive month.
    if (!recent.every((m) => m.cents > baseline)) continue

    found.push(
      opportunity({
        id: `drift-${bucket.bucket}`,
        kind: "drift",
        title: `${bucket.name} is running hot`,
        detail: `The last ${RECENT_MONTHS} months averaged ${money(recentAvg)} against ${money(baseline)} over the ${earlier.length} before them — ${Math.round((delta / baseline) * 100)}% more.`,
        action: `Getting back to your own ${money(baseline)} a month is worth ${money(delta * 12)} a year. No target invented here — it's what you were already spending.`,
        annualCents: Math.round(delta * 12),
        evidence: [
          {label: "Lately", value: money(recentAvg), note: `${RECENT_MONTHS} months`},
          {label: "Before", value: money(baseline), note: `${earlier.length} months`},
        ],
      }),
    )
  }

  return found.sort((a, b) => b.annualCents - a.annualCents)
}

/* ------------------------------------------------------------------ *
 * Assembly
 * ------------------------------------------------------------------ */

export function buildSavings(
  transactions: UpTransaction[],
  months: MonthBucket[],
  buckets: BucketReport,
  /**
   * One-off purchase ids, held out here for the same reason they're held out
   * of the budget: the necessity split below is read as a share of ongoing
   * spending, and a single $1,279 purchase sitting in "discretionary" would
   * describe a year that already happened rather than the one coming.
   */
  exclude?: Set<string>,
  /**
   * What actually happened, when `transactions` has been restated at current
   * prices by repriceForecast(). Only the price-rise check reads it: a
   * restated stream charges the same amount every month by construction, so
   * measuring rises against it would find none, which is precisely the
   * opposite of the truth.
   */
  history: UpTransaction[] = transactions,
): SavingsReport {
  const windowKeys = new Set(months.map((m) => m.key))
  const count = months.length

  // Completed months only, spending only — the same basis as every average
  // on the page, so the two can be compared without a footnote.
  const inWindow = (tx: UpTransaction) =>
    isCashflow(tx) &&
    cents(tx) < 0 &&
    !exclude?.has(tx.id) &&
    windowKeys.has(monthKeyOf(occurredAt(tx)))

  const spend = transactions.filter(inWindow)
  const realSpend = history === transactions ? spend : history.filter(inWindow)

  let essential = 0
  let discretionary = 0
  let unclear = 0

  for (const tx of spend) {
    const amount = Math.abs(cents(tx))
    const necessity = necessityOf(tx)
    if (necessity === "essential") essential += amount
    else if (necessity === "discretionary") discretionary += amount
    else unclear += amount
  }

  const classified = essential + discretionary

  const merchants = [...subscriptionTotals(spend).values()]
  const subscriptionTotal = merchants.reduce((sum, m) => sum + m.total, 0)

  const {opportunities: overlaps, claimed} = overlapOpportunities(
    merchants,
    count,
  )

  const cancelledAnnualCents = annualise(buckets.cancelledTotalCents, count)

  const ungrouped = merchants
    .filter((m) => subscriptionGenre(m.name) === null)
    .map((m) => ({name: m.name, annualCents: annualise(m.total, count)}))
    .sort((a, b) => b.annualCents - a.annualCents)

  const fees = feeOpportunity(spend, count)
  const rises = priceRiseOpportunities(buckets, realSpend, claimed)

  const certain = [...(fees ? [fees] : []), ...overlaps, ...rises].sort(
    (a, b) => b.annualCents - a.annualCents,
  )

  const behavioural = [
    ...habitOpportunities(spend, count),
    ...driftOpportunities(buckets),
  ].sort((a, b) => b.annualCents - a.annualCents)

  const perMonth = (total: number) =>
    count === 0 ? 0 : Math.round(total / count)

  return {
    months: count,
    essentialPerMonthCents: perMonth(essential),
    discretionaryPerMonthCents: perMonth(discretionary),
    unclearPerMonthCents: perMonth(unclear),
    discretionaryShare: classified === 0 ? 0 : discretionary / classified,
    subscriptionAnnualCents: annualise(subscriptionTotal, count),
    subscriptionCount: merchants.length,
    certain,
    behavioural,
    certainAnnualCents: certain.reduce((sum, o) => sum + o.annualCents, 0),
    behaviouralAnnualCents: behavioural.reduce(
      (sum, o) => sum + o.annualCents,
      0,
    ),
    cancelled: buckets.cancelled,
    cancelledAnnualCents,
    ungrouped,
  }
}
