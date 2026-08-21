import {formatDay, formatSignedCents} from "@/lib/format"
import {isInternalTransfer} from "@/lib/up/analytics"
import type {UpTransaction} from "@/lib/up/types"
import {EmptyState} from "./primitives"

export default function TransactionsList({
  transactions,
}: {
  transactions: UpTransaction[]
}) {
  if (transactions.length === 0) {
    return <EmptyState message="No transactions in this period." />
  }

  return (
    <ul className="flex flex-col divide-y divide-white/10">
      {transactions.map((tx) => {
        const amount = tx.attributes.amount.valueInBaseUnits
        const transfer = isInternalTransfer(tx)
        const when = tx.attributes.settledAt ?? tx.attributes.createdAt

        return (
          <li
            key={tx.id}
            className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <p className="truncate text-sm">{tx.attributes.description}</p>
              <p className="flex items-center gap-2 text-xs text-med-grey">
                <span>{formatDay(when)}</span>
                {tx.attributes.status === "HELD" && (
                  <span className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] tracking-wide uppercase">
                    Held
                  </span>
                )}
                {transfer && (
                  <span className="rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] tracking-wide uppercase">
                    Transfer
                  </span>
                )}
              </p>
            </div>
            <span
              className={`shrink-0 text-sm font-bold tabular-nums ${
                transfer
                  ? "text-med-grey"
                  : amount > 0
                    ? "text-emerald-400"
                    : "text-white"
              }`}
            >
              {formatSignedCents(amount)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
