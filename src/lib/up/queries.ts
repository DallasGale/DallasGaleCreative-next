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
 */

export const getAccounts = cache(async (): Promise<UpAccount[]> => {
  await verifySession()
  const {items} = await upGetAll<UpAccount>(
    `/accounts${upQuery({"page[size]": 100})}`,
  )
  return items
})

export const getCategories = cache(async (): Promise<UpCategory[]> => {
  await verifySession()
  const response = await upGet<{data: UpCategory[]}>("/categories")
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
    )
  },
)

/** Cheap credential check — used by the dashboard to surface token problems. */
export const ping = cache(async (): Promise<UpPingResponse> => {
  await verifySession()
  return upGet<UpPingResponse>("/util/ping")
})
