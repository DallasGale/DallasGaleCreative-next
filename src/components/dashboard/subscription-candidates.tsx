import {formatCents, formatDay} from "@/lib/format"
import {RECURRENCE_LABEL, type Subscription} from "@/lib/up/buckets"
import {EmptyState} from "./primitives"

/**
 * Merchants charging on a regular rhythm that no bucket claimed. The
 * Subscriptions bucket is a named list, which can't know about a service it
 * has never heard of — this is how those surface instead of sitting in Other.
 */
export default function SubscriptionCandidates({
  candidates,
}: {
  candidates: Subscription[]
}) {
  if (candidates.length === 0) {
    return (
      <EmptyState message="Nothing unaccounted for — every regular charge already belongs to a bucket." />
    )
  }

  return (
    <ul className="flex flex-col divide-y divide-white/5">
      {candidates.map((sub) => (
        <li
          key={sub.id}
          className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
        >
          <div className="flex min-w-0 flex-1 items-baseline gap-2">
            <span className="truncate text-sm">{sub.description}</span>
            <span className="shrink-0 rounded-full border border-sky-400/40 px-2 py-0.5 text-[10px] font-bold tracking-wide text-sky-300 uppercase">
              {RECURRENCE_LABEL[sub.recurrence]}
            </span>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold tabular-nums">
              {formatCents(sub.typicalCents)}
            </p>
            <p className="text-xs text-med-grey">
              {sub.count} charges · last {formatDay(sub.lastChargedAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
