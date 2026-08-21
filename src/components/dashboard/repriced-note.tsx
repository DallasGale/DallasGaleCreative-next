import {formatCents} from "@/lib/format"
import type {Repricing} from "@/lib/up/pricing"

const SOURCE_NOTE: Record<Repricing["source"], string> = {
  declared: "you said so",
  latest: "its most recent charge",
}

/**
 * What the forecast expects each subscription to cost, where that differs
 * from what it averaged.
 *
 * The headline figure moves when this list isn't empty, so it says which
 * merchants moved it and by how much. A price you stated is used even when no
 * charge at that price has landed yet, which is the point — but it also means
 * a stale entry here silently misprices the year, so each one is shown with
 * its source rather than folded into a total.
 */
export default function RepricedNote({
  changes,
  perMonthDeltaCents,
}: {
  changes: Repricing[]
  perMonthDeltaCents: number
}) {
  if (changes.length === 0) return null

  const one = changes.length === 1
  const rose = perMonthDeltaCents > 0

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-med-grey">
      <p>
        {one ? "One subscription is" : `${changes.length} subscriptions are`}{" "}
        forecast at what {one ? "it costs" : "they cost"} now rather than what{" "}
        {one ? "it" : "they"} averaged over the window
        {perMonthDeltaCents === 0 ? (
          "."
        ) : (
          <>
            , which {rose ? "adds" : "takes"}{" "}
            <span className={`font-bold ${rose ? "text-rose-400" : "text-emerald-400"}`}>
              {formatCents(Math.abs(perMonthDeltaCents))} a month
            </span>{" "}
            {rose ? "to" : "off"} everything below.
          </>
        )}
      </p>

      <ul className="mt-2.5 flex flex-col gap-1.5 text-xs">
        {changes.map((change) => (
          <li
            key={change.key}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5"
          >
            <span className="min-w-0">
              <span className="font-bold text-white">{change.name}</span> ·{" "}
              {change.detail} ({SOURCE_NOTE[change.source]})
            </span>
            <span className="shrink-0 tabular-nums">
              {formatCents(change.wasPerMonthCents)} →{" "}
              <span className="font-bold text-white">
                {formatCents(change.perMonthCents)}
              </span>{" "}
              a month
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-2.5 text-xs">
        Prices you've stated yourself live in CURRENT_PRICES in
        src/lib/up/pricing.ts — add a line there whenever a plan changes, and
        the forecast uses it immediately instead of waiting a year for the
        average to catch up. Everything else is read from the most recent
        charge at merchants that bill on a steady rhythm.
      </p>
    </section>
  )
}
