/**
 * Custom spending buckets.
 *
 * Up's own categories are shaped around what a purchase *is*; a budget is
 * shaped around which pot the money comes out of. These four buckets sit on
 * top of the Up categories, plus an "Other" catch-all that names whatever
 * didn't match so gaps in the mapping are visible on the page rather than
 * silently swallowed.
 */

import type {CategoryBudget} from "./analytics"
import {cents, occurredAt, summariseBy} from "./analytics"
import type {MonthBucket} from "./period"
import {monthKeyOf} from "./period"
import type {UpCategory, UpTransaction} from "./types"

export type BucketId = "subscriptions" | "food" | "bills" | "car" | "other"

export const BUCKET_META: Record<
  BucketId,
  {name: string; blurb: string}
> = {
  subscriptions: {
    name: "Subscriptions",
    blurb:
      "Streaming, software and media services — Netflix, Kayo, YouTube, Claude and the like.",
  },
  food: {
    name: "Food",
    blurb: "Groceries, eating out, takeaway and drinks.",
  },
  bills: {
    name: "Bills",
    blurb: "Household running costs — utilities, connectivity, rates, rent.",
  },
  car: {
    name: "Car",
    blurb: "Fuel, rego, insurance, servicing, parking and tolls.",
  },
  other: {
    name: "Other",
    blurb: "Everything not mapped to a bucket. Expand to see what's in here.",
  },
}

/**
 * Up category slug → bucket. This is the knob to turn: move a slug to a
 * different bucket and the whole page follows. Anything not listed falls
 * through to subscription detection, then to Other.
 */
export const CATEGORY_BUCKETS: Record<string, BucketId> = {
  // -- Food ---------------------------------------------------------------
  groceries: "food",
  "restaurants-and-cafes": "food",
  takeaway: "food",
  "pubs-and-bars": "food",
  booze: "food",

  // -- Bills --------------------------------------------------------------
  utilities: "bills",
  internet: "bills",
  "mobile-phone": "bills",
  "home-insurance-and-rates": "bills",
  "rent-and-mortgage": "bills",
  "rates-and-insurance": "bills",

  // -- Car ----------------------------------------------------------------
  fuel: "car",
  "car-insurance-and-maintenance": "car",
  "car-repayments": "car",
  parking: "car",
  "toll-roads": "car",

  // -- Subscriptions ------------------------------------------------------
  // Categories that are subscriptions by nature, so they land here even if
  // the cadence detector can't see enough charges to be sure.
  "tv-music-and-streaming": "subscriptions",
}

/* ------------------------------------------------------------------ *
 * Subscription merchants
 *
 * "Subscriptions" isn't an Up category and it isn't just "anything that
 * recurs" — a gym membership and a car insurance premium both recur without
 * being one. It's a specific class of service, so it's matched by merchant
 * name. Add to this list to claim a merchant.
 *
 * Matching is whole-word and case-insensitive, so "stan" catches Stan but
 * not Stanley's or Instant. Keep entries specific enough not to collide:
 * "amazon prime", not "amazon", or every parcel becomes a subscription.
 *
 * A trailing "*" makes the entry a prefix, so it also matches whatever the
 * card feed glued or chopped onto the end — "youtube*" catches YOUTUBEPREMIUM
 * and the truncated GOOGLE *YOUTUBEPREM alike. Only worth it for names
 * distinctive enough that a prefix can't collide with anything else.
 * ------------------------------------------------------------------ */

export type SubscriptionGenre =
  | "video"
  | "music"
  | "ai"
  | "storage"
  | "creative"
  | "productivity"
  | "security"
  | "gaming"
  | "news"
  | "other"

/**
 * Merchants grouped by what the service actually is.
 *
 * The grouping is what makes "you're paying for four streaming services"
 * answerable. `overlapping` marks the genres where holding several at once is
 * genuinely redundant — four video subscriptions substitute for each other in
 * a way that a password manager and a code host never do.
 */
export const SUBSCRIPTION_GENRES: Record<
  SubscriptionGenre,
  {label: string; overlapping: boolean; merchants: string[]}
