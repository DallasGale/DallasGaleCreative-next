import type {Metadata} from "next"
import type {ReactNode} from "react"
import {logout} from "@/app/actions/auth"
import RefreshButton from "@/components/dashboard/refresh-button"

export const metadata: Metadata = {
  title: "Finances | Dallas Gale",
  // Private data — keep it out of search results regardless of the auth gate.
  robots: {index: false, follow: false},
}

export default function DashboardLayout({children}: {children: ReactNode}) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-med-grey uppercase">
              Up Banking
            </p>
            <h1 className="text-lg leading-tight font-bold">Finances</h1>
          </div>

          <div className="flex items-center gap-2">
            <RefreshButton />
            <form action={logout}>
              <button
                type="submit"
                className="rounded-full border border-white/20 px-4 py-1.5 text-xs font-bold transition-all hover:border-highlight hover:text-highlight"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 md:py-8">{children}</main>
    </div>
  )
}
