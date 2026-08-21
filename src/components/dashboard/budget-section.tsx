import {unstable_rethrow} from "next/navigation"
import {formatCents} from "@/lib/format"
import {buildAllocation, weeklyTakeHomeCents} from "@/lib/up/allocation"
import {
  buildBudget,
  monthlySeries,
  recentTransactions,
  topMerchants,
} from "@/lib/up/analytics"
import {
  buildBuckets,
  buildForecastBasis,
  isCancelledMerchant,
  RECURRENCE_LABEL,
} from "@/lib/up/buckets"
import {UpApiError} from "@/lib/up/client"
import {
  monthProgress,
  recentMonths,
  startOfMonth,
  toRfc3339,
} from "@/lib/up/period"
import {repriceForecast} from "@/lib/up/pricing"
import {getCategories, getTransactionsSince} from "@/lib/up/queries"
import {buildSavings, isFeeCharge} from "@/lib/up/savings"
import type {UpCategory, UpTransaction} from "@/lib/up/types"
import AllocationPanel from "./allocation-panel"
import BudgetSummary from "./budget-summary"
import BudgetTable from "./budget-table"
import HeldOutPanel from "./held-out-panel"
import MerchantsChart from "./merchants-chart"
import {ErrorPanel, Panel, Skeleton, Stat} from "./primitives"
import RepricedNote from "./repriced-note"
import SavingsPanel from "./savings-panel"
import SubscriptionCandidates from "./subscription-candidates"
import TransactionsList from "./transactions-list"
import TrendChart from "./trend-chart"

/**
 * Twelve completed months of history plus the month in progress. The averages
 * are built from the twelve; the thirteenth is only for tracking.
 *
 * A full year is the only window that costs a budget nothing. Anything billed
 * yearly — insurance, rego, domain renewals — lands inside it exactly once and
 * amortises at its true monthly cost, and quarterly bills charge often enough
 * to read as the recurring costs they are. The price is responsiveness: a
 * change in how you live six months ago is still averaged in at half weight,
 * which is what the drift panel is for.
 */
const COMPLETED_MONTHS = 12

/** Roughly five days in — before that, projecting the month is guesswork. */
const MIN_PROGRESS_TO_PROJECT = 0.15

