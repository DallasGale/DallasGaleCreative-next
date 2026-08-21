import {Suspense} from "react"
import AccountsSection, {
  AccountsSectionSkeleton,
} from "@/components/dashboard/accounts-section"
import BudgetSection, {
  BudgetSectionSkeleton,
} from "@/components/dashboard/budget-section"
import {verifySession} from "@/lib/auth/dal"

/**
 * Thirteen months of paginated bank history is a long render on a cold cache.
 * The platform default is generous, but this route is the one place in the app
 * that can genuinely need the time, and a render cut short mid-stream surfaces
 * as a closed connection rather than as an error anyone can act on.
 */
export const maxDuration = 300

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
