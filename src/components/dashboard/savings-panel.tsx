import {formatCents, formatDay, formatShare} from "@/lib/format"
import type {Opportunity, OpportunityKind, SavingsReport} from "@/lib/up/savings"
import {EmptyState} from "./primitives"

const KIND_META: Record<OpportunityKind, {label: string; badge: string}> = {
  fees: {label: "Wasted", badge: "border-rose-400/40 text-rose-300"},
  overlap: {label: "Duplicate", badge: "border-amber-400/40 text-amber-300"},
  "price-rise": {label: "Price rise", badge: "border-amber-400/40 text-amber-300"},
  habit: {label: "Habit", badge: "border-sky-400/40 text-sky-300"},
  drift: {label: "Drifting", badge: "border-violet-400/40 text-violet-300"},
}

function Card({item}: {item: Opportunity}) {
  const meta = KIND_META[item.kind]
  // Every other kind's headline figure is a saving you could bank. A price
  // rise is the exception — it's the extra you've started paying, not what
  // the thing costs — and unlabelled, a small number sitting beside a
  // merchant's name reads as that merchant's bill.
  const period = item.kind === "price-rise" ? "a year extra" : "a year"

  return (
    <details className="group/opp rounded-lg border border-white/10 bg-white/[0.02] p-4">
      <summary className="flex cursor-pointer list-none flex-wrap items-start justify-between gap-x-4 gap-y-2 [&::-webkit-details-marker]:hidden">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${meta.badge}`}
            >
              {meta.label}
            </span>
            <svg
              viewBox="0 0 16 16"
              aria-hidden="true"
              className="size-3 text-med-grey transition-transform group-open/opp:rotate-90"
            >
              <path
                d="M6 3l5 5-5 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
          </div>
          <p className="text-sm font-bold">{item.title}</p>
          <p className="mt-1 text-sm text-med-grey">{item.detail}</p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-lg font-bold tabular-nums text-highlight">
            {formatCents(item.annualCents)}
          </p>
          <p className="text-xs text-med-grey">
            {period} · {formatCents(item.perWeekCents)} a week
          </p>
        </div>
      </summary>

      <div className="mt-4 border-t border-white/10 pt-4">
        <p className="text-sm">{item.action}</p>
        <dl className="mt-3 flex flex-col divide-y divide-white/5">
          {item.evidence.map((row) => (
            <div
              key={row.label}
              className="flex items-baseline justify-between gap-4 py-2"
            >
              <dt className="min-w-0 truncate text-sm text-med-grey">
                {row.label}
              </dt>
              <dd className="shrink-0 text-right">
                <span className="text-sm font-bold tabular-nums">
                  {row.value}
                </span>
                {row.note && (
                  <span className="ml-2 text-xs text-med-grey">{row.note}</span>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </details>
  )
}

/** Essential / discretionary / unclassified, as one bar. */
function NecessityBar({report}: {report: SavingsReport}) {
  const segments = [
    {
      key: "essential",
      label: "Essential",
      cents: report.essentialPerMonthCents,
      className: "bg-white/25",
    },
    {
      key: "discretionary",
      label: "Discretionary",
      cents: report.discretionaryPerMonthCents,
      className: "bg-highlight",
    },
    {
      key: "unclear",
      label: "Unclassified",
      cents: report.unclearPerMonthCents,
      className: "bg-white/10",
    },
  ]

  const total = segments.reduce((sum, s) => sum + s.cents, 0)
  if (total === 0) return null

  return (
    <div>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-white/5">
        {segments.map((segment) => (
          <div
            key={segment.key}
            className={segment.className}
            style={{width: `${(segment.cents / total) * 100}%`}}
            title={`${segment.label}: ${formatCents(segment.cents)} a month`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-med-grey">
        {segments.map((segment) => (
          <span key={segment.key} className="flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-full ${segment.className}`}
            />
            {segment.label}
            <span className="font-bold tabular-nums text-white">
              {formatCents(segment.cents)}
            </span>
            a month
          </span>
        ))}
      </div>
    </div>
  )
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
  tone?: "neutral" | "highlight"
}) {
  return (
    <div>
      <p className="text-xs font-bold tracking-widest text-med-grey uppercase">
        {label}
      </p>
      <p
        className={`mt-1.5 text-2xl font-bold tabular-nums md:text-3xl ${
          tone === "highlight" ? "text-highlight" : "text-white"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-xs text-med-grey">{hint}</p>
    </div>
  )
}

/**
 * The "where can I cut" view.
 *
 * Nothing here is a rule about how to live: every figure is derived from the
 * account's own history, and the two tiers are kept apart deliberately —
 * cancelling a duplicate streaming service is money you have on Monday,
 * buying less coffee is a plan. Presenting them as one number would make the
 * whole panel untrustworthy.
 */
export default function SavingsPanel({report}: {report: SavingsReport}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Headline
            label="Optional spending"
            value={formatCents(report.discretionaryPerMonthCents)}
            hint={`a month — ${formatShare(report.discretionaryShare)} of everything classified`}
          />
          <Headline
            label="Cancel today"
            value={formatCents(report.certainAnnualCents)}
            hint="a year, with nothing else changing"
            tone="highlight"
          />
          <Headline
            label="Change a habit"
            value={formatCents(report.behaviouralAnnualCents)}
            hint="a year at most — these can overlap"
          />
        </div>

        <div className="mt-6">
          <NecessityBar report={report} />
        </div>
      </div>

      <section>
        <h3 className="text-sm font-bold">Cancel it and the money stops</h3>
        <p className="mt-1 mb-4 text-sm text-med-grey">
          Costs you can remove without living any differently. Expand a row for
          the charges behind it.
        </p>
        {report.certain.length === 0 ? (
          <EmptyState message="Nothing obviously wasted — no duplicate services, fees or unannounced price rises in this window." />
        ) : (
          <div className="flex flex-col gap-3">
            {report.certain.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="text-sm font-bold">Worth less if you spend less</h3>
        <p className="mt-1 mb-4 text-sm text-med-grey">
          These need you to do something differently, so they aren't money in
          hand. Each target is your own past behaviour rather than an invented
          number.
        </p>
        {report.behavioural.length === 0 ? (
          <EmptyState message="No runaway habits or categories drifting above their own baseline." />
        ) : (
          <div className="flex flex-col gap-3">
            {report.behavioural.map((item) => (
              <Card key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>

      {report.cancelled.length > 0 && (
        <section>
          <h3 className="text-sm font-bold">Already cancelled</h3>
          <p className="mt-1 mb-4 text-sm text-med-grey">
            Still in the {report.months}-month history because you paid for
            them then, and deliberately absent from every suggestion above —
            there is nothing left to decide.{" "}
            <span className="font-bold text-white">
              {formatCents(report.cancelledAnnualCents)}
            </span>{" "}
            a year is already off the books.
          </p>
          <ul className="flex flex-col divide-y divide-white/5">
            {report.cancelled.map((service) => (
              <li
                key={service.key}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate text-sm text-med-grey line-through">
                  {service.name}
                </span>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums">
                    {formatCents(service.totalCents)}
                  </p>
                  <p className="text-xs text-med-grey">
                    {service.count} charge{service.count === 1 ? "" : "s"} ·
                    last {formatDay(service.lastChargedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {report.ungrouped.length > 0 && (
        <p className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs text-med-grey">
          {report.ungrouped.length} subscription
          {report.ungrouped.length === 1 ? " isn't" : "s aren't"} grouped by
          type, so nothing above compares{" "}
          {report.ungrouped.length === 1 ? "it" : "them"} for overlap:{" "}
          {report.ungrouped.map((service, index) => (
            <span key={service.name}>
              {index > 0 && ", "}
              <span className="text-white">{service.name}</span> (
              {formatCents(service.annualCents)}/yr)
            </span>
          ))}
          . Add the merchant to a genre in SUBSCRIPTION_GENRES to fix that.
        </p>
      )}

      <p className="border-t border-white/10 pt-4 text-xs text-med-grey">
        For context, {report.subscriptionCount} subscription
        {report.subscriptionCount === 1 ? "" : "s"} cost{" "}
        <span className="font-bold text-white">
          {formatCents(report.subscriptionAnnualCents)}
        </span>{" "}
        a year in total — the whole pool is optional, whether or not it shows
        up above. Unclassified spending isn't counted as optional, so the real
        figure is likely higher, not lower.
      </p>
    </div>
  )
}
