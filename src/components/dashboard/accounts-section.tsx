import {unstable_rethrow} from "next/navigation"
import {formatCents} from "@/lib/format"
import {accountTotals} from "@/lib/up/analytics"
import {UpApiError} from "@/lib/up/client"
import {getAccounts} from "@/lib/up/queries"
import type {UpAccount} from "@/lib/up/types"
import AccountsGrid from "./accounts-grid"
import {CollapsiblePanel, ErrorPanel, Skeleton, Stat} from "./primitives"

export default async function AccountsSection() {
  let accounts: UpAccount[]

  try {
    accounts = await getAccounts()
  } catch (error) {
    // verifySession() redirects by throwing; that must not be swallowed here.
    unstable_rethrow(error)

    return (
      <ErrorPanel
        title="Couldn't load your accounts"
        detail={
          error instanceof UpApiError
            ? error.message
            : "Up didn't respond. Try reloading."
        }
      />
    )
  }

  const totals = accountTotals(accounts)
  const hasHomeLoan = totals.homeLoanCents !== 0

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label="Net position"
          value={formatCents(totals.netPositionCents)}
          hint={hasHomeLoan ? "Includes home loan" : "Across all accounts"}
          tone={totals.netPositionCents < 0 ? "negative" : "highlight"}
        />
        <Stat
          label="Spending accounts"
          value={formatCents(totals.spendingCents)}
          hint="Available to spend"
        />
        <Stat
          label="Savers"
          value={formatCents(totals.savingsCents)}
          hint="Set aside"
        />
      </div>

      {/*
        Closed by default: the three figures above already answer "how much
        have I got", and the per-account breakdown is a drill-down rather than
        something to scroll past on the way to the budget.
      */}
      <CollapsiblePanel
        title="Accounts"
        action={
          <span className="text-xs text-med-grey">
            {accounts.length} account{accounts.length === 1 ? "" : "s"}
          </span>
        }
      >
        <AccountsGrid accounts={accounts} />
      </CollapsiblePanel>
    </div>
  )
}

export function AccountsSectionSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[110px]" />
        ))}
      </div>
      {/* Matches the collapsed panel, not the grid it hides. */}
      <Skeleton className="h-[62px]" />
    </div>
  )
}
