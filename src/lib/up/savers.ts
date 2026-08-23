/**
 * Where each week's money actually goes.
 *
 * The budget says what the year costs. This says which of your Up savers has
 * to hold it, because a weekly figure you can't route is a figure you won't
 * act on — and you have already built the routing: twenty-two savers, each
 * named after the bill it pays.
 *
 * Two halves, and they come from opposite places on purpose:
 *
 *   what should go in — the forecast, split by which saver funds which
 *                       merchant. That split can't be inferred from the bank
 *                       feed; Up has no idea "🏡 YVW" pays Yarra Valley
 *                       Water. It's declared below, in SAVER_FEEDS.
 *   what does go in   — the transfers themselves. No guessing needed: an
 *                       internal transfer carries the id of the account it
 *                       landed in, so this side is measured, not matched.
 *
 * The gap between them is the point of the whole view.
 */

import {cents, isCashflow, occurredAt, WEEKS_PER_MONTH} from "./analytics"
import type {ForecastBasis} from "./buckets"
import {merchantPattern} from "./buckets"
import type {MonthBucket} from "./period"
import {monthKeyOf} from "./period"
import type {UpAccount, UpTransaction} from "./types"

/* ------------------------------------------------------------------ *
 * Declared feeds
 *
 * A saver name is a statement of intent that only you can make. Everything
 * here is a claim of the form "this saver pays for that", and it is the one
 * knob worth turning on this view: get a feed wrong and a real bill shows as
 * unfunded, leave one out and the money lands in "not routed anywhere" —
 * which is visible on the page rather than silently absorbed.
 *
 * Matching is whole-word and case-insensitive, the same rule the merchant
 * lists in buckets.ts use, so "telstra" catches Telstra and not Telstral.
 * ------------------------------------------------------------------ */

export type SaverFeed = {
  /**
   * Matched against the saver's display name, emoji and all — or, when no
   * account matches, the name of a saver this view is proposing you create.
   * Which one it is isn't declared: a feed naming an account that doesn't
   * exist yet is a proposal, and becomes a real row the moment you make the
   * saver in Up. Nothing here has to be edited when you do.
   */
  saver: string
  /**
   * Existing savers this one takes over from. Their balances and their
   * incoming transfers are counted here, and they stop being listed
   * separately — so a bill split across three savers can be forecast as the
   * single saver you're about to consolidate them into.
   */
  replaces?: string[]
  /** Merchants whose forecast cost this saver covers. */
  merchants?: string[]
  /**
   * Matched against Up's `rawText` instead of the tidied description. The
   * escape hatch for a biller that puts several products behind one name —
   * RACV's roadside membership and its insurance policies are both filed as
   * "RACV" and are only told apart by the raw string on the statement.
   */
  raw?: string[]
  /** Up category slugs — child or parent — this saver covers. */
  categories?: string[]
  /**
   * Exact charge amounts in dollars, as they appear on the statement. When
   * present, only charges of these amounts are claimed, which is how one
   * merchant's spend gets split across several savers.
   */
  amounts?: number[]
  /**
   * A destination rather than a bill: money goes in and isn't waiting to be
   * spent on anything the forecast can see. Goals are never reported as
   * underfunded, because there's no bill to be short of.
   */
  goal?: boolean
  /**
   * Not a saver at all. This money stays in the Spending account and is paid
   * as it lands, so it's forecast like everything else but never routed and
   * never reported as a gap — there's no account to be short.
   *
   * It still has to be claimed rather than left out, because the forecast has
   * to add up: what the savers hold plus what Spending keeps is the whole
   * number, and a cost that's deliberately unrouted looks identical to one
   * that fell through a crack unless it's declared.
   */
  spending?: boolean
  /**
   * Claims everything no other feed does, so the split is exhaustive: every
   * dollar the forecast expects lands in a saver and the weekly figures add
   * back up to the headline. Exactly one feed should set this, and it has to
   * be the last one — it's tried only after every other feed has passed.
   */
  catchAll?: boolean
  /** Shown on the row. Use it to say why a mapping isn't obvious. */
  note?: string
}

