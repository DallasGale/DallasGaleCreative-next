"use server"

import {updateTag} from "next/cache"
import {verifySession} from "@/lib/auth/dal"
import {UP_HISTORY_TAG} from "@/lib/up/queries"

/**
 * Throws away anything cached from the bank so the next render asks again.
 *
 * With a build-time snapshot in place this mostly clears the categories and
 * whatever else still goes over the wire; the history itself only refetches
 * on a clone with no snapshot. Balances were never cached, so they repaint
 * from the router refresh that follows.
 *
 * What this cannot do is age the snapshot forward — that takes a deploy, or
 * `pnpm snapshot` locally. The button says "Refresh", and it's worth knowing
 * it means "refresh what's live" rather than "refetch the year".
 *
 * updateTag rather than revalidateTag because this is the one case where
 * stale-while-revalidate is exactly wrong: someone pressing Refresh is asking
 * to wait for the real thing.
 */
export async function refreshDashboard(): Promise<void> {
  // Same gate as every other path to the bank API.
  await verifySession()
  updateTag(UP_HISTORY_TAG)
}
