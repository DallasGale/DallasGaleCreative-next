import "server-only"

import {cache} from "react"
import {verifySession} from "@/lib/auth/dal"
import type {UpCollection} from "./client"
import {upGet, upGetAll, upQuery} from "./client"
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
 * Balances are read live. History is read from Next's data cache, because
 * walking it fresh on every load is slow enough to be unreliable — the Refresh
 * button clears it (see refreshDashboard) when you want the walk repeated.
 */

/**
 * Cache tag for everything that reports on the past, so the Refresh button can
 * drop the lot in one call.
 */
export const UP_HISTORY_TAG = "up-history"

/**
 * Thirteen months of transactions is around fifty sequential requests to Up.
 * Doing that on every page load is what makes a render long enough for the
 * connection to be cut mid-stream — and all but the last few days of it is
 * settled history that cannot change. Fifteen minutes keeps today's spending
 * close to live while making a reload essentially free.
 */
const HISTORY_TTL_SECONDS = 15 * 60

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
 * `truncated` comes back with the data because the budget divides these
 * totals by a month count — an incomplete fetch would quietly understate
 * every average rather than fail.
 */
export const getTransactionsSince = cache(
  async (sinceIso: string): Promise<UpCollection<UpTransaction>> => {
    await verifySession()
    return upGetAll<UpTransaction>(
      `/transactions${upQuery({
        "page[size]": 100,
        "filter[since]": sinceIso,
      })}`,
      {revalidate: HISTORY_TTL_SECONDS, tags: [UP_HISTORY_TAG]},
    )
  },
)

/** Cheap credential check — used by the dashboard to surface token problems. */
export const ping = cache(async (): Promise<UpPingResponse> => {
  await verifySession()
  return upGet<UpPingResponse>("/util/ping")
})
