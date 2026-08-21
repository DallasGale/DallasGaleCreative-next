import type {Budget} from "./analytics"
import {WEEKS_PER_MONTH} from "./analytics"
import type {SavingsReport} from "./savings"

/* ------------------------------------------------------------------ *
 * Income
 *
 * The one number on this dashboard that can't be derived from the account.
 * Deposits arrive gross in some months and net in others, so the bank can't
 * tell you what you actually take home — you have to say. It lives in
 * .env.local rather than in the source because this repo is public.
 *
 * State it as a minimum. Every figure built on it is then a floor: a week
 * that pays more only ever leaves more over, never less, so nothing here can
 * promise headroom that doesn't exist.
 * ------------------------------------------------------------------ */

/**
 * Weekly take-home pay in cents, or null when it hasn't been configured —
 * in which case the allocation panel simply doesn't render. Set
 * WEEKLY_TAKE_HOME in .env.local as plain dollars, e.g. 2481.32
 */
export function weeklyTakeHomeCents(): number | null {
  const raw = process.env.WEEKLY_TAKE_HOME
  if (!raw) return null

  // Tolerate "$2,481.32" — it's a number a human copies out of a payslip.
  const dollars = Number(raw.replace(/[$,\s]/g, ""))
  if (!Number.isFinite(dollars) || dollars <= 0) return null

  return Math.round(dollars * 100)
}

/* ------------------------------------------------------------------ *
 * Allocation
 *
 * Two questions, kept apart on purpose. Where is your income going to go —
 * arithmetic over the forecast, not up for debate — and where should it go,
 * which is a guideline someone made up and you are free to ignore.
 *
 * The spending side is the forecast, not the window average: cancelled,
 * one-off and dormant merchants are already out of it by the time it gets
 * here, so "left to save" describes the year ahead rather than the one behind.
 *
 * The guideline is 50/30/20: half to things you can't not pay, a third to
 * things you choose, a fifth saved. Its value isn't precision, it's that it
 * reserves savings first instead of treating them as whatever survives the
 * month. That's the part worth keeping.
 * ------------------------------------------------------------------ */

/** The fifth of 50/30/20. Savings come off the top, not out of the remainder. */
export const SAVINGS_TARGET_SHARE = 0.2

const ESSENTIAL_TARGET_SHARE = 0.5
const OPTIONAL_TARGET_SHARE = 0.3

export type AllocationSlice = {
  key: string
  label: string
  perWeekCents: number
  perMonthCents: number
  /** Of take-home pay, not of spending. */
  share: number
  /** Null where the guideline has nothing to say. */
  targetShare: number | null
  targetPerWeekCents: number | null
  /**
   * Actual minus guideline, per week. Positive means over the guideline for
   * spending rows and under it for savings — in both cases, the wrong way.
   */
  gapPerWeekCents: number | null
  hint: string
}

export type AllocationReport = {
  incomePerWeekCents: number
  incomePerMonthCents: number
  /** Essentials + optional + unclassified. Matches the budget headline. */
  spendPerWeekCents: number
  spendShare: number
  /** Income minus spending: the most that can be saved without changing anything. */
  leftoverPerWeekCents: number
  leftoverShare: number
  /** Essentials, optional, unclassified, then what's left. Sums to income. */
  slices: AllocationSlice[]
  savingsTargetShare: number
  savingsTargetPerWeekCents: number
  /** How far short of the savings target the leftover falls. 0 when it's met. */
  shortfallPerWeekCents: number
  /** What's left to spend once the savings target is taken off the top. */
  allowancePerWeekCents: number
  /** Irregular bills inside the spending above — savings-shaped, but not savings. */
  sinkingPerWeekCents: number
  /** Essentials alone: the floor, if every optional dollar went to savings. */
  floorPerWeekCents: number
  /** What savings could reach at that floor. */
  bestCasePerWeekCents: number
}

const perWeek = (perMonthCents: number) =>
  Math.round(perMonthCents / WEEKS_PER_MONTH)

