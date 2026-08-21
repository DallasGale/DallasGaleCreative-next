"use client"

import {useRouter} from "next/navigation"
import {useTransition} from "react"

/**
 * Dashboard data is fetched with `cache: "no-store"`, so a router refresh
 * re-runs the server components against live balances.
 */
export default function RefreshButton() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold transition-all hover:border-highlight hover:text-highlight disabled:opacity-40"
    >
      {pending ? "Refreshing…" : "Refresh"}
    </button>
  )
}
