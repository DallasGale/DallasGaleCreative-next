import {formatCents, formatSignedCents} from "@/lib/format"
import type {Budget} from "@/lib/up/analytics"
import type {ExclusionReason} from "@/lib/up/buckets"
import {EXCLUSION_LABEL} from "@/lib/up/buckets"

const WEEKS_PER_MONTH = 52 / 12

/** "Binge, Disney+ and 3 more" — the full list lives in the panel below. */
function listNames(names: string[]): string {
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names[0]}, ${names[1]} and ${names.length - 2} more`
}

function Figure({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string
  value: string
  hint: string
  tone?: "neutral" | "positive" | "negative"
}) {
  const toneClass = {
    neutral: "text-white",
    positive: "text-emerald-400",
    negative: "text-rose-400",
  }[tone]

  return (
    <div>
      <p className="text-[10px] font-bold tracking-widest text-med-grey uppercase">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold tabular-nums ${toneClass}`}>
        {value}
      </p>
      <p className="mt-0.5 text-xs text-med-grey">{hint}</p>
    </div>
  )
}

/**
 * The headline answer: what the year ahead costs, per pay.
 *
 * Weekly, fortnightly and monthly are all shown because pay cycles vary and
 * an amount you have to convert before you can transfer it is an amount you
 * won't transfer.
 *
 * This is a forecast, not a report. It starts from the window average and
 * removes the parts of it that demonstrably won't happen again — services you
 * cancelled, single large purchases, merchants that stopped charging. What's
 * left is irregular in places but alive: you will eat out again even though
 * no individual restaurant recurs, so nothing is dropped for being merely
 * infrequent.
 *
 * Because it's a forecast, what the window actually cost is shown next to it
 * and the gap is itemised below. A number that quietly shrank would be
 * indistinguishable from a bug.
 */
export default function BudgetSummary({
  budget,
  actual,
  held,
  floorPerWeekCents,
}: {
  budget: Budget
  /**
   * What the window really cost per month, before the forecast held anything
   * out. Shown beside the forecast rather than replaced by it.
   */
  actual?: {perMonthCents: number}
  /** The excluded spend, itemised by reason so the gap can be explained. */
  held?: {
    names: string[]
    perMonthCents: number
    byReason: Record<ExclusionReason, number>
    months: number
  }
  /**
   * Essentials and unclassified only — what a week costs if every optional
   * dollar stopped. Renders only when the necessity split is available.
   */
  floorPerWeekCents?: number
}) {
  const overWorstMonth = budget.largestMonthCents - budget.perMonthCents

  // Three ways of saying one number, because pay cycles differ and a figure
  // you have to divide before you can act on it is a figure you won't act on.
  // All three come off the same annual total rather than doubling the weekly,
  // so a fortnight is a real 1/26th of the year and not two rounded weeks.
  const perYear = budget.perMonthCents * 12
  const cadences = [
    {
      label: "Weekly",
      cents: budget.perWeekCents,
      hint: "If you're paid weekly",
    },
    {
      label: "Fortnightly",
      cents: Math.round(perYear / 26),
      hint: "If you're paid fortnightly",
    },
    {
      label: "Monthly",
      cents: budget.perMonthCents,
      hint: "If you're paid monthly",
    },
  ]
  const excluded =
    held && held.perMonthCents > 0 && held.names.length > 0 ? held : null
  const actualPerMonth = actual?.perMonthCents ?? budget.perMonthCents
  const actualPerWeek = Math.round(actualPerMonth / WEEKS_PER_MONTH)

  return (
    <section className="rounded-lg border border-highlight/30 bg-highlight/[0.04] p-5 md:p-6">
      <p className="text-xs font-bold tracking-widest text-med-grey uppercase">
        Put away each pay
      </p>

      <dl className="mt-3 grid grid-cols-1 divide-y divide-white/10 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {cadences.map((cadence) => (
          <div
            key={cadence.label}
            className="py-4 first:pt-0 last:pb-0 sm:px-6 sm:py-0 sm:first:pl-0 sm:last:pr-0"
          >
            <dt className="text-[10px] font-bold tracking-widest text-med-grey uppercase">
              {cadence.label}
            </dt>
            <dd className="mt-1 text-3xl font-bold tabular-nums text-highlight md:text-4xl">
              {formatCents(cadence.cents)}
            </dd>
            <dd className="mt-0.5 text-xs text-med-grey">{cadence.hint}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 text-sm text-med-grey">
        Whichever line matches the pay you just received — the three are the
        same forecast for the year ahead, built from {budget.months} months of
        history, {budget.from} to {budget.to}.
      </p>

      {floorPerWeekCents !== undefined && floorPerWeekCents > 0 && (
        <p className="mt-1.5 text-sm text-med-grey">
          <span className="font-bold text-white">
            {formatCents(floorPerWeekCents)} a week
          </span>{" "}
          of the weekly figure is essentials and spending nobody has classified
          yet — the
          floor, if every optional dollar stopped tomorrow.
        </p>
      )}

      {excluded && (
        <div className="mt-4 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-med-grey">
          <p>
            The same {budget.months} months actually cost{" "}
            <span className="font-bold text-white">
              {formatCents(actualPerWeek)} a week
            </span>{" "}
            — {formatCents(actualPerMonth)} a month. The forecast is lower by{" "}
            <span className="font-bold text-white">
              {formatCents(
                Math.round(excluded.perMonthCents / WEEKS_PER_MONTH),
              )}{" "}
              a week
            </span>{" "}
            because {excluded.names.length} merchant
            {excluded.names.length === 1 ? "" : "s"} won't charge again:{" "}
            {listNames(excluded.names)}.
          </p>
          <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs">
            {(
              Object.entries(excluded.byReason) as [ExclusionReason, number][]
            )
              .filter(([, cents]) => cents > 0)
              .map(([reason, cents]) => (
                <li key={reason}>
                  {EXCLUSION_LABEL[reason]}{" "}
                  <span className="font-bold text-white tabular-nums">
                    {formatCents(
                      excluded.months === 0
                        ? 0
                        : Math.round(
                            cents / excluded.months / WEEKS_PER_MONTH,
                          ),
                    )}
                    /wk
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-5 border-t border-white/10 pt-5 lg:grid-cols-4">
        <Figure
          label="Of that, irregular"
          value={`${formatCents(budget.sinkingPerWeekCents)}/wk`}
          hint={`${formatCents(budget.sinkingPerMonthCents)}/mo for lumpy bills`}
        />
        <Figure
          label="Day to day"
          value={`${formatCents(budget.perWeekCents - budget.sinkingPerWeekCents)}/wk`}
          hint="Regular categories, paid as you go"
        />
        <Figure
          label="Worst month"
          value={formatCents(budget.largestMonthCents)}
          hint={`${formatSignedCents(overWorstMonth)} against a typical month`}
          tone={overWorstMonth > 0 ? "negative" : "neutral"}
        />
        <Figure
          label="The year ahead"
          value={formatCents(budget.perMonthCents * 12)}
          hint={`Against ${formatCents(actualPerMonth * 12)} for the year behind`}
        />
      </div>
    </section>
  )
}
