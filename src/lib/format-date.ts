/** Long Australian date, e.g. "3 November 2026". Dates are picked in the admin as Sydney calendar days. */
export function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Australia/Sydney",
  })
}
