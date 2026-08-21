/**
 * Month bucketing for the dashboard.
 *
 * Up returns UTC timestamps, but "what did I spend in August" means August in
 * local time. On Vercel the server clock is UTC, so bucketing naively would
 * push up to 11 hours of every month into the wrong bucket. Everything here is
 * resolved against a fixed zone instead.
 */
export const TIME_ZONE = "Australia/Melbourne"

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

const zoneFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

type ZoneParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

function partsInZone(date: Date): ZoneParts {
  const raw: Record<string, string> = {}
  for (const part of zoneFormatter.formatToParts(date)) {
    if (part.type !== "literal") raw[part.type] = part.value
  }

  return {
    year: Number(raw.year),
    month: Number(raw.month),
    day: Number(raw.day),
    // Some ICU builds render midnight as "24" under hour12: false.
    hour: Number(raw.hour) % 24,
    minute: Number(raw.minute),
    second: Number(raw.second),
  }
}

/** How far ahead of UTC the zone is at this instant, in milliseconds. */
function offsetMs(date: Date): number {
  const p = partsInZone(date)
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return asUtc - date.getTime()
}

/**
 * The UTC instant matching midnight on the given local calendar date.
 * DST transitions in Australia happen at 2-3am, so midnight is never ambiguous.
 */
export function zonedMidnight(year: number, month: number, day = 1): Date {
  const guess = Date.UTC(year, month - 1, day)
  return new Date(guess - offsetMs(new Date(guess)))
}

export type MonthBucket = {
  /** Sortable key, e.g. "2026-08". */
  key: string
  /** Short display label, e.g. "Aug". */
  label: string
  /** Unambiguous label, e.g. "Aug 2025" — a window can span a year. */
  longLabel: string
  year: number
  month: number
}

function bucketFor(year: number, month: number): MonthBucket {
  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    label: MONTH_LABELS[month - 1],
    longLabel: `${MONTH_LABELS[month - 1]} ${year}`,
    year,
    month,
  }
}

/** Which month an Up timestamp falls into, in local time. */
export function monthKeyOf(iso: string): string {
  const p = partsInZone(new Date(iso))
  return `${p.year}-${String(p.month).padStart(2, "0")}`
}

/** The last `count` months, oldest first, ending with the current month. */
export function recentMonths(count: number, now = new Date()): MonthBucket[] {
  const {year, month} = partsInZone(now)
  const buckets: MonthBucket[] = []

  for (let back = count - 1; back >= 0; back--) {
    const offset = month - 1 - back
    buckets.push(
      bucketFor(
        year + Math.floor(offset / 12),
        (((offset % 12) + 12) % 12) + 1,
      ),
    )
  }

  return buckets
}

/**
 * How far through the current month we are, 0-1. The current month is only
 * partly spent, so comparing it against a full-month average without this is
 * apples to oranges — every month looks under budget until the 28th.
 */
export function monthProgress(now = new Date()): number {
  const {year, month, day, hour, minute} = partsInZone(now)
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const elapsed = day - 1 + (hour * 60 + minute) / 1440
  return Math.min(elapsed / daysInMonth, 1)
}

export function startOfMonth(bucket: MonthBucket): Date {
  return zonedMidnight(bucket.year, bucket.month)
}

/** RFC-3339 string for the Up API's `filter[since]` / `filter[until]` params. */
export function toRfc3339(date: Date): string {
  return date.toISOString()
}

export type MonthWindow = {
  /** Sortable key of the month this covers, e.g. "2026-08". */
  key: string
  /** Lower bound, RFC-3339. */
  since: string
  /** Upper bound. Absent on the final window, which simply runs to now. */
  until?: string
  /** True for the month still in progress — the only one that can change. */
  current: boolean
}

/**
 * Splits a date range into month-aligned windows, oldest first.
 *
 * Cursor pagination is sequential by nature: you cannot ask for page nine
 * without walking pages one to eight. A year of transactions is around fifty
 * of those round trips end to end, which on a constrained plan is enough to
 * run a request out of time before it renders anything. Cut the same range
 * into months and each is a short chain that can be walked alongside the
 * others, turning fifty sequential requests into a handful of concurrent
 * ones for the same fifty results.
 *
 * Windows share their boundary instant rather than trying to abut it exactly,
 * so a transaction landing on a month boundary is fetched twice rather than
 * missed once — whether Up reads `filter[until]` as inclusive or exclusive.
 * The caller dedupes by id.
 */
export function monthWindows(from: Date, now = new Date()): MonthWindow[] {
  const start = partsInZone(from)
  const end = partsInZone(now)
  const span = (end.year - start.year) * 12 + (end.month - start.month)
  const windows: MonthWindow[] = []

  for (let i = 0; i <= span; i++) {
    const offset = start.month - 1 + i
    const bucket = bucketFor(
      start.year + Math.floor(offset / 12),
      (offset % 12) + 1,
    )
    const nextBucket = bucketFor(
      start.year + Math.floor((offset + 1) / 12),
      ((offset + 1) % 12) + 1,
    )

    windows.push({
      key: bucket.key,
      // The first window honours the caller's exact start rather than
      // widening it to the whole month.
      since: toRfc3339(i === 0 ? from : startOfMonth(bucket)),
      until: i === span ? undefined : toRfc3339(startOfMonth(nextBucket)),
      current: i === span,
    })
  }

  return windows
}
