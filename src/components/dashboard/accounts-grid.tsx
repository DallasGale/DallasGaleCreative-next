import {formatCents} from "@/lib/format"
import type {UpAccount} from "@/lib/up/types"
import {EmptyState} from "./primitives"

type AccountType = UpAccount["attributes"]["accountType"]

const TYPE_META: Record<
  AccountType,
  {label: string; badge: string; bar: string}
> = {
  TRANSACTIONAL: {
    label: "Spending",
    badge: "border-sky-400/40 text-sky-300",
    bar: "bg-sky-400",
  },
  SAVER: {
    label: "Saver",
    badge: "border-emerald-400/40 text-emerald-300",
    bar: "bg-emerald-400",
  },
  HOME_LOAN: {
    label: "Home loan",
    badge: "border-rose-400/40 text-rose-300",
    bar: "bg-rose-400",
  },
}

/**
 * One card per account. Savers carry a bar showing their share of everything
 * set aside, which is the only comparison between accounts that means
 * anything — a spending account and a home loan aren't on the same scale.
 */
export default function AccountsGrid({accounts}: {accounts: UpAccount[]}) {
  if (accounts.length === 0) {
    return <EmptyState message="No accounts returned by Up." />
  }

  const savingsTotal = accounts
    .filter((a) => a.attributes.accountType === "SAVER")
    .reduce((sum, a) => sum + a.attributes.balance.valueInBaseUnits, 0)

  const ordered = [...accounts].sort(
    (a, b) =>
      b.attributes.balance.valueInBaseUnits -
      a.attributes.balance.valueInBaseUnits,
  )

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {ordered.map((account) => {
        const {displayName, accountType, ownershipType, balance} =
          account.attributes
        const value = balance.valueInBaseUnits
        const meta = TYPE_META[accountType]
        const share =
          accountType === "SAVER" && savingsTotal > 0
            ? value / savingsTotal
            : null

        return (
          <div
            key={account.id}
            className="flex flex-col rounded-lg border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-white/20"
          >
            <div className="mb-3 flex items-center gap-2">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${meta.badge}`}
              >
                {meta.label}
              </span>
              {ownershipType === "JOINT" && (
                <span className="rounded-full border border-white/20 px-2 py-0.5 text-[10px] font-bold tracking-widest text-med-grey uppercase">
                  Joint
                </span>
              )}
            </div>

            <p className="truncate text-sm font-bold" title={displayName}>
              {displayName}
            </p>

            <p
              className={`mt-auto pt-4 text-2xl font-bold tabular-nums ${
                value < 0 ? "text-rose-400" : "text-white"
              }`}
            >
              {formatCents(value)}
            </p>

            {share !== null && (
              <div className="mt-3">
                <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full ${meta.bar}`}
                    style={{width: `${Math.max(share * 100, 1)}%`}}
                  />
                </div>
                <p className="mt-1.5 text-xs text-med-grey">
                  {Math.round(share * 100)}% of everything set aside
                </p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
