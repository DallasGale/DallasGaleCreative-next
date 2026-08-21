"use server"

import {updateTag} from "next/cache"
import {verifySession} from "@/lib/auth/dal"
import {UP_HISTORY_TAG} from "@/lib/up/queries"

/**
 * Throws away the cached transaction history so the next render walks Up
 * again from the first page.
 *
 * Without this the Refresh button would be a lie for fifteen minutes at a
 * time: balances would update and every figure built on transactions would
 * sit still. updateTag rather than revalidateTag because this is the one case
 * where stale-while-revalidate is exactly wrong — someone pressing Refresh is
 * asking to wait for the real thing.
 */
export async function refreshDashboard(): Promise<void> {
  // Same gate as every other path to the bank API.
  await verifySession()
  updateTag(UP_HISTORY_TAG)
}