export default async function BudgetSection() {
  const all = recentMonths(COMPLETED_MONTHS + 1)
  const completed = all.slice(0, -1)
  const current = all[all.length - 1]
  const since = toRfc3339(startOfMonth(all[0]))

  let transactions: UpTransaction[]
  let truncated: boolean
  let categories: UpCategory[]

  try {
    // Both are memoized and independent, so let them overlap.
    const [txResult, categoryResult] = await Promise.all([
      getTransactionsSince(since),
      getCategories(),
    ])
    transactions = txResult.items
    truncated = txResult.truncated
    categories = categoryResult
  } catch (error) {
    unstable_rethrow(error)

    return (
      <ErrorPanel
        title="Couldn't load your transactions"
        detail={
          error instanceof UpApiError
            ? error.message
            : "Up didn't respond. Try reloading."
        }
      />
    )
  }

  // One pass, shared by every report on the page, so nothing can disagree
  // about what the year ahead is expected to cost. This is the single point
  // where "what happened" becomes "what will happen".
  const completedKeys = new Set(completed.map((m) => m.key))
  const forecast = buildForecastBasis(transactions, completedKeys)
  // Two adjustments turn history into a forecast, in order: drop what won't
  // happen again, then restate what's left at what it costs today. The second
  // reads the first, so a merchant that's been held out is never repriced.
  const priced = repriceForecast(transactions, completed, current.key, forecast)
  const budget = buildBudget(
    priced.transactions,
    categories,
    completed,
    current.key,
    forecast.ids,
  )
  const buckets = buildBuckets(
    priced.transactions,
    categories,
    completed,
    current.key,
    forecast,
    transactions,
  )
  const savings = buildSavings(
    priced.transactions,
    completed,
    buckets,
    forecast.ids,
    transactions,
  )
  // A monthly interest charge recurs as reliably as Netflix, but telling you
  // to file it as a subscription is the wrong advice — it's already sitting in
  // the fees row above with "stop paying this" next to it.
  const candidates = buckets.candidates.filter(
    (sub) => !isFeeCharge(sub.description),
  )
  const progress = monthProgress()

  // Only renders when WEEKLY_TAKE_HOME is configured. Up can't tell a gross
  // deposit from a net one, so income is the one figure the account can't
  // supply and the panel stays absent rather than guessing at it.
  const takeHome = weeklyTakeHomeCents()
  const allocation =
    takeHome === null
      ? null
      : buildAllocation({
          incomePerWeekCents: takeHome,
          budget,
          savings,
        })

  // Cadence badge for the merchants inside the Subscriptions bucket.
  const recurrenceById = new Map(
    buckets.subscriptions.map((sub) => [sub.id, sub]),
  )
  const repricedByKey = new Map(
    priced.changes.flatMap((change) => change.rows.map((row) => [row.key, row])),
  )
  const subscriptionNote = (row: {id: string; name: string}) => {
    // Cancelled services keep their historical row — the money was spent — but
    // a cadence badge on one reads as an ongoing cost, which it no longer is.
    if (isCancelledMerchant(row.name)) return "Cancelled · no longer charging"
    // A repriced row is no longer an average of anything, so the median charge
    // the detector found would contradict the number beside it.
    const repriced = repricedByKey.get(row.id)
    if (repriced) return `Now ${formatCents(repriced.perMonthCents)} a month`
    const sub = recurrenceById.get(row.id)
    return sub
      ? `${RECURRENCE_LABEL[sub.recurrence]} · ${formatCents(sub.typicalCents)}`
      : undefined
  }

  const series = monthlySeries(transactions, all)
  const thisMonth = series[series.length - 1]
  const lastMonth = series[series.length - 2]

  // Month-to-date against a finished month flatters every month until the
  // 28th, so project this one to its end instead. Early in the month a few
  // days of noise scale up into nonsense, so below a few days it says nothing.
  const projected =
    progress < MIN_PROGRESS_TO_PROJECT
      ? null
      : Math.round(thisMonth.spendingCents / progress)

  // Completed months only. The chart puts each merchant in per-month terms,
  // and folding in a part-finished month would understate every one of them.
  const merchants = topMerchants(
    priced.transactions.filter((tx) => !forecast.ids.has(tx.id)),
    10,
    completedKeys,
  )
  const recent = recentTransactions(transactions, 12)

  return (
    <div className="flex flex-col gap-5">
      {truncated && (
        <ErrorPanel
          title="Showing partial history"
          detail={`More than ${transactions.length} transactions fall in this window, so the averages below are understated. Narrow the window to get exact figures.`}
        />
      )}

      <BudgetSummary
        budget={budget}
        actual={{perMonthCents: buckets.actualPerMonthCents}}
        held={{
          names: buckets.held.map((item) => item.name),
          perMonthCents: buckets.heldPerMonthCents,
          byReason: buckets.heldByReason,
          months: buckets.months,
        }}
        floorPerWeekCents={allocation?.floorPerWeekCents}
      />

      <RepricedNote
        changes={priced.changes}
        perMonthDeltaCents={priced.perMonthDeltaCents}
      />

      {allocation && (
        <Panel
          title="Where your pay should go"
          action={
            <span className="text-xs text-med-grey">
              {formatCents(allocation.incomePerWeekCents)}/wk take home
            </span>
          }
        >
          <AllocationPanel report={allocation} />
        </Panel>
      )}

      <Panel
        title="Biggest merchants"
        action={
          <span className="text-xs text-med-grey">
            {budget.months} months · {budget.from} – {budget.to}
          </span>
        }
      >
        <MerchantsChart merchants={merchants} months={budget.months} />
      </Panel>

      <Panel
        title="Where to cut"
        action={
          <span className="text-xs text-med-grey">
            {savings.certain.length + savings.behavioural.length} suggestions
          </span>
        }
      >
        <SavingsPanel report={savings} />
      </Panel>

      <Panel
        title={`Where it goes · ${buckets.months} months`}
        action={
          <span className="text-xs text-med-grey">
            {buckets.subscriptions.length} subscriptions
          </span>
        }
      >
        <p className="mb-4 text-sm text-med-grey">
          Your four buckets, with everything unmapped collected under Other —
          expand it to see what's landing there. Subscriptions are matched by
          merchant name, because Up files YouTube under Technology and Claude
          under Life Admin; a gym membership recurs just as reliably without
          being one.
        </p>
        <BudgetTable
          groups={buckets.buckets}
          months={buckets.months}
          progress={progress}
          childNote={subscriptionNote}
        />
      </Panel>

      <Panel
        title={`Up's own categories · ${budget.months} months`}
        action={
          <span className="text-xs text-med-grey">
            {budget.from} – {budget.to}
          </span>
        }
      >
        <p className="mb-4 text-sm text-med-grey">
          The same forecast split the way Up files them. Every figure is an
          average across {budget.months} completed months, so monthly,
          quarterly and yearly bills all spread evenly across each week rather
          than landing on one. A full year of history is what makes that true
          of the yearly ones — they land inside the window exactly once and
          amortise at the cost they actually are. Merchants held out of the
          forecast are absent from these rows too.
        </p>
        <BudgetTable
          groups={budget.groups}
          months={budget.months}
          progress={progress}
        />
      </Panel>

      <Panel
        title="Held out of the forecast"
        action={
          <span className="text-xs text-med-grey">
            {buckets.held.length} merchant
            {buckets.held.length === 1 ? "" : "s"}
          </span>
        }
      >
        <p className="mb-4 text-sm text-med-grey">
          This is what turns the history above into a forecast, and it's the
          panel to check first. Everything here is money you genuinely spent
          that the year ahead is being told to expect none of — so a merchant
          listed by mistake is a bill the budget won't cover. A yearly bill
          charges exactly once in a year of history, the same as a splurge, so
          the rules err towards keeping insurance, rego and medical charges
          in.
        </p>
        <HeldOutPanel items={buckets.held} months={budget.months} />
      </Panel>

      <Panel
        title="Possible subscriptions"
        action={
          <span className="text-xs text-med-grey">
            {candidates.length} found
          </span>
        }
      >
        <p className="mb-4 text-sm text-med-grey">
          Regular charges sitting in Other. Anything here that is a
          subscription should be added to SUBSCRIPTION_MERCHANTS in
          src/lib/up/buckets.ts to move it into the bucket.
        </p>
        <SubscriptionCandidates candidates={candidates} />
      </Panel>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <Stat
          label={`Spent so far · ${current.label}`}
          value={formatCents(thisMonth.spendingCents)}
          hint={`${formatCents(budget.perMonthCents)} is a typical month`}
          tone={
            thisMonth.spendingCents > budget.perMonthCents * progress
              ? "negative"
              : "positive"
          }
        />
        <Stat
          label="Expected by today"
          value={formatCents(Math.round(budget.perMonthCents * progress))}
          hint={`${Math.round(progress * 100)}% through ${current.label}`}
          tone="neutral"
        />
        <Stat
          label="On pace for"
          value={projected === null ? "—" : formatCents(projected)}
          hint={
            projected === null
              ? `Too early in ${current.label} to project`
              : lastMonth
                ? `${lastMonth.label} finished on ${formatCents(lastMonth.spendingCents)}`
                : `against a typical ${formatCents(budget.perMonthCents)}`
          }
          tone={
            projected !== null && projected > budget.perMonthCents
              ? "negative"
              : "positive"
          }
        />
      </div>

      <Panel
        title="Spending by month"
        action={
          <span className="text-xs text-med-grey">
            {current.label} is still in progress
          </span>
        }
      >
        <TrendChart series={series} averageCents={budget.perMonthCents} />
      </Panel>

      <Panel
        title="Recent transactions"
        action={
          <span className="text-xs text-med-grey">
            {transactions.length} in window
          </span>
        }
      >
        <TransactionsList transactions={recent} />
      </Panel>
    </div>
  )
}

export function BudgetSectionSkeleton() {
  return (
    <div className="flex flex-col gap-5">
      <Skeleton className="h-[260px]" />
      <Skeleton className="h-[440px]" />
      <Skeleton className="h-[520px]" />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[110px]" />
        ))}
      </div>
      <Skeleton className="h-[320px]" />
      <Skeleton className="h-[320px]" />
    </div>
  )
}
