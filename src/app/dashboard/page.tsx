import {Suspense} from "react"
import AccountsSection, {
  AccountsSectionSkeleton,
} from "@/components/dashboard/accounts-section"
import BudgetSection, {
  BudgetSectionSkeleton,
} from "@/components/dashboard/budget-section"
import {verifySession} from "@/lib/auth/dal"

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
