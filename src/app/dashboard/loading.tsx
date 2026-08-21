import {AccountsSectionSkeleton} from "@/components/dashboard/accounts-section"
import {BudgetSectionSkeleton} from "@/components/dashboard/budget-section"

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-5">
      <AccountsSectionSkeleton />
      <BudgetSectionSkeleton />
    </div>
  )
}