export const SAVER_FEEDS: SaverFeed[] = [
  // -- Household ----------------------------------------------------------
  {saver: "Telstra NBN", merchants: ["telstra"]},
  {saver: "Origin Energy", merchants: ["origin energy"]},
  {saver: "YVW", merchants: ["yarra valley water"]},
  {saver: "Rates", merchants: ["yarra rangesc coun", "yarra ranges council"]},
  {saver: "Aldi mobile", merchants: ["aldi mobile"]},

  // -- Car ----------------------------------------------------------------
  {saver: "VicRoads", merchants: ["vicroads"]},
  {saver: "Fuel", categories: ["fuel"]},
  {saver: "Tolls", categories: ["toll-roads"]},
  // One saver, three policies. RACV files every policy as "RACV MCC" and the
  // roadside membership as "RACV Membership", so the charges can't be told
  // apart by name anyway — and splitting a bill you can't split is how a
  // saver ends up reading as unfunded while the money sits next door.
  {
    saver: "RACV",
    merchants: ["racv"],
    replaces: [
      "RACV Car Insurance",
      "RACV Home & Contents",
      "RACV Roadside",
    ],
  },

  // -- Health -------------------------------------------------------------
  {saver: "Medibank", merchants: ["medibank"]},

  // -- Media and software -------------------------------------------------
  {
    // All three are cancelled, so none of them is what this saver funds any
    // more — the category is. Patreon, Hubbl and HBO Max are the same kind of
    // spend under a different name, and the account keeps its old name in Up
    // until you rename it. The row will look far cheaper than it used to.
    saver: "Netflix/YouTube/Kayo",
    categories: ["tv-and-music"],
    note: "Netflix, YouTube and Kayo are cancelled. This now covers what's left in TV and music — rename it in Up and the row follows.",
  },
  {
    saver: "SAAS",
    merchants: [
      "claude",
      "anthropic",
      "icloud",
      "1password",
      "nord security",
      "crazy domains",
      "namecheap",
    ],
  },

  // -- Kids ---------------------------------------------------------------
  {saver: "Beast Academy", merchants: ["beast academy"]},
  // Declared in COMMITMENTS rather than read from charges, so this claims a
  // cost the history doesn't contain yet. Matched by name like any other:
  // the feed can't tell, and shouldn't have to.
  {saver: "Guitar Tuition", merchants: ["guitar tuition"]},
  {saver: "AusCycling", merchants: ["auscycling"]},
  {saver: "Buzz Swimming", merchants: ["jack hort"]},
  {saver: "Groceries", categories: ["groceries"]},

  // -- Destinations, not bills --------------------------------------------
  {saver: "Savings", goal: true},
  {saver: "GST/TAX", goal: true},
  {
    saver: "Buzz’s Can Money",
    goal: true,
    note: "Nothing has gone in since May 2026.",
  },

  // -- Undeclared ---------------------------------------------------------
  // "BMX Coaching" has no obvious merchant: race entries go to EntryBoss and
  // the clubs directly, neither of which is coaching. Left unclaimed rather
  // than guessed at — an invented mapping would report a bill as funded.

  /* ---------------------------------------------------------------- *
   * Savers that don't exist yet
   *
   * Everything below names an account you haven't made. It's forecast the
   * same way as the rest, so you can see what each would need before you
   * decide it's worth creating — and the moment you make one in Up under a
   * name that matches, it moves up into the table above on its own.
   *
   * The ordering matters: these are matched in the order they appear, and a
   * merchant list is tried before any category list, so a specific claim
   * always beats a general one.
   * ---------------------------------------------------------------- */

  // Named explicitly rather than left to a category, because a regular
  // transfer to a person is the one recurring cost the bank files as nothing
  // at all — it has no category to fall into.
  {
    saver: "Melissa",
    merchants: ["melissaerinn", "melissa dembowski"],
    note: "Two payees. Drop “melissa dembowski” from the feed if they aren't the same household cost.",
  },
  {saver: "Buzz Piano", merchants: ["buzz piano"]},
  {
    saver: "Race entries",
    merchants: ["entryboss", "bmx club", "mylaps", "trybooking"],
  },
  {saver: "Eating out", categories: ["restaurants-and-cafes", "takeaway"]},
  {
    saver: "Home maintenance",
    merchants: ["coldstream transfer station"],
    categories: ["home-maintenance-and-improvements", "homeware-and-appliances"],
  },
  {
    saver: "Car servicing",
    categories: ["car-insurance-and-maintenance", "parking"],
  },
  {saver: "Clothing", categories: ["clothing-and-accessories"]},
  // Seven kinds of spending folded into one line, and then deliberately not
  // made a saver: shops, days out, cycling, hobbies, haircuts, fitness and
  // medical gaps are what the Spending account is for. Each of them was a
  // proposal here at $4 to $26 a week, and seven transfers of pocket money
  // into seven accounts you'd only transfer straight back out is work with no
  // budget behind it.
  //
  // Declared rather than simply deleted, and that distinction is the whole
  // reason this flag exists. Deleting it wouldn't mean "this stays in
  // Spending" — it would mean the charges fall through to "Everything else"
  // and quietly become a saver anyway. This says out loud that $81 a week is
  // meant to sit in Spending, which makes it a figure you can hold yourself
  // to rather than a residue.
  //
  // What it gives up is the reason each part was listed separately: a saver
  // that funds one thing tells you when that thing gets more expensive. This
  // can't — a quiet doubling in bike parts reads the same as a haircut. The
  // per-merchant breakdown is the only thing left that will show you.
  //
  // The merchants are named rather than left to their categories because Up
  // files almost none of them: Big W, Kmart, Myer, Amazon, AliExpress and
  // Officeworks all arrive with no category at all. Without this list they'd
  // reach the same place by accident instead of on purpose.
  //
  // Then nine categories, in the order they cost.
  {
    saver: "General Spending",
    spending: true,
    merchants: [
      "big w",
      "kmart",
      "myer",
      "amazon",
      "aliexpress",
      "officeworks",
      "just $2",
    ],
    categories: [
      "events-and-gigs",
      "holidays-and-travel",
      "cycling",
      "hobbies",
      "games-and-software",
      "news-magazines-and-books",
      "hair-and-beauty",
      "fitness-and-wellbeing",
      "health-and-medical",
    ],
    note: "Stays in Spending — shops, days out, cycling, hobbies, haircuts, fitness, and the medical gaps Medibank doesn't cover.",
  },

  // Last, and deliberately: everything no feed above claims. Without it the
  // savers would add up to less than the budget headline and the difference
  // would be money with nowhere to be — which is exactly the money that
  // quietly overruns a Spending account. Whatever collects here worth naming
  // should graduate into a feed of its own above.
  {
    saver: "Everything else",
    catchAll: true,
    note: "The remainder, so nothing in the forecast is left without a home.",
  },
]