> = {
  video: {
    label: "Video streaming",
    overlapping: true,
    merchants: [
      "netflix",
      "kayo",
      "binge",
      "stan",
      "disney",
      "paramount",
      "prime video",
      "amazon prime",
      "foxtel",
      "hayu",
      "britbox",
      "shudder",
      "crunchyroll",
      "mubi",
      "apple tv",
      // Prefix, because Google bills YouTube Premium as one unspaced word and
      // card feeds then truncate it: YOUTUBEPREMIUM, YOUTUBEPREM, YOUTUBETV
      // are all the same subscription. Listing spellings never keeps up.
      "youtube*",
      "twitch",
      "optus sport",
      "dazn",
    ],
  },
  music: {
    label: "Music and audio",
    overlapping: true,
    merchants: [
      "spotify",
      "apple music",
      "tidal",
      "audible",
      "soundcloud",
      "pocket casts",
    ],
  },
  ai: {
    label: "AI assistants",
    overlapping: true,
    merchants: ["claude", "anthropic", "openai", "chatgpt"],
  },
  storage: {
    label: "Cloud storage",
    overlapping: true,
    merchants: [
      "google one",
      "google storage",
      "icloud",
      "dropbox",
      "backblaze",
    ],
  },
  creative: {
    label: "Creative tools",
    overlapping: true,
    merchants: ["adobe", "creative cloud", "figma", "canva"],
  },
  productivity: {
    label: "Productivity and dev",
    // Complementary, not substitutes — nobody drops GitHub because they
    // already pay for Notion.
    overlapping: false,
    merchants: [
      "microsoft 365",
      "office 365",
      "notion",
      "github",
      "vercel",
      "jetbrains",
      "setapp",
      "linear.app",
    ],
  },
  security: {
    label: "Security and VPN",
    overlapping: false,
    merchants: ["1password", "nordvpn", "expressvpn"],
  },
  gaming: {
    label: "Gaming",
    overlapping: true,
    merchants: [
      "playstation",
      "xbox",
      "game pass",
      "nintendo switch online",
      "ea play",
    ],
  },
  news: {
    label: "News and reading",
    overlapping: true,
    merchants: [
      "nytimes",
      "new york times",
      "the guardian",
      "substack",
      "medium.com",
      "kindle unlimited",
      "scribd",
      "the australian",
      "sydney morning herald",
      "the age",
    ],
  },
  other: {
    label: "Other services",
    overlapping: false,
    merchants: [
      "patreon",
      "duolingo",
      "strava",
      // Umbrella descriptors: these bill for anything Apple sells, so they
      // belong in the bucket but can't be compared against a named service.
      "apple.com/bill",
      "apple services",
      // Deliberately omitted: "headspace" — in Australia that's also a
      // bulk-billed youth mental health service, and misfiling a medical
      // visit as a subscription is worse than missing the meditation app,
      // which the candidates list will surface anyway.
    ],
  },
}

/** Every named service, flattened. */
export const SUBSCRIPTION_MERCHANTS: string[] = Object.values(
  SUBSCRIPTION_GENRES,
).flatMap((genre) => genre.merchants)

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/**
 * Alphanumeric lookarounds rather than \b, because several entries end in
 * punctuation — \b after the "+" in "disney+" can never match, since the
 * following character is a space or end-of-string.
 */
export function merchantPattern(merchants: string[]): RegExp {
  const alternatives = merchants.map((entry) =>
    entry.endsWith("*")
      ? // Prefix entry: absorb the rest of the word so the closing lookaround
        // lands on a real boundary rather than mid-token.
        `${escapeRegex(entry.slice(0, -1))}[a-z0-9]*`
      : escapeRegex(entry),
  )

  return new RegExp(
    `(?<![a-z0-9])(${alternatives.join("|")})(?![a-z0-9])`,
    "i",
  )
}

const SUBSCRIPTION_PATTERN = merchantPattern(SUBSCRIPTION_MERCHANTS)

const GENRE_PATTERNS = (
  Object.keys(SUBSCRIPTION_GENRES) as SubscriptionGenre[]
).map((id) => [id, merchantPattern(SUBSCRIPTION_GENRES[id].merchants)] as const)

/** Which kind of service a description names, or null if it names none. */
export function subscriptionGenre(
  description: string,
): SubscriptionGenre | null {
  for (const [id, pattern] of GENRE_PATTERNS) {
    if (pattern.test(description)) return id
  }
  return null
}

/** Whether a transaction description names a known subscription service. */
export function isSubscriptionMerchant(description: string): boolean {
  return SUBSCRIPTION_PATTERN.test(description)
}

/* ------------------------------------------------------------------ *
 * Cancelled services
 *
 * A service cancelled last month still has charges sitting in a year-long
 * window, and every one of them is real — the money did leave the account.
 * What isn't real is the implication that it will happen again. So cancelled
 * merchants stay in the history and drop out of everything forward-looking:
 * they are not a duplicate to drop, a price rise to renegotiate, or a
 * candidate to file away.
 *
 * Bucketing is deliberately left alone. Entries here can be ordinary words —
 * "bounce" matches a trampoline park as readily as a subscription — so an
 * entry can only ever remove a suggestion, never move spending into a
 * different bucket.
 * ------------------------------------------------------------------ */

export const CANCELLED_MERCHANTS: string[] = [
  "amazon prime",
  // The same subscription as Amazon Prime in Australia; Up sees either
  // descriptor depending on what the charge was for.
  "prime video",
  "binge",
  "disney",
  "bounce",
  "reckon",
  // Whole-word matching is what keeps this one safe: "stan" can't match
  // Stanley, Instant or Stanmore.
  "stan",
  "peloton",
  "healesville stockfeeds",
]

const CANCELLED_PATTERN = merchantPattern(CANCELLED_MERCHANTS)

/**
 * Whether a description names something already cancelled. The length check
 * matters: an empty list compiles to a pattern that matches every string.
 */
export function isCancelledMerchant(description: string): boolean {
  return CANCELLED_MERCHANTS.length > 0 && CANCELLED_PATTERN.test(description)
}

