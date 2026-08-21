import {formatCents, formatShare} from "@/lib/format"
import type {AllocationReport, AllocationSlice} from "@/lib/up/allocation"

const SEGMENT_CLASS: Record<string, string> = {
  essential: "bg-white/25",
  optional: "bg-highlight",
  unclear: "bg-white/10",
  savings: "bg-emerald-400/70",
}

function Headline({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string
  value: string
  hint: string
  tone?: "neutral" | "highlight" | "positive" | "negative"
}) {
  const toneClass = {
    neutral: "text-white",
    highlight: "text-highlight",
    positive: "text-emerald-400",
    negative: "text-rose-400",
  }[tone]

  return (
    <div>
      <p className="text-xs font-bold tracking-widest text-med-grey uppercase">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums md:text-3xl ${toneClass}`}>
        {value}
      </p>
      <p className="mt-1 text-xs text-med-grey">{hint}</p>
    </div>
  )
}

/**
 * One week of pay, left to right.
 *
 * Scaled against income, except when spending exceeds it — then the bar fills
 * and the overspend is what's missing from the end. A bar that silently
 * rescaled itself would make living beyond your means look like a full week.
 */
function AllocationBar({report}: {report: AllocationReport}) {
  const scale = Math.max(report.incomePerWeekCents, report.spendPerWeekCents, 1)

  return (
    <div>
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-white/5">
        {report.slices
          .filter((slice) => slice.perWeekCents > 0)
          .map((slice) => (
            <div
              key={slice.key}
              className={SEGMENT_CLASS[slice.key]}
              style={{width: `${(slice.perWeekCents / scale) * 100}%`}}
              title={`${slice.label}: ${formatCents(slice.perWeekCents)} a week`}
            />
          ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-med-grey">
        {report.slices.map((slice) => (
          <span key={slice.key} className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-full ${SEGMENT_CLASS[slice.key]}`}
            />
            {slice.label}
            <span className="font-bold tabular-nums text-white">
              {formatShare(slice.share)}
            </span>
          </span>
        ))}
      </div>
    </div>
  )
}

