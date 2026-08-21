"use client"

import {useRouter} from "next/navigation"
import {useTransition} from "react"
import {refreshDashboard} from "@/app/actions/refresh"

/**
 * Balances are fetched live, so a router refresh alone would repaint those and
 * leave every transaction-derived figure exactly as it was — the history is
 * cached for fifteen minutes so the page can load at all. Dropping that cache
 * first is what makes this button mean what it says.
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
