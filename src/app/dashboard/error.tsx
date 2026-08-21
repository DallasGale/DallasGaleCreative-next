"use client"

import {useEffect} from "react"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & {digest?: string}
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="rounded-lg border border-rose-400/30 bg-rose-400/[0.06] p-6">
      <h2 className="text-lg font-bold text-rose-400">
        Something went wrong loading your dashboard
      </h2>
      <p className="mt-2 text-sm text-med-grey">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold transition-all hover:border-highlight hover:text-highlight"
      >
        Try again
      </button>
    </div>
  )
}