/* ------------------------------------------------------------------ *
 * Arrangements that have ended
 *
 * "Cancelled" covers a service you stopped paying for. It's the wrong word
 * for spending that stopped because the arrangement behind it changed —
 * money you used to set aside and no longer have to, a debt that's now paid
 * off, a cost someone else picked up. Same confidence as a cancellation
 * (you're telling the app, not being guessed at) and the same effect, but
 * the page says something true about it, and each entry carries the reason
 * in your words so the exclusion can still be audited a year from now.
 * ------------------------------------------------------------------ */

export type FinishedArrangement = {
  /** Every descriptor the arrangement shows up under. */
  merchants: string[]
  /** Why it won't happen again. Shown on the page verbatim. */
  why: string
}

export const FINISHED_ARRANGEMENTS: FinishedArrangement[] = [
  {
    // Up already ignores "Transfer to GST/TAX" — it flags that one as an
    // internal transfer, so it was never in the forecast. These three are
    // paid out to the ATO or to a saver Up doesn't recognise as yours, so
    // they read as ordinary spending and need saying out loud.
    merchants: [
      "tax office payments",
      "transfer to ato tax bill",
      "australian taxation office",
    ],
    why: "Your accountant withholds tax from your income now, so there's nothing left to set aside or pay. Your take-home figure is already net of it.",
  },
]

const FINISHED_RULES = FINISHED_ARRANGEMENTS.map((entry) => ({
  pattern: merchantPattern(entry.merchants),
  why: entry.why,
}))

/** Why this spending has ended, or null if it hasn't. */
export function finishedReason(description: string): string | null {
  for (const rule of FINISHED_RULES) {
    if (rule.pattern.test(description)) return rule.why
  }
  return null
}

/* ------------------------------------------------------------------ *
 * One-off purchases
 *
 * A budget average divides everything by the window, which quietly assumes
 * everything repeats. A $1,279 purchase inside a year therefore reads as $107
 * a month forever, and "put away each week" inherits the lie.
 *
 * No window separates a genuine one-off from a yearly bill on rhythm alone —
 * across twelve months both are a single charge. That's what the category
 * guard below is for, and why this stays a list you can curate. Nothing here
 * is deleted from the history; it's only held out of the averages.
 * ------------------------------------------------------------------ */

export const ONE_OFF_MERCHANTS: string[] = ["sky music"]

const ONE_OFF_PATTERN = merchantPattern(ONE_OFF_MERCHANTS)

/** Whether a description names a purchase you've marked as never repeating. */
export function isOneOffMerchant(description: string): boolean {
  return ONE_OFF_MERCHANTS.length > 0 && ONE_OFF_PATTERN.test(description)
}

/** Big enough that amortising it visibly moves the weekly figure. */
const ONE_OFF_MIN_CENTS = 30_000

/**
 * Single charges that won't repeat, at merchants that will.
 *
 * ONE_OFF_MERCHANTS is the wrong instrument when the payee is a person you
 * transact with constantly and only one payment was extraordinary — naming
 * them there deletes the whole relationship from the forecast, which for a
 * shared-household payee is thousands of dollars of real, recurring cost.
 * A rule here removes the matching charges and leaves the rest alone.
 *
 * The amount is the identifier because it's what you can actually see on a
 * statement; Up's transaction ids are invisible from the app. Every charge at
 * that merchant for exactly that amount is held out, which is the intended
 * behaviour when the same extraordinary payment was made more than once.
 */
export type OneOffCharge = {
  /** Matched like every merchant list here: whole word, case-insensitive. */
  merchant: string
  /** Exact amount in dollars, as it appears on the statement. */
  amount: number
}

export const ONE_OFF_CHARGES: OneOffCharge[] = [
  // Two payments of the same unusual size four weeks apart, sitting in an
  // otherwise ordinary stream of shared household costs.
  {merchant: "melissaerinn", amount: 4893},
]

const ONE_OFF_CHARGE_RULES = ONE_OFF_CHARGES.map((rule) => ({
  pattern: merchantPattern([rule.merchant]),
  cents: Math.round(rule.amount * 100),
}))

/** Whether this exact charge is named in ONE_OFF_CHARGES. */
export function isOneOffCharge(tx: UpTransaction): boolean {
  const amount = Math.abs(cents(tx))
  return ONE_OFF_CHARGE_RULES.some(
    (rule) =>
      rule.cents === amount && rule.pattern.test(tx.attributes.description),
  )
}

export type ExcludedSpend = {
  key: string
  name: string
  /** What it cost inside the window. */
  totalCents: number
  count: number
  lastChargedAt: string
}

/**
 * What the cancelled merchants cost while they were still running.
 *
 * This is the figure to subtract from the averages on the page: across the
 * window it was genuinely spent, and from here it isn't.
 */
