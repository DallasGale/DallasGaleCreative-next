/**
 * Forecasting subscriptions at what they cost now.
 *
 * Averaging is the right way to forecast spending that varies and the wrong
 * way to forecast spending that doesn't. A subscription charges a set amount
 * on a set rhythm, so the only question worth asking is "what is it today?" —
 * and a twelve-month average quietly answers a different one. It half-forgets
 * every price change (Claude went $30.91 to $34.00 and averages neither), and
 * it divides a service you started in October by twelve months instead of the
 * ten it actually charged in. Both errors point down, so the budget ends up
 * asking you to put away less than the bills will take.
 *
 * So live subscriptions are restated: their real charges inside the window are
 * replaced by an even stream at today's price. Everything downstream — the
 * category budget, the buckets, the headline figure — then adds up to what the
 * year ahead costs rather than what the year behind happened to.
 *
 * Two sources for "today's price", declared beating inferred as everywhere
 * else here:
 *
 *   declared  CURRENT_PRICES, below. You've told the app the price, so it's
 *             used even when nothing in the history looks like it yet — a
 *             plan you changed last week has no charges to infer from.
 *   latest    The most recent charge at a merchant that bills on a steady
 *             rhythm. Only merchants the subscription detector recognises,
 *             so a café you visit monthly is never repriced.
 *
 * Nothing here removes spending from the forecast — that's what the exclusion
 * rules in buckets.ts do, and anything they've already held out is left alone.
 * This only changes what the surviving subscriptions are expected to cost.
 */

import {cents, occurredAt} from "./analytics"
import type {ForecastBasis, Recurrence} from "./buckets"
import {
  bucketOf,
  CHARGES_PER_YEAR,
  detectSubscriptions,
  merchantKey,
  merchantPattern,
} from "./buckets"
import type {MonthBucket} from "./period"
import {monthKeyOf} from "./period"
import type {UpTransaction} from "./types"

/* ------------------------------------------------------------------ *
 * Declared prices
 * ------------------------------------------------------------------ */

export type CurrentPrice = {
  /** Matched like every merchant list here: whole word, case-insensitive. */
  merchant: string
  /** Dollars per charge, as it appears on the statement. */
  amount: number
  every: Recurrence
  /**
   * What this line pays for. Only needed when one merchant bills for more
   * than one thing — Apple charges separately for iCloud and for YouTube,
   * and naming them is the difference between a figure you can check and a
   * figure you have to trust.
   */
  what?: string
}

/**
 * What your subscriptions cost right now.
 *
 * Every line matching a merchant is summed, and the total replaces that
 * merchant's history in the forecast entirely — so listing a merchant here is
 * a statement that these are the only charges it will make from now on.
 */
export const CURRENT_PRICES: CurrentPrice[] = [
  // Dropped from about $30 a month to $9.99 in July 2026.
  {merchant: "netflix", amount: 10, every: "monthly"},
  // $40, then $45.99, then paused for five months, and now $25.
  {merchant: "kayo", amount: 25, every: "monthly"},
  // One descriptor, two services, plus a year of App Store purchases and a
  // $1,998 device in the history that aren't coming back.
  {merchant: "apple", amount: 14.99, every: "monthly", what: "iCloud"},
  {merchant: "apple", amount: 22.99, every: "monthly", what: "YouTube"},
]

/* ------------------------------------------------------------------ *
 * Repricing
 * ------------------------------------------------------------------ */

export type PriceSource = "declared" | "latest"

export type Repricing = {
  /** Merchant key, i.e. the normalised description. */
  key: string
  name: string
  source: PriceSource
  /** The price in words, e.g. "iCloud $14.99 + YouTube $22.99 a month". */
  detail: string
  /** What the forecast now expects each month. */
  perMonthCents: number
  /** What the window averaged, before this. */
  wasPerMonthCents: number
  /** Real charges seen in the window. */
  charges: number
  /**
   * The rows this merchant now appears as. Usually one, but a declared price
   * with named lines splits into a row each — Apple's bill becomes iCloud and
   * YouTube, which is what you actually pay for and where they actually
   * belong.
   */
  rows: {key: string; name: string; perMonthCents: number}[]
}

export type RepricedForecast = {
  /** The window's transactions, with repriced merchants restated. */
  transactions: UpTransaction[]
  /** Only merchants whose monthly figure actually moved. */
  changes: Repricing[]
  /** Net effect on the monthly forecast. Positive means it went up. */
  perMonthDeltaCents: number
}

/**
 * A subscription that suddenly charges a fraction of its usual amount is a
 * refund or a part-month, and one that charges several times it is a double
 * bill; neither is a new price. Outside this band the median stands, and
 * CURRENT_PRICES is there for the genuine plan change that trips it.
 */
