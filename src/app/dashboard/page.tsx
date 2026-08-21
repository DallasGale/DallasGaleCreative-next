import {Suspense} from "react"
import AccountsSection, {
  AccountsSectionSkeleton,
} from "@/components/dashboard/accounts-section"
import BudgetSection, {
  BudgetSectionSkeleton,
} from "@/components/dashboard/budget-section"
import {verifySession} from "@/lib/auth/dal"

/**
 * Sixty seconds is the ceiling on Vercel's Hobby plan, so this is as much room
 * as the route can ask for — and the reason the history is fetched a month at
 * a time, several at once, rather than as one fifty-request cursor walk. A
 * render that runs out of time surfaces as a closed connection rather than as
 * an error anyone can act on, so the budget here is real.
 */
export const maxDuration = 60

export default async function DashboardPage() {
  // Redirects to /login if the session cookie is missing or invalid.
  await verifySession()

  return (
    <div className="flex flex-col gap-5">
      {/* Balances are a single request, so they paint well before the
          thirteen months of paginated transactions finish loading. */}
      <Suspense fallback={<AccountsSectionSkeleton />}>
        <AccountsSection />
      </Suspense>

      <Suspense fallback={<BudgetSectionSkeleton />}>
        <BudgetSection />
      </Suspense>
    </div>
  )
}