export function tallyMerchants(
  transactions: UpTransaction[],
  within: Set<string>,
  matches: (description: string) => boolean,
): ExcludedSpend[] {
  const totals = new Map<string, ExcludedSpend>()

  for (const tx of transactions) {
    if (tx.relationships.transferAccount.data !== null) continue
    if (cents(tx) >= 0) continue
    if (!within.has(monthKeyOf(occurredAt(tx)))) continue
    if (!matches(tx.attributes.description)) continue

    const at = occurredAt(tx)
    const key = merchantKey(tx)
    const entry = totals.get(key) ?? {
      key,
      name: tx.attributes.description.trim(),
      totalCents: 0,
      count: 0,
      lastChargedAt: at,
    }
    entry.totalCents += Math.abs(cents(tx))
    entry.count += 1
    // Compared as instants, not strings — Up stamps a UTC offset, so two
    // timestamps either side of a DST change don't sort lexicographically.
    if (Date.parse(at) > Date.parse(entry.lastChargedAt)) {
      entry.lastChargedAt = at
    }
    totals.set(key, entry)
  }

  return [...totals.values()].sort((a, b) => b.totalCents - a.totalCents)
}

/** Categories where a single large charge is a bill, not a splurge. */
const LUMPY_BILL_CATEGORIES = new Set([
  "car-insurance-and-maintenance",
  "car-repayments",
  "rates-and-insurance",
  "home-insurance-and-rates",
  "home-maintenance-and-improvements",
  "health-and-medical",
  "education-and-student-loans",
  "life-admin",
])

function isLumpyBill(tx: UpTransaction): boolean {
  const childId = tx.relationships.category.data?.id
  if (childId && LUMPY_BILL_CATEGORIES.has(childId)) return true
  const parentId = tx.relationships.parentCategory.data?.id
  return parentId ? LUMPY_BILL_CATEGORIES.has(parentId) : false
}

export type OneOffReport = {
  /** Transaction ids to hold out of the forward-looking averages. */
  ids: Set<string>
  /** The same purchases, summarised for display. */
  items: ExcludedSpend[]
}

/**
 * Purchases that shouldn't set a budget: a merchant seen exactly once in the
 * window at a size that visibly moves the average, plus anything explicitly
 * listed in ONE_OFF_MERCHANTS.
 *
 * The guard that makes this safe is LUMPY_BILL_CATEGORIES. A single $1,200
 * charge is equally consistent with new speakers and with an annual insurance
 * premium, and dropping the premium would leave a real bill unfunded — so
 * single charges filed under insurance, rego, health and the like stay in.
 * Everything held out is listed on the page rather than silently removed.
 */
export function findOneOffs(
  transactions: UpTransaction[],
  within: Set<string>,
): OneOffReport {
  const byMerchant = new Map<string, UpTransaction[]>()

  for (const tx of transactions) {
    if (tx.relationships.transferAccount.data !== null) continue
    if (cents(tx) >= 0) continue
    if (!within.has(monthKeyOf(occurredAt(tx)))) continue
    const key = merchantKey(tx)
    const list = byMerchant.get(key)
    if (list) list.push(tx)
    else byMerchant.set(key, [tx])
  }

  const ids = new Set<string>()
  const held: UpTransaction[] = []

  for (const all of byMerchant.values()) {
    // An explicit listing wins outright, however often it charged.
    if (isOneOffMerchant(all[0].attributes.description)) {
      for (const tx of all) {
        ids.add(tx.id)
        held.push(tx)
      }
      continue
    }

    // A named charge takes only itself out. Everything else this merchant
    // does stays in the forecast, which is the whole point of the rule.
    const listed = all.filter(isOneOffCharge)
    if (listed.length > 0) {
      for (const tx of listed) {
        ids.add(tx.id)
        held.push(tx)
      }
      continue
    }

    if (all.length !== 1) continue
    const tx = all[0]
    if (Math.abs(cents(tx)) < ONE_OFF_MIN_CENTS) continue
    if (isLumpyBill(tx)) continue
    ids.add(tx.id)
    held.push(tx)
  }

  const totals = new Map<string, ExcludedSpend>()
  for (const tx of held) {
    const key = merchantKey(tx)
    const entry = totals.get(key) ?? {
      key,
      name: tx.attributes.description.trim(),
      totalCents: 0,
      count: 0,
      lastChargedAt: occurredAt(tx),
    }
    entry.totalCents += Math.abs(cents(tx))
    entry.count += 1
    if (Date.parse(occurredAt(tx)) > Date.parse(entry.lastChargedAt)) {
      entry.lastChargedAt = occurredAt(tx)
    }
    totals.set(key, entry)
  }

  return {
    ids,
    items: [...totals.values()].sort((a, b) => b.totalCents - a.totalCents),
  }
}

/* ------------------------------------------------------------------ *
 * Forecast basis
 *
 * Everything above measures a year that already happened. A forecast is a
 * different claim — that next year looks like last year — and the only way to
 * make it honestly is to take out the parts of last year that demonstrably
 * won't repeat.
 *
 * Three things qualify, in descending order of confidence:
 *
 *   cancelled  You said so. Ground truth, no inference involved.
 *   finished   You said so, about an arrangement rather than a service —
 *              tax you no longer set aside, a loan that's paid off.
 *   one-off    A single large purchase at a merchant seen once, guarded by
 *              category so annual premiums survive.
 *   dormant    A merchant that charged on a rhythm and then stopped, with the
 *              silence measured against its own rhythm rather than a fixed
 *              cutoff — three monthly charges then nothing for a quarter is a
 *              cancellation you forgot to mention.
 *
 * What is deliberately NOT excluded is anything irregular but alive. You will
 * eat at a restaurant again even though no individual restaurant recurs, so
 * merchant-level rarity is never grounds for removal on its own. A forecast
 * built only from merchants that bill monthly would be a rent-and-Netflix
 * number, and it would be wrong by thousands.
 * ------------------------------------------------------------------ */

