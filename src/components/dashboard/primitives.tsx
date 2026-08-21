import type {ReactNode} from "react"

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={`rounded-lg border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm ${className}`}
    >
      <header className="mb-4 flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-bold tracking-widest text-med-grey uppercase">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  )
}

/**
 * A Panel that can be folded away, closed unless told otherwise.
 *
 * Built on <details> so it costs no client JavaScript — every other component
 * on this dashboard renders on the server, and one disclosure toggle isn't
 * worth shipping a bundle for. `action` stays in the summary row so a closed
 * panel still says something useful about what's inside it.
 */
export function CollapsiblePanel({
  title,
  action,
  children,
  defaultOpen = false,
  className = "",
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
  className?: string
}) {
  return (
    <details
      open={defaultOpen}
      className={`group/panel rounded-lg border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm ${className}`}
    >
      <summary className="flex cursor-pointer list-none items-baseline justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <h2 className="flex items-center gap-2 text-xs font-bold tracking-widest text-med-grey uppercase">
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
            className="size-3 shrink-0 self-center transition-transform group-open/panel:rotate-90"
          >
            <path
              d="M6 3l5 5-5 5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          {title}
        </h2>
        {action}
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  )
}

export function Stat({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string
  value: string
  hint?: string
  tone?: "neutral" | "positive" | "negative" | "highlight"
}) {
  const toneClass = {
    neutral: "text-white",
    positive: "text-emerald-400",
    negative: "text-rose-400",
    highlight: "text-highlight",
  }[tone]

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-5">
      <p className="text-xs font-bold tracking-widest text-med-grey uppercase">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-bold tabular-nums md:text-3xl ${toneClass}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-med-grey">{hint}</p>}
    </div>
  )
}

export function EmptyState({message}: {message: string}) {
  return <p className="py-6 text-sm text-med-grey">{message}</p>
}

/** Inline failure panel — a bad token shouldn't take the whole page down. */
export function ErrorPanel({title, detail}: {title: string; detail: string}) {
  return (
    <div className="rounded-lg border border-rose-400/30 bg-rose-400/[0.06] p-5">
      <p className="text-sm font-bold text-rose-400">{title}</p>
      <p className="mt-1 text-sm text-med-grey">{detail}</p>
    </div>
  )
}

export function Skeleton({className = ""}: {className?: string}) {
  return <div className={`animate-pulse rounded bg-white/10 ${className}`} />
}