const SANE_PRICE_RANGE = {min: 0.5, max: 2}

const PERIOD_WORD: Record<Recurrence, string> = {
  weekly: "a week",
  fortnightly: "a fortnight",
  monthly: "a month",
  quarterly: "a quarter",
}

function money(cents: number): string {
  const dollars = cents / 100
  return `$${dollars.toFixed(dollars % 1 === 0 ? 0 : 2)}`
}

/** What a charge of this size on this rhythm comes to per month. */
function perMonth(chargeCents: number, every: Recurrence): number {
  return Math.round((chargeCents * CHARGES_PER_YEAR[every]) / 12)
}

/** Real money out, ignoring transfers between your own accounts. */
function isSpend(tx: UpTransaction): boolean {
  return tx.relationships.transferAccount.data === null && cents(tx) < 0
}

/** One restated row: a description to bill under, and what it costs. */
type Stream = {
  name: string
  perMonthCents: number
}

type Plan = {
  key: string
  name: string
  source: PriceSource
  detail: string
  perMonthCents: number
  /** Every merchant key this plan speaks for. */
  keys: Set<string>
  /** What it becomes. One row unless the declared lines are named. */
  streams: Stream[]
}

/** Groups CURRENT_PRICES into one plan per merchant. */
function declaredPlans(
  byKey: Map<string, UpTransaction[]>,
  held: Set<string>,
): Plan[] {
  const plans: Plan[] = []

  for (const merchant of new Set(CURRENT_PRICES.map((p) => p.merchant))) {
    const lines = CURRENT_PRICES.filter((p) => p.merchant === merchant)
    const pattern = merchantPattern([merchant])

    // A declared price is about the merchant, not one descriptor of it, so
    // every descriptor it matches collapses into a single stream. Otherwise
    // "Apple" and "Apple Store" would each be told they cost $37.98.
    const keys = [...byKey.keys()].filter(
      (key) => pattern.test(key) && !held.has(key),
    )
    if (keys.length === 0) continue

    // The busiest descriptor names the row, and its charges are the sample
    // the restated stream is cloned from.
    keys.sort((a, b) => (byKey.get(b)?.length ?? 0) - (byKey.get(a)?.length ?? 0))
    const busiest = byKey.get(keys[0])
    if (!busiest || busiest.length === 0) continue

    const name = busiest[0].attributes.description.trim()

    // A named line becomes its own row. Up files the whole bill under one
    // descriptor, so without this a subscription you can name is stuck inside
    // a merchant's name — and "YouTube" lands in video streaming on its own name.
    const streams = new Map<string, number>()
    for (const line of lines) {
      const label = line.what ?? name
      const cents = perMonth(Math.round(line.amount * 100), line.every)
      streams.set(label, (streams.get(label) ?? 0) + cents)
    }

    const sameRhythm = lines.every((line) => line.every === lines[0].every)
    const parts = lines.map(
      (line) =>
        `${line.what ? `${line.what} ` : ""}${money(Math.round(line.amount * 100))}${
          sameRhythm ? "" : ` ${PERIOD_WORD[line.every]}`
        }`,
    )
    const detail = sameRhythm
      ? `${parts.join(" + ")} ${PERIOD_WORD[lines[0].every]}`
      : parts.join(" + ")

    plans.push({
      key: keys[0],
      name,
      source: "declared",
      detail,
      perMonthCents: [...streams.values()].reduce((sum, c) => sum + c, 0),
      keys: new Set(keys),
      streams: [...streams].map(([label, cents]) => ({
        name: label,
        perMonthCents: cents,
      })),
    })
  }

  return plans
}

/**
 * Restates live subscriptions at their current price.
 *
 * `months` must be the completed months the averages are built from; the
 * month in progress is left exactly as it happened, so "spent so far this
 * month" stays a fact about the real world.
 */