export type ExclusionReason =
  | "cancelled"
  | "finished"
  | "one-off"
  | "dormant"

export const EXCLUSION_LABEL: Record<ExclusionReason, string> = {
  cancelled: "Cancelled",
  finished: "Finished",
  "one-off": "One-off",
  dormant: "Gone quiet",
}

export type HeldSpend = ExcludedSpend & {
  reason: ExclusionReason
  /** Why this merchant was held out, in words, for the page to show. */
  why: string
}

export type ForecastBasis = {
  /** Transaction ids held out of every forward-looking figure on the page. */
  ids: Set<string>
  held: HeldSpend[]
  /** Window totals held out, split by reason. */
  byReason: Record<ExclusionReason, number>
  /** Everything held out, across the window. */
  totalCents: number
  perMonthCents: number
}

/**
 * Merchants that go quiet without going away — seasonal bills, anything you
 * only touch in winter, an insurer that renews once a year under a name that
 * looks like an ordinary shop. Listing one here exempts it from dormancy
 * detection and nothing else.
 *
 * This is the knob to reach for when the "Gone quiet" panel is wrong.
 */
export const ALWAYS_RECURRING_MERCHANTS: string[] = []

const ALWAYS_RECURRING_PATTERN = merchantPattern(ALWAYS_RECURRING_MERCHANTS)

export function isAlwaysRecurring(description: string): boolean {
  return (
    ALWAYS_RECURRING_MERCHANTS.length > 0 &&
    ALWAYS_RECURRING_PATTERN.test(description)
  )
}

/**
 * Two gaps is the fewest that can establish a rhythm to measure silence
 * against — counted in distinct days, not charges, because four taps at the
 * same venue in one evening is one visit.
 */
const DORMANT_MIN_DAYS_CHARGED = 3
/**
 * How uneven those gaps may be and still count as a rhythm. Groceries and
 * fuel are bought when they run out: a median gap of eight days sitting
 * beside a normal gap of forty-five isn't a schedule, it's a habit with a
 * convenient middle, and reading eleven weeks of quiet as "cancelled" would
 * take groceries out of a grocery budget. Above this ratio the merchant never
 * had a rhythm, so its silence says nothing and it stays in.
 */
const DORMANT_MAX_GAP_SPREAD = 2.5
/** Silence has to run this many times the merchant's own typical gap. */
const DORMANT_GAP_MULTIPLE = 3
/**
 * ...and never less than this, so a weekly merchant needs a genuine absence
 * rather than a fortnight's holiday to be declared finished.
 */
const DORMANT_MIN_DAYS = 75

/**
 * Everything the forecast holds out, with the reason attached to each one.
 *
 * `within` is the completed window; recency is judged against `now` using
 * every transaction given, current month included, so a merchant that charged
 * yesterday can never be called dormant on the strength of an older rhythm.
 */