type CompiledFeed = Omit<SaverFeed, "categories" | "amounts"> & {
  saverPattern: RegExp
  replacesPatterns: RegExp[]
  merchantPattern: RegExp | null
  rawPattern: RegExp | null
  categories: Set<string>
  amounts: Set<number> | null
}

const FEEDS: CompiledFeed[] = SAVER_FEEDS.map((feed) => ({
  ...feed,
  saverPattern: merchantPattern([feed.saver]),
  replacesPatterns: (feed.replaces ?? []).map((name) => merchantPattern([name])),
  merchantPattern: feed.merchants?.length
    ? merchantPattern(feed.merchants)
    : null,
  rawPattern: feed.raw?.length ? merchantPattern(feed.raw) : null,
  categories: new Set(feed.categories ?? []),
  amounts: feed.amounts
    ? new Set(feed.amounts.map((dollars) => Math.round(dollars * 100)))
    : null,
}))

function categoryIds(tx: UpTransaction): string[] {
  const ids: string[] = []
  const child = tx.relationships.category.data?.id
  const parent = tx.relationships.parentCategory.data?.id
  if (child) ids.push(child)
  if (parent) ids.push(parent)
  return ids
}

/** Whether this feed claims this charge by name. Categories are a later pass. */
function claimsByName(feed: CompiledFeed, tx: UpTransaction): boolean {
  if (feed.amounts && !feed.amounts.has(Math.abs(cents(tx)))) return false

  const description = tx.attributes.description
  if (feed.merchantPattern?.test(description)) return true

  const raw = tx.attributes.rawText
  return raw === null ? false : (feed.rawPattern?.test(raw) ?? false)
}

