"use client"

import {useRouter} from "next/navigation"
import {useTransition} from "react"
import {refreshDashboard} from "@/app/actions/refresh"

/**
 * Repaints what's actually live: balances, and the saver positions built on
 * them. The transaction history behind the forecast is frozen at build time,
 * so this can't move it — see src/lib/up/snapshot.ts for why that trade is
 * the reason the page renders at all.
 */
export default function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await refreshDashboard()
          router.refresh()
        })
      }
      className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold transition-all hover:border-highlight hover:text-highlight disabled:opacity-40"
    >
      {pending ? "Refreshing…" : "Refresh"}
    </button>
  )
}