export function buildForecastBasis(
  transactions: UpTransaction[],
  within: Set<string>,
  now: number = Date.now(),
): ForecastBasis {
  const oneOffs = findOneOffs(transactions, within)

  /** Every window charge, grouped by merchant. */
  const inWindow = new Map<string, UpTransaction[]>()
  /** Latest charge per merchant across all history given, window or not. */
  const lastSeen = new Map<string, number>()

  for (const tx of transactions) {
    if (tx.relationships.transferAccount.data !== null) continue
    if (cents(tx) >= 0) continue

    const key = merchantKey(tx)
    const at = Date.parse(occurredAt(tx))
    if (at > (lastSeen.get(key) ?? 0)) lastSeen.set(key, at)

    if (!within.has(monthKeyOf(occurredAt(tx)))) continue
    const list = inWindow.get(key)
    if (list) list.push(tx)
    else inWindow.set(key, [tx])
  }

  const ids = new Set<string>()
  const reasons = new Map<string, ExclusionReason>()
  const whys = new Map<string, string>()

  const hold = (
    charges: UpTransaction[],
    reason: ExclusionReason,
    why: string,
  ) => {
    const key = merchantKey(charges[0])
    reasons.set(key, reason)
    whys.set(key, why)
    for (const tx of charges) ids.add(tx.id)
  }

  for (const [key, charges] of inWindow) {
    const description = charges[0].attributes.description

    // Declared beats inferred: if you've said it's cancelled, no amount of
    // rhythm in the history argues otherwise.
    if (isCancelledMerchant(description)) {
      hold(charges, "cancelled", "You've marked this as cancelled.")
      continue
    }

    const finished = finishedReason(description)
    if (finished !== null) {
      hold(charges, "finished", finished)
      continue
    }

    const heldCharges = charges.filter((tx) => oneOffs.ids.has(tx.id))
    if (heldCharges.length > 0) {
      hold(
        heldCharges,
        "one-off",
        isOneOffMerchant(description)
          ? "Listed in ONE_OFF_MERCHANTS — nothing from this merchant is expected again."
          : heldCharges.some(isOneOffCharge)
            ? `Listed in ONE_OFF_CHARGES. Only ${heldCharges.length === 1 ? "this charge is" : `these ${heldCharges.length} charges are`} held out; the rest of what you spend here stays in the forecast.`
            : "A single purchase, large enough to distort an average and filed under a category where that means a splurge rather than a bill.",
      )
      continue
    }

    if (isAlwaysRecurring(description)) continue
    // A lumpy bill is supposed to be quiet. Silence is its normal state.
    if (charges.some(isLumpyBill)) continue
    // Up stamps a local offset, so the first ten characters are the calendar
    // day the charge happened on where it happened.
    const dayKeys = [
      ...new Set(charges.map((tx) => occurredAt(tx).slice(0, 10))),
    ].sort()
    if (dayKeys.length < DORMANT_MIN_DAYS_CHARGED) continue

    const days = dayKeys.map((day) => Date.parse(`${day}T00:00:00Z`) / DAY_MS)
    const gaps: number[] = []
    for (let i = 1; i < days.length; i++) gaps.push(days[i] - days[i - 1])

    const typicalGap = median(gaps)
    if (typicalGap <= 0) continue
    if (Math.max(...gaps) > typicalGap * DORMANT_MAX_GAP_SPREAD) continue

    const silentDays = (now - (lastSeen.get(key) ?? 0)) / DAY_MS
    const threshold = Math.max(
      typicalGap * DORMANT_GAP_MULTIPLE,
      DORMANT_MIN_DAYS,
    )
    if (silentDays < threshold) continue

    hold(
      charges,
      "dormant",
      `Charged on ${dayKeys.length} days about ${Math.round(typicalGap)} days apart, then nothing for ${Math.round(silentDays)}.`,
    )
  }

  const totals = new Map<string, HeldSpend>()
  for (const tx of transactions) {
    if (!ids.has(tx.id)) continue
    const key = merchantKey(tx)
    const entry = totals.get(key) ?? {
      key,
      name: tx.attributes.description.trim(),
      totalCents: 0,
      count: 0,
      lastChargedAt: occurredAt(tx),
      reason: reasons.get(key) ?? "one-off",
      why: whys.get(key) ?? "",
    }
    entry.totalCents += Math.abs(cents(tx))
    entry.count += 1
    if (Date.parse(occurredAt(tx)) > Date.parse(entry.lastChargedAt)) {
      entry.lastChargedAt = occurredAt(tx)
    }
    totals.set(key, entry)
  }

  const held = [...totals.values()].sort((a, b) => b.totalCents - a.totalCents)
  const byReason: Record<ExclusionReason, number> = {
    cancelled: 0,
    finished: 0,
    "one-off": 0,
    dormant: 0,
  }
  for (const item of held) byReason[item.reason] += item.totalCents

  const totalCents = held.reduce((sum, item) => sum + item.totalCents, 0)
  const months = within.size

  return {
    ids,
    held,
    byReason,
    totalCents,
    perMonthCents: months === 0 ? 0 : Math.round(totalCents / months),
  }
}


/* ------------------------------------------------------------------ *
 * Recurring-charge detection
 *
 * Not used to fill the Subscriptions bucket — that's the merchant list
 * above. This finds things that *behave* like subscriptions but aren't
 * claimed by any bucket, so they can be surfaced as candidates to add.
 * ------------------------------------------------------------------ */

export type Recurrence = "weekly" | "fortnightly" | "monthly" | "quarterly"

const CADENCES: {id: Recurrence; days: number; label: string}[] = [
  {id: "weekly", days: 7, label: "Weekly"},
  {id: "fortnightly", days: 14, label: "Fortnightly"},
  {id: "monthly", days: 30.44, label: "Monthly"},
  {id: "quarterly", days: 91.3, label: "Quarterly"},
]

export const RECURRENCE_LABEL: Record<Recurrence, string> = {
  weekly: "Weekly",
  fortnightly: "Fortnightly",
  monthly: "Monthly",
  quarterly: "Quarterly",
}

/** How many times a year each rhythm bills. */
export const CHARGES_PER_YEAR: Record<Recurrence, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  quarterly: 4,
}

/**
 * Three charges is the minimum that can show a rhythm: two only give one gap,
 * which any pair of unrelated purchases would satisfy.
 */
const MIN_CHARGES = 3
/** A charge counts as "the same amount" within this much of the median. */
const AMOUNT_TOLERANCE = 0.2
/** And "the same gap" within this much of the median gap. */
const GAP_TOLERANCE = 0.35

export type Subscription = {
  /** Normalised merchant description, used as the grouping id. */
  id: string
  description: string
  recurrence: Recurrence
  /** The typical charge, i.e. the median. */
  typicalCents: number
  count: number
  lastChargedAt: string
  /** One of the matching transactions, so callers can re-bucket it. */
  sample: UpTransaction
}

/** Merchant names arrive with inconsistent casing and padding. */
export function merchantKey(tx: UpTransaction): string {
  return tx.attributes.description.trim().toLowerCase()
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid]
}