export type SaverFunding = {
  name: string
  perMonthCents: number
  count: number
}

export type SaverPlan = {
  id: string
  name: string
  balanceCents: number
  /** False for a saver this view is proposing you create. */
  exists: boolean
  /** Existing savers folded into this one, by display name. */
  replaces: string[]
  /** True when SAVER_FEEDS says what this saver pays for. */
  declared: boolean
  goal: boolean
  /** Declared as staying in Spending, so it's a cost rather than a saver. */
  spending: boolean
  note: string | null
  /** What the forecast says has to pass through here, three ways. */
  perWeekCents: number
  perFortnightCents: number
  perMonthCents: number
  /** What you're transferring in now, averaged over the same window. */
  currentPerMonthCents: number
  /** Needed minus current. Positive means the saver is running short. */
  gapPerMonthCents: number
  /** The merchants behind the figure, largest first. */
  funds: SaverFunding[]
}

export type SaverPlanReport = {
  /** Completed months the averages are built from. */
  months: number
  savers: SaverPlan[]
  /**
   * Declared as staying put: forecast spend that never becomes a transfer.
   * Kept out of `savers` so the routing sheet only lists things you route,
   * and counted separately below so the total still reconciles.
   */
  spending: SaverPlan[]
  spendingPerMonthCents: number
  spendingPerWeekCents: number
  /**
   * The whole forecast, per month. Equal to the savers' total plus what
   * Spending keeps, whenever a catch-all feed is declared — which is the
   * invariant this view rests on, so the page states it rather than assuming
   * it.
   */
  forecastPerMonthCents: number
  /** Forecast spend no saver claims. It comes out of Spending as it lands. */
  unallocated: SaverFunding[]
  unallocatedPerMonthCents: number
  unallocatedPerWeekCents: number
  /** Routed through savers: the three cadences, summed across every saver. */
  perWeekCents: number
  perFortnightCents: number
  perMonthCents: number
  /** What the savers currently receive, so the total gap is legible. */
  currentPerMonthCents: number
  gapPerMonthCents: number
}

/**
 * Splits the forecast across the savers that have to pay it.
 *
 * `transactions` is the repriced forecast — the same set every other
 * forward-looking figure on the page is built from, so a saver's target and
 * the budget headline can't disagree. `history` is the untouched feed, used
 * only for the transfers, which are facts about what you did rather than
 * predictions about what things cost.
 */
