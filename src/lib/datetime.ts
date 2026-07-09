import type { DaySegment } from "@/types";

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
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
];

export function parseDay(day: number): string {
  return DAYS[day] ?? "invalid day";
}

export function formatMonth(month: number): string {
  return MONTHS[month] ?? "invalid month";
}

export function daySuffix(dayOfMonth: number): string {
  if (dayOfMonth >= 11 && dayOfMonth <= 13) return "th";
  switch (dayOfMonth % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export function diurnalPeriods(hour: number): DaySegment {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

export function formatHour(hour: number): number {
  const twelve = hour % 12;
  return twelve === 0 ? 12 : twelve;
}

export function formatMin(min: number): string {
  return min.toString().padStart(2, "0");
}

export function meridiemIndicator(hour: number): "am" | "pm" {
  return hour < 12 ? "am" : "pm";
}

export type ClockData = {
  segment: DaySegment;
  welcome: string;
  date: string;
  time: string;
};

export function getClockData(now: Date = new Date()): ClockData {
  const day = now.getDay();
  const hour = now.getHours();
  const month = now.getMonth();
  const dayOfMonth = now.getDate();
  const mins = now.getMinutes();
  const year = now.getFullYear();
  const segment = diurnalPeriods(hour);

  return {
    segment,
    welcome: `Good ${segment}`,
    date: `It's ${parseDay(day)} ${dayOfMonth}${daySuffix(dayOfMonth)} ${formatMonth(month)}, ${year}`,
    time: `${formatHour(hour)}:${formatMin(mins)} ${meridiemIndicator(hour)}`,
  };
}