const DAY_MS = 86_400_000

/**
 * Finds merchants that charge on a regular rhythm across the window.
 * `within` is the set of month keys to consider.
 */
export function detectSubscriptions(
  transactions: UpTransaction[],
  within: Set<string>,
): Subscription[] {
  const byMerchant = new Map<string, UpTransaction[]>()

  for (const tx of transactions) {
    if (tx.relationships.transferAccount.data !== null) continue
    if (cents(tx) >= 0) continue
    if (!within.has(monthKeyOf(occurredAt(tx)))) continue

    const key = merchantKey(tx)
    const list = byMerchant.get(key)
    if (list) list.push(tx)
    else byMerchant.set(key, [tx])
  }

  const found: Subscription[] = []

  for (const [key, all] of byMerchant) {
    if (all.length < MIN_CHARGES) continue

    const amounts = all.map((tx) => Math.abs(cents(tx)))
    const typical = median(amounts)
    if (typical === 0) continue

    // Keep only the charges at the going rate — a price rise mid-window
    // shouldn't disqualify an otherwise obvious subscription, but a merchant
    // you happen to visit at wildly varying amounts isn't one.
    const consistent = all
      .filter(
        (tx) =>
          Math.abs(Math.abs(cents(tx)) - typical) / typical <=
          AMOUNT_TOLERANCE,
      )
      .sort(
        (a, b) =>
          new Date(occurredAt(a)).getTime() - new Date(occurredAt(b)).getTime(),
      )

    if (consistent.length < MIN_CHARGES) continue

    const gaps: number[] = []
    for (let i = 1; i < consistent.length; i++) {
      const days =
        (new Date(occurredAt(consistent[i])).getTime() -
          new Date(occurredAt(consistent[i - 1])).getTime()) /
        DAY_MS
      gaps.push(days)
    }

    const typicalGap = median(gaps)
    if (typicalGap <= 0) continue

    // The gaps have to agree with each other...
    const steady =
      gaps.filter(
        (gap) => Math.abs(gap - typicalGap) / typicalGap <= GAP_TOLERANCE,
      ).length /
        gaps.length >=
      0.7
    if (!steady) continue

    // ...and land on a rhythm a subscription actually uses.
    const cadence = CADENCES.find(
      (c) => Math.abs(typicalGap - c.days) / c.days <= GAP_TOLERANCE,
    )
    if (!cadence) continue

    const last = consistent[consistent.length - 1]
    found.push({
      id: key,
      description: last.attributes.description.trim(),
      recurrence: cadence.id,
      typicalCents: Math.round(typical),
      count: consistent.length,
      lastChargedAt: occurredAt(last),
      sample: last,
    })
  }

  return found.sort((a, b) => b.typicalCents - a.typicalCents)
}

/* ------------------------------------------------------------------ *
 * Bucketing
 * ------------------------------------------------------------------ */

export type BucketSummary = CategoryBudget & {
  bucket: BucketId
  blurb: string
  /** Categories inside the bucket — or merchants, for Subscriptions. */
  children: CategoryBudget[]
}

export type BucketReport = {
  months: number
  from: string
  to: string
  buckets: BucketSummary[]
  totalCents: number
  perMonthCents: number
  perWeekCents: number
  /** Billing rhythm for merchants in the Subscriptions bucket. */
  subscriptions: Subscription[]
  /**
   * Merchants that charge on a regular rhythm but aren't claimed by any
   * bucket — the shortlist of things worth adding to SUBSCRIPTION_MERCHANTS.
   */
  candidates: Subscription[]
  /** Named in CANCELLED_MERCHANTS and still charging somewhere in the window. */
  cancelled: ExcludedSpend[]
  cancelledTotalCents: number
  cancelledPerMonthCents: number
  /**
   * Everything the forecast holds out — cancelled, one-off and dormant alike,
   * each carrying the reason it was dropped. Listed on the page rather than
   * silently removed: a forecast you can't audit is a guess with a font.
   */
  held: HeldSpend[]
  heldTotalCents: number
  heldPerMonthCents: number
  heldByReason: Record<ExclusionReason, number>
  /**
   * What the window genuinely cost, before anything was held out. The figures
   * above are a forecast; this one is a fact, and the page shows both so the
   * difference between them is always visible.
   */
  actualTotalCents: number
  actualPerMonthCents: number
  actualPerWeekCents: number
}

const WEEKS_PER_MONTH = 52 / 12

/**
 * Which bucket a transaction belongs to.
 *
 * A named subscription merchant wins outright: Up files YouTube under
 * Technology and Claude under Life Admin, so waiting for the category map
 * would scatter them. Everything else goes by category.
 */
export function bucketOf(tx: UpTransaction): BucketId {
  if (isSubscriptionMerchant(tx.attributes.description)) return "subscriptions"

  const categoryId = tx.relationships.category.data?.id
  const mapped = categoryId ? CATEGORY_BUCKETS[categoryId] : undefined
  if (mapped) return mapped

  const parentId = tx.relationships.parentCategory.data?.id
  const mappedParent = parentId ? CATEGORY_BUCKETS[parentId] : undefined
  if (mappedParent) return mappedParent

  return "other"
}

