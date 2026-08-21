import {formatCents, formatShare} from "@/lib/format"
import type {BudgetGroup, Cadence, CategoryBudget} from "@/lib/up/analytics"
import {EmptyState} from "./primitives"

const CADENCE_STYLE: Record<Cadence, string> = {
  regular: "border-white/15 text-med-grey",
  occasional: "border-sky-400/40 text-sky-300",
  rare: "border-violet-400/40 text-violet-300",
}

function CadenceBadge({row, months}: {row: CategoryBudget; months: number}) {
  const label = {
    regular: "Regular",
    occasional: "Occasional",
    rare: "Irregular",
  }[row.cadence]

  return (
    <span
      className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${CADENCE_STYLE[row.cadence]}`}
      title={`Spent in ${row.monthsWithSpend} of ${months} months`}
    >
      {label}
    </span>
  )
}

/**
 * One bar per month. Makes lumpiness legible at a glance — a flat
 * row is a bill you can pay as you go, a single spike is one you have to
 * have saved for.
 */
function Sparkline({row}: {row: CategoryBudget}) {
  const peak = Math.max(...row.monthly.map((m) => m.cents), 1)

  return (
    <div className="flex h-6 items-end gap-px" aria-hidden="true">
      {row.monthly.map((month) => (
        <div
          key={month.key}
          className="flex-1 rounded-t-[1px] bg-white/25"
          style={{height: `${Math.max((month.cents / peak) * 100, 3)}%`}}
        />
      ))}
    </div>
  )
}

/**
 * Where this month sits against the average, with a marker for how far
 * through the month we actually are — without it every month looks under
 * budget until the last few days.
 */
function Pace({row, progress}: {row: CategoryBudget; progress: number}) {
  if (row.perMonthCents === 0) return null

  const used = row.thisMonthCents / row.perMonthCents
  const over = used > progress + 0.1

  return (
    <div className="mt-2">
      <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full rounded-full ${over ? "bg-rose-400" : "bg-emerald-400"}`}
          style={{width: `${Math.min(used * 100, 100)}%`}}
        />
        <div
          className="absolute top-0 h-full w-px bg-white/60"
          style={{left: `${progress * 100}%`}}
          title="Where you'd expect to be by today"
        />
      </div>
      <p className="mt-1 text-xs text-med-grey">
        {formatCents(row.thisMonthCents)} this month of{" "}
        {formatCents(row.perMonthCents)} average
        {over && <span className="ml-1 text-rose-400">· ahead of pace</span>}
      </p>
    </div>
  )
}

function Amounts({row}: {row: CategoryBudget}) {
  return (
    <div className="grid shrink-0 grid-cols-3 gap-x-4 text-right tabular-nums sm:gap-x-6">
      <div>
        <p className="text-sm font-bold text-highlight sm:text-base">
          {formatCents(row.perWeekCents)}
        </p>
        <p className="text-[10px] tracking-wide text-med-grey uppercase">
          / week
        </p>
      </div>
      <div>
        <p className="text-sm font-bold sm:text-base">
          {formatCents(row.perMonthCents)}
        </p>
        <p className="text-[10px] tracking-wide text-med-grey uppercase">
          / month
        </p>
      </div>
      <div>
        <p className="text-sm text-med-grey sm:text-base">
          {formatCents(row.totalCents)}
        </p>
        <p className="text-[10px] tracking-wide text-med-grey uppercase">
          total
        </p>
      </div>
    </div>
  )
}

function ChildRow({
  row,
  months,
  note,
}: {
  row: CategoryBudget
  months: number
  note?: string
}) {
  return (
    <li className="border-t border-white/5 py-3 pl-4 sm:pl-9">
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="truncate text-sm">{row.name}</span>
          {note ? (
            <span className="shrink-0 rounded-full border border-highlight/40 px-2 py-0.5 text-[10px] font-bold tracking-wide text-highlight uppercase">
              {note}
            </span>
          ) : (
            <CadenceBadge row={row} months={months} />
          )}
        </div>
        <Amounts row={row} />
      </div>
      <div className="mt-2 flex items-end gap-4">
        <div className="w-24 shrink-0 sm:w-36">
          <Sparkline row={row} />
        </div>
        <p className="flex-1 text-xs text-med-grey">
          Worst month {formatCents(row.largestMonthCents)} · {row.monthsWithSpend}
          /{months} months
          {row.thisMonthCents > 0 &&
            ` · ${formatCents(row.thisMonthCents)} so far this month`}
        </p>
      </div>
    </li>
  )
}

function Group({
  group,
  months,
  progress,
  childNote,
}: {
  group: BudgetGroup
  months: number
  progress: number
  childNote?: (row: CategoryBudget) => string | undefined
}) {
  const header = (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          {group.children.length > 0 && (
            <span
              className="text-med-grey transition-transform group-open/cat:rotate-90"
              aria-hidden="true"
            >
              ›
            </span>
          )}
          <span className="truncate font-bold">{group.name}</span>
          <CadenceBadge row={group} months={months} />
          <span className="shrink-0 text-xs text-med-grey">
            {formatShare(group.share)}
          </span>
        </div>
        <div className="w-32 sm:w-44">
          <Sparkline row={group} />
        </div>
      </div>
      <Amounts row={group} />
    </div>
  )

  const body = (
    <>
      <Pace row={group} progress={progress} />
      {group.children.length > 0 && (
        <ul className="mt-3 border-t border-white/10 pt-1">
          {group.children.map((child) => (
            <ChildRow
              key={child.id}
              row={child}
              months={months}
              note={childNote?.(child)}
            />
          ))}
        </ul>
      )}
    </>
  )

  if (group.children.length === 0) {
    return (
      <li className="border-b border-white/10 px-1 py-4 last:border-b-0">
        {header}
        <Pace row={group} progress={progress} />
      </li>
    )
  }

  return (
    <li className="border-b border-white/10 last:border-b-0">
      {/* <details> keeps the drill-down free of client JavaScript. */}
      <details className="group/cat">
        <summary className="cursor-pointer list-none px-1 py-4 [&::-webkit-details-marker]:hidden">
          {header}
        </summary>
        <div className="px-1 pb-4">{body}</div>
      </details>
    </li>
  )
}

/**
 * Renders any two-level spending breakdown — Up's categories or the custom
 * buckets — so both views stay visually and numerically consistent.
 */
export default function BudgetTable({
  groups,
  months,
  progress,
  childNote,
  emptyMessage = "No spending found in this window.",
}: {
  groups: BudgetGroup[]
  months: number
  /** How far through the current month we are, 0-1. */
  progress: number
  /** Optional badge for child rows, e.g. a subscription's billing cadence. */
  childNote?: (row: CategoryBudget) => string | undefined
  emptyMessage?: string
}) {
  if (groups.length === 0) {
    return <EmptyState message={emptyMessage} />
  }

  return (
    <ul className="flex flex-col">
      {groups.map((group) => (
        <Group
          key={group.id}
          group={group}
          months={months}
          progress={progress}
          childNote={childNote}
        />
      ))}
    </ul>
  )
}
