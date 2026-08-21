import "server-only"

import {redirect} from "next/navigation"
import {cache} from "react"
import {getSession} from "./session"

/**
 * The single gate for dashboard data. Every UP API query runs through this, so
 * an unauthenticated request can never reach the bank API — the proxy check is
 * only an optimistic pre-filter, this is the one that counts.
 *
 * Memoized per render pass so calling it from several components is free.
 */
export const verifySession = cache(async () => {
  const session = await getSession()

  if (!session) {
    redirect("/login")
  }

  return {isAuth: true as const, sub: session.sub}
})