export function buildBuckets(
  transactions: UpTransaction[],
  categories: UpCategory[],
  months: MonthBucket[],
  currentKey: string,
  /** Shared with buildBudget so the two reports can't disagree. */
  basis?: ForecastBasis,
  /**
   * What actually happened, when `transactions` has been restated at current
   * prices by repriceForecast(). Everything that reports on the past rather
   * than the year ahead — what the window really cost, which merchants are
   * still charging, what rhythm each subscription bills on — is measured
   * against this. Defaults to `transactions`, i.e. no repricing.
   */
  history: UpTransaction[] = transactions,
): BucketReport {
  const names = new Map(categories.map((c) => [c.id, c.attributes.name]))
  const windowKeys = new Set([...months.map((m) => m.key), currentKey])

  const recurring = detectSubscriptions(history, windowKeys)

  // Completed months only, so these can be read against perMonthCents without
  // the part-finished current month dragging the average down.
  const completedKeys = new Set(months.map((m) => m.key))

  const forecast = basis ?? buildForecastBasis(history, completedKeys)
  // Held out of every figure below. The buckets have to agree with the budget
  // headline, or "where it goes" stops adding up to what you put away.
  const spending = transactions.filter((tx) => !forecast.ids.has(tx.id))

  // Tallied from the unfiltered history on purpose: cancelled merchants are
  // now held out of `spending` entirely, so counting them there would report
  // zero and the "already cancelled" panel would go blank the moment it
  // started working.
  const cancelled = tallyMerchants(history, completedKeys, isCancelledMerchant)
  const cancelledTotalCents = cancelled.reduce(
    (sum, service) => sum + service.totalCents,
    0,
  )

  const heldKeys = new Set(forecast.held.map((item) => item.key))

  const actualTotalCents = history.reduce((sum, tx) => {
    if (tx.relationships.transferAccount.data !== null) return sum
    const amount = cents(tx)
    if (amount >= 0) return sum
    return completedKeys.has(monthKeyOf(occurredAt(tx)))
      ? sum + Math.abs(amount)
      : sum
  }, 0)

  const top = summariseBy(spending, months, currentKey, (tx) => {
    const id = bucketOf(tx)
    return {id, name: BUCKET_META[id].name}
  })

  const buckets: BucketSummary[] = top.map((row) => {
    const id = row.id as BucketId
    const inBucket = spending.filter((tx) => bucketOf(tx) === id)

    // Subscriptions are only meaningful merchant by merchant; every other
    // bucket breaks down into the Up categories that fed it.
    const children =
      id === "subscriptions"
        ? summariseBy(inBucket, months, currentKey, (tx) => ({
            id: merchantKey(tx),
            name: tx.attributes.description.trim(),
          }))
        : summariseBy(inBucket, months, currentKey, (tx) => {
            const categoryId =
              tx.relationships.category.data?.id ??
              tx.relationships.parentCategory.data?.id
            return categoryId
              ? {id: categoryId, name: names.get(categoryId) ?? categoryId}
              : {id: "uncategorised", name: "Uncategorised"}
          })

    return {...row, bucket: id, blurb: BUCKET_META[id].blurb, children}
  })

  // Biggest cost first, because that's what's worth acting on — but Other is
  // a residue, not a bucket, so it stays at the bottom regardless of size.
  buckets.sort((a, b) => {
    if (a.bucket === "other") return 1
    if (b.bucket === "other") return -1
    return b.totalCents - a.totalCents
  })

  const totalCents = buckets.reduce((sum, b) => sum + b.totalCents, 0)
  const perMonthCents =
    months.length === 0 ? 0 : Math.round(totalCents / months.length)
  const actualPerMonth =
    months.length === 0 ? 0 : Math.round(actualTotalCents / months.length)

  return {
    months: months.length,
    from: months[0]?.longLabel ?? "",
    to: months[months.length - 1]?.longLabel ?? "",
    buckets,
    totalCents,
    perMonthCents,
    perWeekCents: Math.round(perMonthCents / WEEKS_PER_MONTH),
    // A merchant the forecast dropped has no row left in the table above, so
    // a cadence badge for it would label a line that isn't there — and
    // counting it as a live subscription would overstate the count on a panel
    // whose whole job is telling you how many you're paying for.
    subscriptions: recurring.filter(
      (sub) =>
        bucketOf(sub.sample) === "subscriptions" &&
        !heldKeys.has(merchantKey(sub.sample)),
    ),
    candidates: recurring.filter(
      (sub) =>
        bucketOf(sub.sample) === "other" &&
        !heldKeys.has(merchantKey(sub.sample)),
    ),
    cancelled,
    cancelledTotalCents,
    cancelledPerMonthCents:
      months.length === 0
        ? 0
        : Math.round(cancelledTotalCents / months.length),
    held: forecast.held,
    heldTotalCents: forecast.totalCents,
    heldPerMonthCents: forecast.perMonthCents,
    heldByReason: forecast.byReason,
    actualTotalCents,
    actualPerMonthCents: actualPerMonth,
    actualPerWeekCents: Math.round(actualPerMonth / WEEKS_PER_MONTH),
  }
}
