import "server-only"

import {cache} from "react"
import {verifySession} from "@/lib/auth/dal"
import type {UpCollection} from "./client"
import {upGet, upGetAll, upQuery} from "./client"
import {monthWindows} from "./period"
import {snapshotSince} from "./snapshot"
import type {
  UpAccount,
  UpCategory,
  UpPingResponse,
  UpTransaction,
} from "./types"

/**
 * Every export here calls verifySession() first, so there is no path from an
 * unauthenticated request to the bank API. Each is wrapped in React's cache()
 * so components can fetch what they need without prop drilling and still only
 * hit Up once per render.
 *
 * Balances are read live. History comes from the snapshot bundled at build
 * time (see ./snapshot), because walking it fresh on every load is slow
 * enough to be unreliable. Only when there's no snapshot does it go to the
 * network, and then through Next's data cache — the Refresh button clears
 * that (see refreshDashboard) when you want the walk repeated.
 */

/**
 * Cache tag for everything that reports on the past, so the Refresh button can
 * drop the lot in one call.
 */
export const UP_HISTORY_TAG = "up-history"

/**
 * The month in progress is the only one still moving, so it is the only one
 * fetched anything like live.
 */
const CURRENT_MONTH_TTL_SECONDS = 15 * 60

/**
 * Finished months are settled history. They are refetched twice a day only
 * because a hold placed last month can settle this one, which changes an
 * amount slightly and fills in a settlement date.
 */
const SETTLED_MONTH_TTL_SECONDS = 12 * 60 * 60

/**
 * How many month windows to walk at once. Each is a short cursor chain, and
 * running a handful side by side is what keeps a cold load comfortably inside
 * a serverless time limit. Kept well below the window count so a year of
 * history never arrives as one burst that Up would be right to rate limit.
 */
const CONCURRENT_WINDOWS = 6

/** Runs `task` across `items`, at most `limit` in flight at a time. */
async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  task: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length)
  let cursor = 0

  const workers = Array.from(
    {length: Math.min(limit, items.length)},
    async () => {
      while (true) {
        const index = cursor++
        if (index >= items.length) return
        results[index] = await task(items[index])
      }
    },
  )

  await Promise.all(workers)
  return results
}

/** Up's category taxonomy is fixed; refetching it hourly would be silly. */
const CATEGORY_TTL_SECONDS = 24 * 60 * 60

export const getAccounts = cache(async (): Promise<UpAccount[]> => {
  await verifySession()
  const {items} = await upGetAll<UpAccount>(
    `/accounts${upQuery({"page[size]": 100})}`,
  )
  return items
})

export const getCategories = cache(async (): Promise<UpCategory[]> => {
  await verifySession()
  const response = await upGet<{data: UpCategory[]}>("/categories", {
    revalidate: CATEGORY_TTL_SECONDS,
    tags: [UP_HISTORY_TAG],
  })
  return response.data
})

/**
 * All transactions from `sinceIso` to now. The parameter is a string rather
 * than a Date so cache() can key on it by value.
 *
 * Served from the build-time snapshot whenever there is one that covers the
 * window. This is the whole reason the dashboard renders in production: the
 * history is settled, so fetching it per-request was fifty round trips spent
 * re-learning something that hadn't changed.
 *
 * The fallback is the old path, kept because a clone with no snapshot should
 * still work: a month at a time, several months at once. One long cursor walk
 * is both slow (fifty round trips nose to tail) and badly cacheable (every
 * page expires together, so one stale page refetches the lot). A month is a
 * short walk under a URL that never changes, which means finished months can
 * sit in the cache for hours while today's stays fresh.
 *
 * `truncated` comes back with the data because the budget divides these
 * totals by a month count — an incomplete fetch would quietly understate
 * every average rather than fail.
 */
export const getTransactionsSince = cache(
  async (sinceIso: string): Promise<UpCollection<UpTransaction>> => {
    await verifySession()

    const bundled = snapshotSince(sinceIso)
    if (bundled) return bundled

    const windows = monthWindows(new Date(sinceIso))

    const pages = await mapWithLimit(windows, CONCURRENT_WINDOWS, (window) =>
      upGetAll<UpTransaction>(
        `/transactions${upQuery({
          "page[size]": 100,
          "filter[since]": window.since,
          "filter[until]": window.until,
        })}`,
        {
          revalidate: window.current
            ? CURRENT_MONTH_TTL_SECONDS
            : SETTLED_MONTH_TTL_SECONDS,
          tags: [UP_HISTORY_TAG],
        },
      ),
    )

    // Windows overlap on their boundary instant by design, so the merge has
    // to be by id rather than by concatenation.
    const byId = new Map<string, UpTransaction>()
    for (const page of pages) {
      for (const tx of page.items) byId.set(tx.id, tx)
    }

    return {
      items: [...byId.values()],
      truncated: pages.some((page) => page.truncated),
    }
  },
)

/** Cheap credential check — used by the dashboard to surface token problems. */
export const ping = cache(async (): Promise<UpPingResponse> => {
  await verifySession()
  return upGet<UpPingResponse>("/util/ping")
})