export function repriceForecast(
  transactions: UpTransaction[],
  months: MonthBucket[],
  /**
   * The month in progress. Its charges are never restated, but they do count
   * towards recognising a rhythm — a subscription with eleven months of
   * history and one charge this month is exactly the case worth catching.
   */
  currentKey: string,
  basis: ForecastBasis,
): RepricedForecast {
  const windowKeys = new Set(months.map((m) => m.key))
  const held = new Set(basis.held.map((item) => item.key))

  // In-window spending per merchant, minus anything the forecast already
  // holds out — a $1,998 laptop that's been excluded as a one-off shouldn't
  // show up as savings when the merchant is repriced.
  const byKey = new Map<string, UpTransaction[]>()
  /** Most recent charge anywhere, including the month in progress. */
  const latest = new Map<string, UpTransaction>()

  for (const tx of transactions) {
    if (!isSpend(tx)) continue
    const key = merchantKey(tx)

    const previous = latest.get(key)
    if (!previous || occurredAt(tx) > occurredAt(previous)) latest.set(key, tx)

    if (basis.ids.has(tx.id)) continue
    if (!windowKeys.has(monthKeyOf(occurredAt(tx)))) continue
    const list = byKey.get(key)
    if (list) list.push(tx)
    else byKey.set(key, [tx])
  }

  const plans = declaredPlans(byKey, held)
  const spokenFor = new Set(plans.flatMap((plan) => [...plan.keys]))

  const detectKeys = new Set([...windowKeys, currentKey])

  for (const sub of detectSubscriptions(transactions, detectKeys)) {
    if (spokenFor.has(sub.id)) continue
    if (held.has(sub.id)) continue
    // Only things already understood as subscriptions. Everything else is
    // free to vary, and pinning it to its last charge would be a guess
    // dressed up as a price.
    if (bucketOf(sub.sample) !== "subscriptions") continue
    if (!byKey.has(sub.id)) continue

    const last = latest.get(sub.id)
    const lastCents = last ? Math.abs(cents(last)) : 0
    const believable =
      lastCents >= sub.typicalCents * SANE_PRICE_RANGE.min &&
      lastCents <= sub.typicalCents * SANE_PRICE_RANGE.max
    const priceCents = believable ? lastCents : sub.typicalCents

    plans.push({
      key: sub.id,
      name: sub.description,
      source: "latest",
      detail: `${money(priceCents)} ${PERIOD_WORD[sub.recurrence]}`,
      perMonthCents: perMonth(priceCents, sub.recurrence),
      keys: new Set([sub.id]),
      streams: [
        {
          name: sub.description,
          perMonthCents: perMonth(priceCents, sub.recurrence),
        },
      ],
    })
  }

  if (plans.length === 0) {
    return {transactions, changes: [], perMonthDeltaCents: 0}
  }

  const restated = new Set(plans.flatMap((plan) => [...plan.keys]))
  const kept = transactions.filter(
    (tx) =>
      !(
        isSpend(tx) &&
        restated.has(merchantKey(tx)) &&
        windowKeys.has(monthKeyOf(occurredAt(tx)))
      ),
  )

  const changes: Repricing[] = []

  for (const plan of plans) {
    const real = [...plan.keys].flatMap((key) => byKey.get(key) ?? [])
    const sample = real[0]
    if (!sample) continue

    for (const stream of plan.streams) {
      for (const month of months) {
        kept.push(restate(sample, plan, stream, month))
      }
    }

    const total = real.reduce((sum, tx) => sum + Math.abs(cents(tx)), 0)
    const wasPerMonthCents =
      months.length === 0 ? 0 : Math.round(total / months.length)
    if (wasPerMonthCents === plan.perMonthCents) continue

    changes.push({
      key: plan.key,
      name: plan.name,
      source: plan.source,
      detail: plan.detail,
      perMonthCents: plan.perMonthCents,
      wasPerMonthCents,
      charges: real.length,
      rows: plan.streams.map((stream) => ({
        key: stream.name.trim().toLowerCase(),
        name: stream.name,
        perMonthCents: stream.perMonthCents,
      })),
    })
  }

  changes.sort(
    (a, b) =>
      Math.abs(b.perMonthCents - b.wasPerMonthCents) -
      Math.abs(a.perMonthCents - a.wasPerMonthCents),
  )

  return {
    transactions: kept,
    changes,
    perMonthDeltaCents: changes.reduce(
      (sum, change) => sum + change.perMonthCents - change.wasPerMonthCents,
      0,
    ),
  }
}

/**
 * One month's worth of a plan, wearing a real charge's category and account
 * so it lands in the same row of every report the real ones did.
 */
function restate(
  sample: UpTransaction,
  plan: Plan,
  stream: Stream,
  month: MonthBucket,
): UpTransaction {
  // Mid-month and mid-day: far enough from either edge that no timezone
  // resolves it into the month next door.
  const at = `${month.key}-15T12:00:00Z`

  return {
    ...sample,
    id: `repriced:${plan.key}:${stream.name}:${month.key}`,
    attributes: {
      ...sample.attributes,
      description: stream.name,
      amount: {
        ...sample.attributes.amount,
        value: (-stream.perMonthCents / 100).toFixed(2),
        valueInBaseUnits: -stream.perMonthCents,
      },
      foreignAmount: null,
      roundUp: null,
      cashback: null,
      createdAt: at,
      settledAt: at,
    },
  }
}
