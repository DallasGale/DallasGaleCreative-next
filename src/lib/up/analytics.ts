import type {MonthBucket} from "./period"
import {monthKeyOf} from "./period"
import type {UpAccount, UpCategory, UpTransaction} from "./types"

/**
 * Transfers between the customer's own accounts (savings sweeps, round-ups,
 * "Cover from..." top-ups) are not income and not spending — counting them
 * would inflate both sides of every total. Up flags them with a non-null
 * transferAccount relationship.
 */
export function isInternalTransfer(tx: UpTransaction): boolean {
  return tx.relationships.transferAccount.data !== null
}

/** Transactions that represent real money in or out. */
export function isCashflow(tx: UpTransaction): boolean {
  return !isInternalTransfer(tx)
}

export function cents(tx: UpTransaction): number {
  return tx.attributes.amount.valueInBaseUnits
}

/** The timestamp a transaction should be bucketed under. */
export function occurredAt(tx: UpTransaction): string {
  return tx.attributes.settledAt ?? tx.attributes.createdAt
}

export type AccountTotals = {
  /** Everything added up, including the home loan as a negative. */
  netPositionCents: number
  spendingCents: number
  savingsCents: number
  homeLoanCents: number
}

export function accountTotals(accounts: UpAccount[]): AccountTotals {
  const sumOf = (type: UpAccount["attributes"]["accountType"]) =>
    accounts
      .filter((a) => a.attributes.accountType === type)
      .reduce((total, a) => total + a.attributes.balance.valueInBaseUnits, 0)

  const spending = sumOf("TRANSACTIONAL")
  const savings = sumOf("SAVER")
  const homeLoan = sumOf("HOME_LOAN")

  return {
    netPositionCents: spending + savings + homeLoan,
    spendingCents: spending,
    savingsCents: savings,
    homeLoanCents: homeLoan,
  }
}

export type MonthSummary = {
  key: string
  label: string
  /** Unambiguous label — a window can span a year boundary. */
  longLabel: string
  year: number
  spendingCents: number
}

/**
 * Spending per month, in the order the buckets were given.
 *
 * Money coming in is deliberately not tracked anywhere on this dashboard:
 * some of it arrives gross and some net, so any "left over" figure built on
 * it would be wrong by an unknown amount of tax. What you spend is the one
 * side of the ledger the bank records without ambiguity.
 */
export function monthlySeries(
  transactions: UpTransaction[],
  buckets: MonthBucket[],
): MonthSummary[] {
  const totals = new Map<string, number>()
  for (const bucket of buckets) totals.set(bucket.key, 0)

  for (const tx of transactions) {
    if (!isCashflow(tx)) continue

    const amount = cents(tx)
    if (amount >= 0) continue

    const key = monthKeyOf(occurredAt(tx))
    if (!totals.has(key)) continue
    totals.set(key, (totals.get(key) ?? 0) + Math.abs(amount))
  }

  return buckets.map((bucket) => ({
    key: bucket.key,
    label: bucket.label,
    longLabel: bucket.longLabel,
    year: bucket.year,
    spendingCents: totals.get(bucket.key) ?? 0,
  }))
}

export type MerchantSpend = {
  description: string
  cents: number
  count: number
}

/** Where the money actually went, by merchant name. */
export function topMerchants(
  transactions: UpTransaction[],
  limit = 8,
  within?: Set<string>,
): MerchantSpend[] {
  const totals = new Map<string, {cents: number; count: number}>()

  for (const tx of transactions) {
    if (!isCashflow(tx)) continue

    const amount = cents(tx)
    if (amount >= 0) continue
    if (within && !within.has(monthKeyOf(occurredAt(tx)))) continue

    const key = tx.attributes.description
    const entry = totals.get(key) ?? {cents: 0, count: 0}
    entry.cents += Math.abs(amount)
    entry.count += 1
    totals.set(key, entry)
  }

  return [...totals.entries()]
    .map(([description, {cents: value, count}]) => ({
      description,
      cents: value,
      count,
    }))
    .sort((a, b) => b.cents - a.cents)
    .slice(0, limit)
}

/** Most recent transactions first, transfers included for context. */
export function recentTransactions(
  transactions: UpTransaction[],
  limit = 12,
): UpTransaction[] {
  return [...transactions]
    .sort(
      (a, b) =>
        new Date(occurredAt(b)).getTime() - new Date(occurredAt(a)).getTime(),
    )
    .slice(0, limit)
}

/* ------------------------------------------------------------------ *
 * Budgeting
 *
 * The dashboard's main job: look back over a run of completed months and
 * work out what each category actually costs, so you know what to set
 * aside. Everything here works on completed months only — the current
 * month is partial and would drag every average down.
 * ------------------------------------------------------------------ */

/** 52 weeks spread across 12 months. Not 4 — that loses a fortnight a year. */
export const WEEKS_PER_MONTH = 52 / 12