export function buildSaverPlan(
  accounts: UpAccount[],
  transactions: UpTransaction[],
  basis: ForecastBasis,
  months: MonthBucket[],
  history: UpTransaction[] = transactions,
): SaverPlanReport {
  const windowKeys = new Set(months.map((month) => month.key))
  const monthCount = months.length || 1

  const savers = accounts.filter(
    (account) => account.attributes.accountType === "SAVER",
  )

  /**
   * One target per feed, plus one per saver no feed mentions. A feed whose
   * saver doesn't exist yet is still a target — that's what makes a proposal
   * forecastable — and a feed that replaces others absorbs their balances and
   * their transfers, because the money is already going somewhere even if
   * it's going somewhere you're about to consolidate.
   */
  type Target = {
    key: string
    feed: CompiledFeed | null
    account: UpAccount | null
    absorbed: UpAccount[]
    tally: Map<string, SaverFunding>
  }

  const spokenFor = new Set<string>()
  const targets: Target[] = []

  for (const feed of FEEDS) {
    const account =
      savers.find((saver) => feed.saverPattern.test(saver.attributes.displayName)) ??
      null

    const absorbed = savers.filter(
      (saver) =>
        saver.id !== account?.id &&
        feed.replacesPatterns.some((pattern) =>
          pattern.test(saver.attributes.displayName),
        ),
    )

    if (account) spokenFor.add(account.id)
    for (const one of absorbed) spokenFor.add(one.id)

    targets.push({
      key: account?.id ?? `proposed:${feed.saver}`,
      feed,
      account,
      absorbed,
      tally: new Map(),
    })
  }

  // Savers with no feed at all. They still hold money and still receive
  // transfers, so leaving them off the page would be hiding an account.
  for (const saver of savers) {
    if (spokenFor.has(saver.id)) continue
    targets.push({
      key: saver.id,
      feed: null,
      account: saver,
      absorbed: [],
      tally: new Map(),
    })
  }

  const claimable = targets.filter(
    (target): target is Target & {feed: CompiledFeed} =>
      target.feed !== null && target.feed.catchAll !== true,
  )
  const catchAll = targets.find((target) => target.feed?.catchAll === true)

  const add = (target: Target, tx: UpTransaction, amount: number) => {
    const name = tx.attributes.description.trim()
    const key = name.toLowerCase()
    const entry = target.tally.get(key) ?? {name, perMonthCents: 0, count: 0}
    entry.perMonthCents += amount
    entry.count += 1
    target.tally.set(key, entry)
  }

  const unclaimed = new Map<string, SaverFunding>()
  let forecastCents = 0

  for (const tx of transactions) {
    if (!isCashflow(tx)) continue
    const amount = cents(tx)
    if (amount >= 0) continue
    if (basis.ids.has(tx.id)) continue
    if (!windowKeys.has(monthKeyOf(occurredAt(tx)))) continue

    const spend = Math.abs(amount)
    forecastCents += spend

    // Named merchants first. A category is a coarser claim than a merchant,
    // so "ALDI Mobile" has to reach its own saver before groceries can take
    // every ALDI charge in the window.
    const byName = claimable.find((target) => claimsByName(target.feed, tx))
    if (byName) {
      add(byName, tx, spend)
      continue
    }

    const ids = categoryIds(tx)
    const byCategory = claimable.find((target) =>
      ids.some((id) => target.feed.categories.has(id)),
    )
    if (byCategory) {
      add(byCategory, tx, spend)
      continue
    }

    if (catchAll) {
      add(catchAll, tx, spend)
      continue
    }

    const name = tx.attributes.description.trim()
    const key = name.toLowerCase()
    const entry = unclaimed.get(key) ?? {name, perMonthCents: 0, count: 0}
    entry.perMonthCents += spend
    entry.count += 1
    unclaimed.set(key, entry)
  }

  // Transfers in, measured. Every internal transfer names the account it
  // landed in, so this needs no matching at all.
  const incoming = new Map<string, number>()
  for (const tx of history) {
    const target = tx.relationships.transferAccount.data
    if (target === null) continue
    if (cents(tx) >= 0) continue
    if (!windowKeys.has(monthKeyOf(occurredAt(tx)))) continue
    incoming.set(target.id, (incoming.get(target.id) ?? 0) + Math.abs(cents(tx)))
  }

  const plans: SaverPlan[] = targets.map((target) => {
    const {feed} = target
    const held = [target.account, ...target.absorbed].filter(
      (account): account is UpAccount => account !== null,
    )

    const raw = [...target.tally.values()]

    // Rounded once, off the window total, rather than once per merchant:
    // rounding 200 merchants and adding them up drifts away from the budget
    // headline these savers are supposed to add back up to.
    const perMonthCents = Math.round(
      raw.reduce((sum, fund) => sum + fund.perMonthCents, 0) / monthCount,
    )
    const funds = raw
      .map((fund) => ({
        ...fund,
        perMonthCents: Math.round(fund.perMonthCents / monthCount),
      }))
      .sort((a, b) => b.perMonthCents - a.perMonthCents)

    const perYear = perMonthCents * 12
    const currentPerMonthCents = Math.round(
      held.reduce((sum, account) => sum + (incoming.get(account.id) ?? 0), 0) /
        monthCount,
    )

    return {
      id: target.key,
      name: target.account?.attributes.displayName ?? feed?.saver ?? "Saver",
      balanceCents: held.reduce(
        (sum, account) =>
          sum + Math.round(Number(account.attributes.balance.value) * 100),
        0,
      ),
      exists: target.account !== null,
      replaces: target.absorbed.map(
        (account) => account.attributes.displayName,
      ),
      declared: feed !== null,
      goal: feed?.goal === true,
      spending: feed?.spending === true,
      note: feed?.note ?? null,
      // All three come off the annual figure rather than doubling the weekly,
      // so a fortnight is a real 1/26th of the year and not two rounded weeks.
      perWeekCents: Math.round(perMonthCents / WEEKS_PER_MONTH),
      perFortnightCents: Math.round(perYear / 26),
      perMonthCents,
      currentPerMonthCents,
      // A goal has no bill to fall short of, and a Spending line has no
      // account to be short in. Neither reports a gap.
      gapPerMonthCents:
        feed?.goal === true || feed?.spending === true
          ? 0
          : perMonthCents - currentPerMonthCents,
      funds,
    }
  })

  plans.sort((a, b) => b.perMonthCents - a.perMonthCents)

  // Split late rather than early: a Spending line is claimed, tallied and
  // averaged by exactly the same code as a saver, because it's the same
  // question — what does this cost — and only the answer to "where does it
  // go" differs.
  const spending = plans.filter((plan) => plan.spending)
  const routed = plans.filter((plan) => !plan.spending)

  const unallocated = [...unclaimed.values()]
    .map((fund) => ({
      ...fund,
      perMonthCents: Math.round(fund.perMonthCents / monthCount),
    }))
    .sort((a, b) => b.perMonthCents - a.perMonthCents)

  const unallocatedPerMonthCents = Math.round(
    [...unclaimed.values()].reduce((sum, fund) => sum + fund.perMonthCents, 0) /
      monthCount,
  )
  const spendingPerMonthCents = spending.reduce(
    (sum, plan) => sum + plan.perMonthCents,
    0,
  )
  const perMonthCents = routed.reduce((sum, plan) => sum + plan.perMonthCents, 0)
  // Goals are excluded here for the same reason they never report a gap:
  // including the thousands a month going into Savings would leave the total
  // column and the total gap describing two different sets of savers.
  const currentPerMonthCents = routed.reduce(
    (sum, plan) => (plan.goal ? sum : sum + plan.currentPerMonthCents),
    0,
  )

  return {
    months: months.length,
    savers: routed,
    spending,
    spendingPerMonthCents,
    spendingPerWeekCents: Math.round(spendingPerMonthCents / WEEKS_PER_MONTH),
    forecastPerMonthCents: Math.round(forecastCents / monthCount),
    unallocated,
    unallocatedPerMonthCents,
    unallocatedPerWeekCents: Math.round(
      unallocatedPerMonthCents / WEEKS_PER_MONTH,
    ),
    perWeekCents: Math.round(perMonthCents / WEEKS_PER_MONTH),
    perFortnightCents: Math.round((perMonthCents * 12) / 26),
    perMonthCents,
    currentPerMonthCents,
    gapPerMonthCents: routed.reduce(
      (sum, plan) => sum + plan.gapPerMonthCents,
      0,
    ),
  }
}
