import {formatCents, formatDay} from "@/lib/format"
import type {ExclusionReason, HeldSpend} from "@/lib/up/buckets"
import {EXCLUSION_LABEL} from "@/lib/up/buckets"
import {EmptyState} from "./primitives"

const WEEKS_PER_MONTH = 52 / 12

const BADGE: Record<ExclusionReason, string> = {
  cancelled: "border-rose-400/40 text-rose-300",
  finished: "border-violet-400/40 text-violet-300",
  "one-off": "border-sky-400/40 text-sky-300",
  dormant: "border-amber-400/40 text-amber-300",
}

/**
 * What the forecast refuses to carry forward.
 *
 * Holding money out of a forecast is only defensible if you can see exactly
 * what was held out and why, so every merchant is listed with its reason and
 * the weekly figure it would otherwise have contributed. The rules differ in
 * how much they're guessing: "cancelled" and "finished" are things you told
 * the app, "one-off" is a rule with a category guard, and "gone quiet" is
 * pure inference from a rhythm that stopped — check that one first.
 */
export default function HeldOutPanel({
  items,
  months,
}: {
  items: HeldSpend[]
  /** Window length, for putting each total in per-week terms. */
  months: number
}) {
  if (items.length === 0) {
    return (
      <EmptyState message="Nothing held out — every merchant in the window still looks live, so the forecast is the full history." />
    )
  }

  const perWeek = (cents: number) =>
    months === 0 ? 0 : Math.round(cents / months / WEEKS_PER_MONTH)

  const total = items.reduce((sum, item) => sum + item.totalCents, 0)

  return (
    <div>
      <ul className="flex flex-col divide-y divide-white/5">
        {items.map((item) => (
          <li key={item.key} className="py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <div className="min-w-0 flex-1 basis-56">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${BADGE[item.reason]}`}
                  >
                    {EXCLUSION_LABEL[item.reason]}
                  </span>
                  <span className="truncate text-sm font-bold">
                    {item.name}
                  </span>
                </div>
                <p className="mt-1 text-xs text-med-grey">{item.why}</p>
              </div>

              <div className="shrink-0 text-right tabular-nums">
                <p className="text-sm font-bold">
                  {formatCents(item.totalCents)}
                </p>
                <p className="text-xs text-med-grey">
                  {item.count} charge{item.count === 1 ? "" : "s"} · last{" "}
                  {formatDay(item.lastChargedAt)} ·{" "}
                  {formatCents(perWeek(item.totalCents))}/wk avoided
                </p>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 border-t border-white/10 pt-4 text-xs text-med-grey">
        <span className="font-bold text-white">{formatCents(total)}</span>{" "}
        across {months} months —{" "}
        <span className="font-bold text-white">
          {formatCents(perWeek(total))} a week
        </span>{" "}
        that the forecast doesn't ask you to put away. If something here is
        actually still running, that's a real hole in the budget: add it to
        ALWAYS_RECURRING_MERCHANTS to keep it in, move its category into
        LUMPY_BILL_CATEGORIES if it's an annual bill, or take it out of
        CANCELLED_MERCHANTS if you never cancelled it. Going the other way,
        ONE_OFF_CHARGES takes a single charge out by merchant and amount when
        the merchant itself is one you'll keep paying. All four live in
        src/lib/up/buckets.ts.
      </p>
    </div>
  )
}
