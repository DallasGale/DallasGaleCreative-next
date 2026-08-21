import {formatCents} from "@/lib/format"
import type {SaverPlan, SaverPlanReport} from "@/lib/up/savers"
import {EmptyState} from "./primitives"

/**
 * The routing sheet: which saver each week's money goes into, and how far
 * that is from what's going in today.
 *
 * Three cadences because pay cycles differ and a number you have to divide
 * before you can act on it is a number you won't act on. The gap column is
 * the one to read — the target is arithmetic over the forecast, but the gap
 * is the thing you can go and fix in the Up app this afternoon.
 */
export default function SaversPanel({report}: {report: SaverPlanReport}) {
  if (report.savers.length === 0) {
    return <EmptyState message="No savers on this account, so there's nothing to route money into yet." />
  }

  const funded = report.savers.filter(
    (plan) => plan.exists && plan.perMonthCents > 0,
  )
  const proposed = report.savers.filter(
    (plan) => !plan.exists && plan.perMonthCents > 0,
  )
  const goals = report.savers.filter(
    (plan) => plan.goal && plan.perMonthCents === 0,
  )
  const idle = report.savers.filter(
    (plan) => !plan.goal && plan.exists && plan.perMonthCents === 0,
  )

  // The whole point of the catch-all feed: if these disagree, a dollar of the
  // forecast has gone missing between the budget and the savers, and saying
  // so beats quietly presenting a total that doesn't add up.
  const balanced =
    Math.abs(report.perMonthCents - report.forecastPerMonthCents) <= 100

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] text-sm">
          <thead>
            <tr className="border-b border-white/10 text-[10px] font-bold tracking-widest text-med-grey uppercase">
              <th className="pb-2 text-left font-bold">Saver</th>
              <th className="pb-2 text-right font-bold">Weekly</th>
              <th className="pb-2 text-right font-bold">Fortnightly</th>
              <th className="pb-2 text-right font-bold">Monthly</th>
              <th className="pb-2 text-right font-bold">Going in now</th>
              <th className="pb-2 text-right font-bold">Gap</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {funded.map((plan) => (
              <SaverRow key={plan.id} plan={plan} />
            ))}

            {proposed.length > 0 && (
              <tr>
                <td colSpan={6} className="pt-6 pb-2">
                  <p className="text-[10px] font-bold tracking-widest text-amber-300/80 uppercase">
                    Savers to create · {proposed.length}
                  </p>
                  <p className="mt-1 text-xs text-med-grey">
                    These don't exist yet. Make one in Up under the name shown
                    and it moves up into the table above on its own — nothing
                    here needs editing when you do.
                  </p>
                </td>
              </tr>
            )}
            {proposed.map((plan) => (
              <SaverRow key={plan.id} plan={plan} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/10 font-bold">
              <td className="pt-3">Every saver</td>
              <td className="pt-3 text-right tabular-nums text-highlight">
                {formatCents(report.perWeekCents)}
              </td>
              <td className="pt-3 text-right tabular-nums text-highlight">
                {formatCents(report.perFortnightCents)}
              </td>
              <td className="pt-3 text-right tabular-nums text-highlight">
                {formatCents(report.perMonthCents)}
              </td>
              <td className="pt-3 text-right tabular-nums text-med-grey">
                {formatCents(report.currentPerMonthCents)}
              </td>
              <td
                className={`pt-3 text-right tabular-nums ${
                  report.gapPerMonthCents > 0 ? "text-rose-300" : "text-emerald-300"
                }`}
              >
                {report.gapPerMonthCents > 0 ? "+" : ""}
                {formatCents(report.gapPerMonthCents)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-xs text-med-grey">
        Every figure is a {report.months}-month average of the forecast, so
        yearly bills — rego, insurance, memberships — are spread across the
        year rather than landing on the week they're charged. A positive gap
        is a saver taking in less than the bills it covers; a negative one is
        money piling up faster than it's needed. The “going in” column counts
        only savers with a bill behind them, so the destinations below don't
        flatter the total.
      </p>

      {balanced ? (
        <p className="rounded-md border border-emerald-400/20 bg-emerald-400/[0.04] p-4 text-sm text-med-grey">
          <span className="font-bold text-white">Nothing left over.</span> The
          savers add up to {formatCents(report.perMonthCents)} a month, which
          is the whole forecast —{" "}
          {formatCents(report.forecastPerMonthCents)}. Every dollar you're
          told to put aside has somewhere to be, and the last saver on the
          list is what makes that true: whatever no other feed claims lands in
          “Everything else”, so the remainder is a number you can see rather
          than a shortfall you discover.
        </p>
      ) : (
        <p className="rounded-md border border-rose-400/30 bg-rose-400/[0.04] p-4 text-sm text-med-grey">
          <span className="font-bold text-white">Doesn't add up.</span> The
          savers total {formatCents(report.perMonthCents)} a month against a
          forecast of {formatCents(report.forecastPerMonthCents)}. The
          difference is forecast spend with no saver behind it — declare a
          catchAll feed in src/lib/up/savers.ts so nothing falls through.
        </p>
      )}

      {report.unallocated.length > 0 && (
        <div className="rounded-md border border-white/10 bg-white/[0.02] p-4">
          <p className="text-xs font-bold tracking-widest text-med-grey uppercase">
            Not routed anywhere ·{" "}
            <span className="text-white">
              {formatCents(report.unallocatedPerWeekCents)} a week
            </span>
          </p>
          <p className="mt-2 text-sm text-med-grey">
            {formatCents(report.unallocatedPerMonthCents)} a month of forecast
            spend that no saver claims, so it comes out of Spending as it
            lands. Some of that is groceries-and-coffee money that belongs
            there. The rest is a saver waiting to be made, or a feed waiting
            to be added to SAVER_FEEDS in src/lib/up/savers.ts.
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-med-grey">
            {report.unallocated.slice(0, 12).map((fund) => (
              <li key={fund.name} className="tabular-nums">
                {fund.name}{" "}
                <span className="font-bold text-white">
                  {formatCents(fund.perMonthCents)}
                </span>
                /mo
              </li>
            ))}
          </ul>
        </div>
      )}

      {(idle.length > 0 || goals.length > 0) && (
        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 text-xs text-med-grey">
          {goals.length > 0 && (
            <p>
              <span className="font-bold text-white">Destinations:</span>{" "}
              {goals.map((plan) => plan.name).join(", ")} — money goes in
              without a bill waiting for it, so they're never reported short.
            </p>
          )}
          {idle.length > 0 && (
            <p>
              <span className="font-bold text-white">No spend matched:</span>{" "}
              {idle.map((plan) => plan.name).join(", ")}. Either the bill has
              stopped, or nothing in SAVER_FEEDS points at it yet.
            </p>
          )}
          {report.savers
            .filter((plan) => plan.note)
            .map((plan) => (
              <p key={plan.id}>
                <span className="font-bold text-white">{plan.name}:</span>{" "}
                {plan.note}
              </p>
            ))}
        </div>
      )}
    </div>
  )
}

function SaverRow({plan}: {plan: SaverPlan}) {
  const short = plan.gapPerMonthCents > 0
  const evidence = plan.funds
    .slice(0, 3)
    .map((fund) => fund.name)
    .join(", ")

  return (
    <tr>
      <td className="py-3 pr-4">
        <span className={plan.exists ? "font-bold" : "font-bold text-amber-200"}>
          {plan.name}
        </span>
        {!plan.exists && (
          <span className="ml-2 rounded-full border border-amber-400/40 px-2 py-0.5 text-[10px] font-bold tracking-widest text-amber-300 uppercase">
            New
          </span>
        )}
        {plan.replaces.length > 0 && (
          <span className="mt-0.5 block text-xs text-med-grey">
            Replaces {plan.replaces.join(", ")} — their balances and transfers
            are counted here.
          </span>
        )}
        {evidence && (
          <span className="mt-0.5 block truncate text-xs text-med-grey">
            {evidence}
            {plan.funds.length > 3 ? ` +${plan.funds.length - 3} more` : ""}
          </span>
        )}
      </td>
      <td className="py-3 text-right font-bold tabular-nums text-highlight">
        {formatCents(plan.perWeekCents)}
      </td>
      <td className="py-3 text-right tabular-nums">
        {formatCents(plan.perFortnightCents)}
      </td>
      <td className="py-3 text-right tabular-nums">
        {formatCents(plan.perMonthCents)}
      </td>
      <td className="py-3 text-right tabular-nums text-med-grey">
        {formatCents(plan.currentPerMonthCents)}
      </td>
      <td
        className={`py-3 text-right tabular-nums ${
          short ? "text-rose-300" : "text-emerald-300"
        }`}
      >
        {short ? "+" : ""}
        {formatCents(plan.gapPerMonthCents)}
      </td>
    </tr>
  )
}
