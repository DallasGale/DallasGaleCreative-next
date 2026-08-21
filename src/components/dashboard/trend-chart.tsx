import {formatCents, formatCompactCents} from "@/lib/format"
import type {MonthSummary} from "@/lib/up/analytics"

/**
 * Spending per month. Built from CSS-sized bars rather than SVG so it scales
 * with the container and keeps text crisp at any width.
 *
 * Income isn't plotted: deposits arrive gross in some months and net in
 * others, so a second series would imply a comparison the data can't support.
 * The dashed line is the window average instead, which makes the same point a
 * chart is for — which months were the expensive ones.
 */
export default function TrendChart({
  series,
  averageCents,
}: {
  series: MonthSummary[]
  /** Typical month across the completed window, drawn as a baseline. */
  averageCents: number
}) {
  const peak = Math.max(...series.map((m) => m.spendingCents), averageCents, 1)
  const height = (value: number) => `${Math.max((value / peak) * 100, 0.5)}%`

  return (
    <div>
      <div className="mb-4 flex items-center gap-4 text-xs text-med-grey">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2 w-2 rounded-full bg-rose-400" />
          Spending
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-px w-4 border-t border-dashed border-white/50" />
          Typical month {formatCompactCents(averageCents)}
        </span>
        <span className="ml-auto tabular-nums">
          peak {formatCompactCents(peak)}
        </span>
      </div>

      <div className="flex h-44 items-end gap-1.5 md:h-56 md:gap-3">
        {series.map((month, i) => {
          const over = month.spendingCents > averageCents

          return (
            <div
              key={month.key}
              className="flex h-full flex-1 flex-col items-center gap-2"
            >
              <div className="relative flex w-full flex-1 items-end justify-center">
                {/* The average, drawn behind every bar so it reads as one
                    continuous line across the chart. */}
                <div
                  className="absolute inset-x-0 border-t border-dashed border-white/40"
                  style={{bottom: height(averageCents)}}
                />
                <div
                  className={`relative w-2/3 rounded-t-sm transition-all ${
                    over ? "bg-rose-400/90" : "bg-rose-400/50"
                  }`}
                  style={{height: height(month.spendingCents)}}
                  title={`${month.longLabel}: ${formatCents(month.spendingCents)}`}
                />
              </div>
              <span className="text-[10px] leading-tight text-med-grey md:text-[11px]">
                {month.label}
                {/* The window can span a year boundary, so mark the year
                    wherever it changes. */}
                {(i === 0 || series[i - 1].year !== month.year) && (
                  <span className="ml-0.5 opacity-60">
                    {String(month.year).slice(2)}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