export const UNCATEGORISED = "uncategorised"

/**
 * How reliably a category shows up. Regular categories can be paid as you go;
 * the irregular ones are what a sinking fund is actually for.
 */
export type Cadence = "regular" | "occasional" | "rare"

export type CategoryBudget = {
  id: string
  name: string
  /** Total across the whole window. */
  totalCents: number
  perMonthCents: number
  perWeekCents: number
  /** Fraction of all spending in the window, 0-1. */
  share: number
  /** How many of the window's months had any spend in this category. */
  monthsWithSpend: number
  /** The single worst month — what the fund has to be able to absorb. */
  largestMonthCents: number
  /** Per-month totals, in window order. */
  monthly: {key: string; cents: number}[]
  /** Spend so far in the current (partial) month, for tracking. */
  thisMonthCents: number
  cadence: Cadence
}

export type BudgetGroup = CategoryBudget & {children: CategoryBudget[]}

export type Budget = {
  /** Number of completed months the averages are built from. */
  months: number
  /** e.g. "Aug 2025" / "Jul 2026". */
  from: string
  to: string
  groups: BudgetGroup[]
  totalCents: number
  perMonthCents: number
  perWeekCents: number
  /** Irregular categories only — the part that needs saving ahead. */
  sinkingPerMonthCents: number
  sinkingPerWeekCents: number
  /** Total spend per month across every category, in window order. */
  monthly: {key: string; cents: number}[]
  /** The most expensive month in the window — what a buffer has to absorb. */
  largestMonthCents: number
}

type Tally = {
  total: number
  byMonth: Map<string, number>
  thisMonth: number
}

function emptyTally(): Tally {
  return {total: 0, byMonth: new Map(), thisMonth: 0}
}

function cadenceOf(monthsWithSpend: number, months: number): Cadence {
  if (months === 0) return "rare"
  const rate = monthsWithSpend / months
  if (rate >= 0.75) return "regular"
  if (rate >= 0.25) return "occasional"
  return "rare"
}

function toBudget(
  id: string,
  name: string,
  tally: Tally,
  months: MonthBucket[],
  grandTotal: number,
): CategoryBudget {
  const monthly = months.map((m) => ({
    key: m.key,
    cents: tally.byMonth.get(m.key) ?? 0,
  }))
  const monthsWithSpend = monthly.filter((m) => m.cents > 0).length
  const perMonthCents =
    months.length === 0 ? 0 : Math.round(tally.total / months.length)

  return {
    id,
    name,
    totalCents: tally.total,
    perMonthCents,
    perWeekCents: Math.round(perMonthCents / WEEKS_PER_MONTH),
    share: grandTotal === 0 ? 0 : tally.total / grandTotal,
    monthsWithSpend,
    largestMonthCents:
      monthly.length === 0 ? 0 : Math.max(...monthly.map((m) => m.cents)),
    monthly,
    thisMonthCents: tally.thisMonth,
    cadence: cadenceOf(monthsWithSpend, months.length),
  }
}

/**
 * Builds the whole budget in one pass over the transactions.
 *
 * `months` must be completed months only. `currentKey` is the in-progress
 * month, tallied separately so each row can show how it's tracking without
 * polluting the averages.
 */
