import {formatCents, formatCompactCents} from "@/lib/format"
import type {MerchantSpend} from "@/lib/up/analytics"
import {EmptyState} from "./primitives"

/**
 * Where the money actually went, biggest first.
 *
 * Horizontal bars rather than vertical: merchant names are long and arbitrary,
 * and a horizontal axis would either clip them or turn them on their side.
 * This way the label sits on the same line as the bar it belongs to, and the
 * ranking reads top to bottom the way a list does.
 *
 * Sized in CSS against the largest merchant rather than against the total, so
 * the longest bar always fills the row — the comparison worth making here is
 * between merchants, not each merchant against everything you spent.
 */
export default function MerchantsChart({
  merchants,
  months,
}: {
  merchants: MerchantSpend[]
  /** Window length, used to put each total in per-month terms. */
  months: number
}) {
  if (merchants.length === 0) {
    return <EmptyState message="No merchant spending in this window yet." />
  }

  const peak = Math.max(...merchants.map((m) => m.cents), 1)
  const total = merchants.reduce((sum, m) => sum + m.cents, 0)

  return (
    <div className="flex flex-col gap-4">
      <ol className="flex flex-col gap-3">
        {merchants.map((merchant, index) => {
          const perMonth = months === 0 ? 0 : Math.round(merchant.cents / months)

          return (
            <li key={merchant.description} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-4">
                <div className="flex min-w-0 items-baseline gap-2.5">
                  <span className="w-4 shrink-0 text-xs text-med-grey tabular-nums">
                    {index + 1}
                  </span>
                  <span className="truncate text-sm">
                    {merchant.description}
                  </span>
                </div>
                <div className="shrink-0 text-right">
                  <span className="text-sm font-bold tabular-nums">
                    {formatCents(merchant.cents)}
                  </span>
                  <span className="ml-2 text-xs text-med-grey tabular-nums">
                    {formatCompactCents(perMonth)}/mo
                  </span>
                </div>
              </div>

              <div className="ml-6.5 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-highlight"
                    style={{width: `${Math.max((merchant.cents / peak) * 100, 1)}%`}}
                  />
                </div>
                <span className="w-24 shrink-0 text-right text-xs text-med-grey tabular-nums">
                  {merchant.count}{" "}
                  {merchant.count === 1 ? "purchase" : "purchases"}
                </span>
              </div>
            </li>
          )
        })}
      </ol>

      <p className="border-t border-white/10 pt-3 text-xs text-med-grey">
        These {merchants.length} merchants account for{" "}
        <span className="font-bold text-white">{formatCents(total)}</span> over{" "}
        {months} months — {formatCents(Math.round(total / months))} a month.
      </p>
    </div>
  )
}
