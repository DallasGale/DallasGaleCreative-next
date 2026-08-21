import {TIME_ZONE} from "./up/period"

const currency = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
})

const compact = new Intl.NumberFormat("en-AU", {
  style: "currency",
  currency: "AUD",
  notation: "compact",
  maximumFractionDigits: 1,
})

const dayMonth = new Intl.DateTimeFormat("en-AU", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
})

const dayMonthTime = new Intl.DateTimeFormat("en-AU", {
  timeZone: TIME_ZONE,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
})

/** Up returns amounts in cents. Everything on screen goes through here. */
export function formatCents(value: number): string {
  return currency.format(value / 100)
}

/** Same, but always carries an explicit + or − for cashflow figures. */
export function formatSignedCents(value: number): string {
  const formatted = currency.format(Math.abs(value) / 100)
  if (value === 0) return formatted
  return `${value > 0 ? "+" : "−"}${formatted}`
}

/** Short form for chart axes, e.g. "$1.2K". */
export function formatCompactCents(value: number): string {
  return compact.format(value / 100)
}

export function formatDay(iso: string): string {
  return dayMonth.format(new Date(iso))
}

export function formatDayTime(iso: string): string {
  return dayMonthTime.format(new Date(iso))
}

/** 0.42 -> "42%" */
export function formatShare(share: number): string {
  return `${Math.round(share * 100)}%`
}