export function buildAllocation({
  incomePerWeekCents,
  budget,
  savings,
  savingsTargetShare = SAVINGS_TARGET_SHARE,
}: {
  incomePerWeekCents: number
  budget: Budget
  savings: SavingsReport
  savingsTargetShare?: number
}): AllocationReport {
  const essentialPerWeek = perWeek(savings.essentialPerMonthCents)
  const optionalPerWeek = perWeek(savings.discretionaryPerMonthCents)
  const unclearPerWeek = perWeek(savings.unclearPerMonthCents)

  // Summed from the three parts rather than taken from budget.perWeekCents, so
  // the bar on screen adds up to exactly 100% instead of 99.7% of a rounded
  // total. The two agree to within a couple of cents either way.
  const spendPerWeekCents = essentialPerWeek + optionalPerWeek + unclearPerWeek
  const leftoverPerWeekCents = incomePerWeekCents - spendPerWeekCents

  const share = (cents: number) =>
    incomePerWeekCents === 0 ? 0 : cents / incomePerWeekCents

  const savingsTargetPerWeekCents = Math.round(
    incomePerWeekCents * savingsTargetShare,
  )

  const slice = (
    key: string,
    label: string,
    cents: number,
    targetShare: number | null,
    hint: string,
  ): AllocationSlice => {
    const targetPerWeekCents =
      targetShare === null ? null : Math.round(incomePerWeekCents * targetShare)

    return {
      key,
      label,
      perWeekCents: cents,
      perMonthCents: Math.round(cents * WEEKS_PER_MONTH),
      share: share(cents),
      targetShare,
      targetPerWeekCents,
      gapPerWeekCents:
        targetPerWeekCents === null ? null : cents - targetPerWeekCents,
      hint,
    }
  }

  const slices: AllocationSlice[] = [
    slice(
      "essential",
      "Essentials",
      essentialPerWeek,
      ESSENTIAL_TARGET_SHARE,
      "Rent, groceries, fuel, utilities — the bills that arrive whether you engage with them or not.",
    ),
    slice(
      "optional",
      "Optional",
      optionalPerWeek,
      OPTIONAL_TARGET_SHARE,
      "Eating out, subscriptions, shopping. Every dollar here is one you could redirect.",
    ),
    slice(
      "unclear",
      "Unclassified",
      unclearPerWeek,
      null,
      "Spending Up hasn't categorised, so it can't be called either. It's counted, just not judged.",
    ),
    {
      ...slice(
        "savings",
        "Left to save",
        leftoverPerWeekCents,
        savingsTargetShare,
        "What income minus spending actually leaves. Move it on payday or the month will find a use for it.",
      ),
      // Under target is the failure here, not over it — so the sign flips to
      // keep "positive gap = wrong direction" true for every row on the table.
      gapPerWeekCents: savingsTargetPerWeekCents - leftoverPerWeekCents,
    },
  ]

  return {
    incomePerWeekCents,
    incomePerMonthCents: Math.round(incomePerWeekCents * WEEKS_PER_MONTH),
    spendPerWeekCents,
    spendShare: share(spendPerWeekCents),
    leftoverPerWeekCents,
    leftoverShare: share(leftoverPerWeekCents),
    slices,
    savingsTargetShare,
    savingsTargetPerWeekCents,
    shortfallPerWeekCents: Math.max(
      savingsTargetPerWeekCents - leftoverPerWeekCents,
      0,
    ),
    allowancePerWeekCents: incomePerWeekCents - savingsTargetPerWeekCents,
    sinkingPerWeekCents: budget.sinkingPerWeekCents,
    // Unclassified spending sits with the essentials here. It's the cautious
    // side of the guess: calling it optional would quietly promise savings
    // that depend on cutting something nobody has looked at yet.
    floorPerWeekCents: essentialPerWeek + unclearPerWeek,
    bestCasePerWeekCents:
      incomePerWeekCents - (essentialPerWeek + unclearPerWeek),
  }
}
