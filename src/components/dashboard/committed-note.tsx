import {formatCents} from "@/lib/format"
import type {Committed} from "@/lib/up/pricing"

/**
 * Costs the forecast has been told about rather than shown.
 *
 * Everything else on this page is derived from charges that really happened,
 * and this is the one block that isn't — so it says so, in its own box, with
 * the reason each entry was added. A commitment can't be contradicted by the
 * history the way a repriced subscription can, which makes an entry that has
 * stopped being true invisible unless it's kept in plain sight.
 */
export default function CommittedNote({
  added,
  perMonthCents,
}: {
  added: Committed[]
  perMonthCents: number
}) {
  if (added.length === 0) return null

  const one = added.length === 1

  return (
    <section className="rounded-lg border border-amber-400/20 bg-amber-400/[0.04] px-4 py-3.5 text-sm text-med-grey">
      <p>
        {one ? "One cost is" : `${added.length} costs are`} in the forecast
        without being in the history, adding{" "}
        <span className="font-bold text-amber-300">
          {formatCents(perMonthCents)} a month
        </span>{" "}
        to everything below.
      </p>

      <ul className="mt-2.5 flex flex-col gap-1.5 text-xs">
        {added.map((item) => (
          <li
            key={item.description}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
          >
            <span className="min-w-0">
              <span className="font-bold text-white">{item.description}</span> ·{" "}
              {item.detail} — {item.why}
            </span>
            <span className="shrink-0 tabular-nums font-bold text-white">
              {formatCents(item.perMonthCents)} a month
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2.5 text-xs">
        These live in COMMITMENTS in src/lib/up/pricing.ts. Take one out once
        the real charges have a year behind them and the average can speak for
        itself, or once it stops — nothing in your account will ever contradict
        an entry that's gone stale.
      </p>
    </section>
  )
}