export function buildBudget(
  transactions: UpTransaction[],
  categories: UpCategory[],
  months: MonthBucket[],
  currentKey: string,
  /**
   * Transaction ids to hold out — one-off purchases. A budget divides by the
   * window, which assumes everything repeats; a single large purchase would
   * otherwise set a weekly figure it has no business setting.
   */
  exclude?: Set<string>,
): Budget {
  const names = new Map(categories.map((c) => [c.id, c.attributes.name]))
  const parentOf = new Map(
    categories.map((c) => [c.id, c.relationships.parent.data?.id ?? null]),
  )

  const windowKeys = new Set(months.map((m) => m.key))
  const parents = new Map<string, Tally>()
  const children = new Map<string, Tally>()
  /** Which children belong to which parent, discovered from the data. */
  const childrenOf = new Map<string, Set<string>>()

  const add = (map: Map<string, Tally>, id: string, amount: number, key: string, inWindow: boolean) => {
    let tally = map.get(id)
    if (!tally) {
      tally = emptyTally()
      map.set(id, tally)
    }
    if (inWindow) {
      tally.total += amount
      tally.byMonth.set(key, (tally.byMonth.get(key) ?? 0) + amount)
    }
    if (key === currentKey) tally.thisMonth += amount
  }

  for (const tx of transactions) {
    if (!isCashflow(tx)) continue
    if (exclude?.has(tx.id)) continue

    const key = monthKeyOf(occurredAt(tx))
    const inWindow = windowKeys.has(key)
    if (!inWindow && key !== currentKey) continue

    const amount = cents(tx)

    // Money in is not tracked: gross and net deposits are indistinguishable
    // here, so any figure derived from them would carry an unknown amount of
    // tax. See monthlySeries().
    if (amount >= 0) continue

    const spend = Math.abs(amount)
    const childId = tx.relationships.category.data?.id ?? null
    // Up only sets parentCategory when the transaction is categorised, so an
    // uncategorised transaction lands in its own bucket rather than vanishing.
    const parentId =
      tx.relationships.parentCategory.data?.id ??
      (childId ? (parentOf.get(childId) ?? childId) : UNCATEGORISED)

    add(parents, parentId, spend, key, inWindow)

    if (childId && childId !== parentId) {
      add(children, childId, spend, key, inWindow)
      const siblings = childrenOf.get(parentId) ?? new Set<string>()
      siblings.add(childId)
      childrenOf.set(parentId, siblings)
    }
  }

  const grandTotal = [...parents.values()].reduce((sum, t) => sum + t.total, 0)

  const groups: BudgetGroup[] = [...parents.entries()]
    .map(([id, tally]) => {
      const kids = [...(childrenOf.get(id) ?? [])]
        .map((childId) =>
          toBudget(
            childId,
            names.get(childId) ?? childId,
            children.get(childId) ?? emptyTally(),
            months,
            grandTotal,
          ),
        )
        .sort((a, b) => b.totalCents - a.totalCents)

      return {
        ...toBudget(
          id,
          id === UNCATEGORISED ? "Uncategorised" : (names.get(id) ?? id),
          tally,
          months,
          grandTotal,
        ),
        children: kids,
      }
    })
    .sort((a, b) => b.totalCents - a.totalCents)

  // Sum the sinking fund from leaves, not parents: "Home" can look regular in
  // aggregate while the annual insurance premium inside it is anything but.
  const leaves = groups.flatMap((group) =>
    group.children.length > 0 ? group.children : [group],
  )
  const sinkingPerMonthCents = leaves
    .filter((leaf) => leaf.cadence !== "regular")
    .reduce((sum, leaf) => sum + leaf.perMonthCents, 0)

  const perMonthCents =
    months.length === 0 ? 0 : Math.round(grandTotal / months.length)

  // Whole-of-budget monthly totals, summed from the parents so they can't
  // disagree with the rows above them.
  const monthly = months.map((m) => ({
    key: m.key,
    cents: [...parents.values()].reduce(
      (sum, tally) => sum + (tally.byMonth.get(m.key) ?? 0),
      0,
    ),
  }))

  return {
    months: months.length,
    from: months[0]?.longLabel ?? "",
    to: months[months.length - 1]?.longLabel ?? "",
    groups,
    totalCents: grandTotal,
    perMonthCents,
    perWeekCents: Math.round(perMonthCents / WEEKS_PER_MONTH),
    sinkingPerMonthCents,
    sinkingPerWeekCents: Math.round(sinkingPerMonthCents / WEEKS_PER_MONTH),
    monthly,
    largestMonthCents:
      monthly.length === 0 ? 0 : Math.max(...monthly.map((m) => m.cents)),
  }
}

/**
 * Groups spending by whatever `keyOf` returns and runs it through the same
 * averaging as the category budget, so an alternative breakdown (custom
 * buckets, merchants) can't drift from the headline numbers.
 *
 * Returns null from `keyOf` to drop a transaction. Shares are relative to the
 * total of everything that was kept.
 */
export function summariseBy(
  transactions: UpTransaction[],
  months: MonthBucket[],
  currentKey: string,
  keyOf: (tx: UpTransaction) => {id: string; name: string} | null,
): CategoryBudget[] {
  const windowKeys = new Set(months.map((m) => m.key))
  const tallies = new Map<string, Tally>()
  const names = new Map<string, string>()

  for (const tx of transactions) {
    if (!isCashflow(tx)) continue

    const amount = cents(tx)
    if (amount >= 0) continue

    const key = monthKeyOf(occurredAt(tx))
    const inWindow = windowKeys.has(key)
    if (!inWindow && key !== currentKey) continue

    const group = keyOf(tx)
    if (!group) continue
    names.set(group.id, group.name)

    let tally = tallies.get(group.id)
    if (!tally) {
      tally = emptyTally()
      tallies.set(group.id, tally)
    }

    const spend = Math.abs(amount)
    if (inWindow) {
      tally.total += spend
      tally.byMonth.set(key, (tally.byMonth.get(key) ?? 0) + spend)
    }
    if (key === currentKey) tally.thisMonth += spend
  }

  const grandTotal = [...tallies.values()].reduce((sum, t) => sum + t.total, 0)

  return [...tallies.entries()]
    .map(([id, tally]) =>
      toBudget(id, names.get(id) ?? id, tally, months, grandTotal),
    )
    .sort((a, b) => b.totalCents - a.totalCents)
}