function Row({slice}: {slice: AllocationSlice}) {
  const gap = slice.gapPerWeekCents
  // Positive is the wrong direction on every row — buildAllocation flips the
  // sign on savings so this one rule holds for spending and saving alike.
  const off = gap !== null && gap !== 0
  const over = gap !== null && gap > 0

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3">
      <div className="min-w-0 flex-1 basis-48">
        <p className="text-sm font-bold">{slice.label}</p>
        <p className="mt-0.5 text-xs text-med-grey">{slice.hint}</p>
      </div>

      <div className="shrink-0 text-right tabular-nums">
        <p className="text-sm font-bold">
          {formatCents(slice.perWeekCents)}
          <span className="ml-1 text-xs font-normal text-med-grey">/wk</span>
        </p>
        <p className="text-xs text-med-grey">
          {formatShare(slice.share)} of pay
          {slice.targetShare !== null && (
            <> · guideline {formatShare(slice.targetShare)}</>
          )}
        </p>
      </div>

      <div className="w-24 shrink-0 text-right tabular-nums">
        {gap === null ? (
          <p className="text-xs text-med-grey">no guideline</p>
        ) : (
          <>
            <p
              className={`text-sm font-bold ${off ? (over ? "text-rose-400" : "text-emerald-400") : "text-med-grey"}`}
            >
              {over ? "+" : "−"}
              {formatCents(Math.abs(gap))}
            </p>
            <p className="text-xs text-med-grey">
              {slice.key === "savings"
                ? over
                  ? "short"
                  : "ahead"
                : over
                  ? "over"
                  : "under"}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * What a week of pay should be doing, against what it currently does.
 *
 * The split is 50/30/20 — essentials, optional, savings — and the only part
 * of it worth defending is the order. Savings come off the top, because a
 * savings rate defined as "whatever survives the month" reliably turns out to
 * be nothing. Everything else here is a comparison you're free to lose: the
 * guideline was invented by someone who doesn't know what your rent is.
 *
 * Income is stated as a minimum, so every figure below is a floor. A better
 * week only ever leaves more over.
 */
export default function AllocationPanel({report}: {report: AllocationReport}) {
  const meetsTarget = report.shortfallPerWeekCents === 0
  const overspending = report.leftoverPerWeekCents < 0

  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Headline
            label="Take home"
            value={formatCents(report.incomePerWeekCents)}
            hint={`a week after tax, at minimum — ${formatCents(report.incomePerMonthCents)} a month`}
          />
          <Headline
            label="Spending"
            value={formatCents(report.spendPerWeekCents)}
            hint={`${formatShare(report.spendShare)} of pay, forecast from the window`}
          />
          <Headline
            label="Left to save"
            value={formatCents(report.leftoverPerWeekCents)}
            hint={
              overspending
                ? "a week — you're spending more than you bring in"
                : `${formatShare(report.leftoverShare)} of pay, against a ${formatShare(report.savingsTargetShare)} target`
            }
            tone={overspending ? "negative" : meetsTarget ? "positive" : "neutral"}
          />
        </div>

        <div className="mt-6">
          <AllocationBar report={report} />
        </div>
      </div>

      <section
        className={`rounded-lg border p-4 ${
          meetsTarget && !overspending
            ? "border-emerald-400/30 bg-emerald-400/[0.05]"
            : "border-amber-400/30 bg-amber-400/[0.05]"
        }`}
      >
        <h3 className="text-sm font-bold">
          {overspending
            ? "There's nothing left to save"
            : meetsTarget
              ? `Move ${formatCents(report.savingsTargetPerWeekCents)} a week on payday`
              : `Save ${formatCents(report.savingsTargetPerWeekCents)} a week and you'll be short`}
        </h3>

        {overspending ? (
          <p className="mt-1.5 text-sm text-med-grey">
            Your average week spends{" "}
            <span className="font-bold text-white">
              {formatCents(Math.abs(report.leftoverPerWeekCents))}
            </span>{" "}
            more than it earns. Savings aren't the problem to solve first — the
            gap is. The optional row above is where the room is.
          </p>
        ) : meetsTarget ? (
          <p className="mt-1.5 text-sm text-med-grey">
            {formatShare(report.savingsTargetShare)} of your pay, standing
            order, before you spend anything. That leaves{" "}
            <span className="font-bold text-white">
              {formatCents(report.allowancePerWeekCents)}
            </span>{" "}
            a week to live on and you currently spend{" "}
            <span className="font-bold text-white">
              {formatCents(report.spendPerWeekCents)}
            </span>
            , so it clears — with{" "}
            <span className="font-bold text-emerald-400">
              {formatCents(report.leftoverPerWeekCents - report.savingsTargetPerWeekCents)}
            </span>{" "}
            a week spare on top.
          </p>
        ) : (
          <p className="mt-1.5 text-sm text-med-grey">
            Paying yourself first leaves{" "}
            <span className="font-bold text-white">
              {formatCents(report.allowancePerWeekCents)}
            </span>{" "}
            a week to live on, and you currently spend{" "}
            <span className="font-bold text-white">
              {formatCents(report.spendPerWeekCents)}
            </span>
            . Something has to give by{" "}
            <span className="font-bold text-rose-400">
              {formatCents(report.shortfallPerWeekCents)}
            </span>{" "}
            a week — {formatCents(Math.round(report.shortfallPerWeekCents * 52))}{" "}
            over a year. Start with the optional row; the essentials aren't a
            choice you make weekly.
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-bold">Every dollar of a week's pay</h3>
        <p className="mt-1 mb-2 text-sm text-med-grey">
          The first three rows are your own spending. The last is the
          remainder, which is the only honest definition of what you can save.
        </p>
        <div className="flex flex-col divide-y divide-white/5">
          {report.slices.map((slice) => (
            <Row key={slice.key} slice={slice} />
          ))}
        </div>
      </section>

      <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-med-grey">
        {report.sinkingPerWeekCents > 0 && (
          <p>
            <span className="font-bold text-white">
              {formatCents(report.sinkingPerWeekCents)}
            </span>{" "}
            a week of the spending above is irregular bills — rego, insurance,
            annual renewals. It behaves like savings right up until the bill
            lands, so keep it in a different account from the money you're
            actually saving, or you'll spend your savings on your car.
          </p>
        )}
        <p>
          If every optional dollar stopped, a week would cost{" "}
          <span className="font-bold text-white">
            {formatCents(report.floorPerWeekCents)}
          </span>{" "}
          and you could save{" "}
          <span className="font-bold text-white">
            {formatCents(report.bestCasePerWeekCents)}
          </span>
          . Nobody lives there — it's the ceiling on what cutting can achieve,
          worth knowing before you decide the answer is discipline. Anything
          unclassified is counted as essential in that figure, so it's the
          cautious version.
        </p>
        <p>
          Take-home comes from WEEKLY_TAKE_HOME in .env.local, not from the
          bank — Up can't tell gross deposits from net. It's your stated
          minimum, so every figure here is a floor. The spending side is the
          forecast: cancelled services, one-off purchases and merchants that
          stopped charging are already out of it.
        </p>
      </div>
    </div>
  )
}
