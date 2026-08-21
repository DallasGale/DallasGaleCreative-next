/**
 * Freezes thirteen months of Up history into src/data/up-snapshot.json.
 *
 * The dashboard used to walk that history on every cold render: about fifty
 * paginated requests to a Sydney API, measured at 46.7 seconds from a local
 * connection, against a 60-second ceiling on Vercel's Hobby plan. That's not
 * a cache problem, it's the wrong time to be doing the work — the history is
 * settled, so it can be fetched once at build time and read from the bundle.
 *
 * Balances aren't in here on purpose. What's in your accounts right now is
 * the one thing a snapshot would get wrong, so accounts stay live.
 *
 *   pnpm snapshot            fetch from Up and write the file
 *   pnpm snapshot --ensure   write an empty file only if none exists
 *
 * `prebuild` runs the fetching form, so every deploy ships a snapshot taken
 * at deploy time. `predev` runs the --ensure form, so starting the dev server
 * neither hits the bank nor overwrites the snapshot already sitting there.
 *
 * The empty form matters: the app imports this JSON statically, so the file
 * has to exist for the build to compile. An empty snapshot is not a failure
 * state — the app falls back to fetching live, exactly as it did before.
 *
 * The output is NOT committed. It is a full record of where you shop, who
 * you pay and how much, and this repository is public.
 */

import {mkdirSync, existsSync, writeFileSync} from "node:fs"
import {dirname, join} from "node:path"
import {fileURLToPath} from "node:url"
import {
  monthWindows,
  recentMonths,
  startOfMonth,
} from "../src/lib/up/period.ts"
import type {UpTransaction} from "../src/lib/up/types.ts"

const HISTORY_MONTHS = 13
const UP_API_BASE = "https://api.up.com.au/api/v1"
const CONCURRENT_WINDOWS = 6

const here = dirname(fileURLToPath(import.meta.url))
const OUT = join(here, "..", "src", "data", "up-snapshot.json")

type Snapshot = {
  generatedAt: string | null
  /** Oldest instant covered, so a request for more history can decline it. */
  since: string | null
  count: number
  truncated: boolean
  transactions: UpTransaction[]
}

const EMPTY: Snapshot = {
  generatedAt: null,
  since: null,
  count: 0,
  truncated: false,
  transactions: [],
}

function write(snapshot: Snapshot): void {
  mkdirSync(dirname(OUT), {recursive: true})
  writeFileSync(OUT, `${JSON.stringify(snapshot)}\n`)
}

/**
 * Only the fields the dashboard reads.
 *
 * A snapshot is compiled into the server bundle, so every field kept is
 * weight carried on every cold start. Dropping the rest takes the file to
 * roughly a third of what Up returns, and anything missing would fail loudly
 * at the type level rather than quietly becoming undefined.
 */
function slim(tx: UpTransaction): UpTransaction {
  return {
    type: tx.type,
    id: tx.id,
    attributes: {
      status: tx.attributes.status,
      description: tx.attributes.description,
      rawText: tx.attributes.rawText,
      message: tx.attributes.message,
      isCategorizable: tx.attributes.isCategorizable,
      amount: tx.attributes.amount,
      foreignAmount: null,
      createdAt: tx.attributes.createdAt,
      settledAt: tx.attributes.settledAt,
      transactionType: tx.attributes.transactionType,
      roundUp: null,
      cashback: null,
      note: null,
    },
    relationships: {
      account: tx.relationships.account,
      transferAccount: tx.relationships.transferAccount,
      category: tx.relationships.category,
      parentCategory: tx.relationships.parentCategory,
      tags: {data: []},
    },
  }
}

async function page<T>(url: string, token: string): Promise<T> {
  const response = await fetch(url.startsWith("http") ? url : UP_API_BASE + url, {
    headers: {Authorization: `Bearer ${token}`, Accept: "application/json"},
  })
  if (!response.ok) {
    throw new Error(`Up returned ${response.status} for ${url}`)
  }
  return response.json() as Promise<T>
}

async function walk(url: string, token: string): Promise<UpTransaction[]> {
  const collected: UpTransaction[] = []
  let next: string | null = url
  let pages = 0

  while (next && pages < 60) {
    const body: {data: UpTransaction[]; links?: {next?: string | null}} =
      await page(next, token)
    collected.push(...body.data)
    next = body.links?.next ?? null
    pages += 1
  }

  return collected
}

async function main(): Promise<void> {
  const ensureOnly = process.argv.includes("--ensure")

  if (ensureOnly && existsSync(OUT)) {
    console.log("up-snapshot.json already present — leaving it alone.")
    return
  }

  const token = process.env.UP_API_TOKEN
  if (!token) {
    // Not fatal. A build without a token produces a working app that fetches
    // live, which is worse but not broken — and failing the build here would
    // make the token a hard requirement for anyone cloning the repo.
    write(EMPTY)
    console.warn(
      "UP_API_TOKEN is not set — wrote an empty snapshot. The dashboard will fetch live.",
    )
    return
  }

  if (ensureOnly) {
    write(EMPTY)
    console.log("Wrote an empty snapshot. Run `pnpm snapshot` to fill it.")
    return
  }

  // The same boundary the dashboard computes, from the same function, in the
  // same zone. A snapshot that starts an hour later than the window asked for
  // is a snapshot the app is right to refuse.
  const now = new Date()
  const months = recentMonths(HISTORY_MONTHS, now)
  const windows = monthWindows(startOfMonth(months[0]), now)

  const started = Date.now()
  const results: UpTransaction[][] = new Array(windows.length)
  let cursor = 0

  await Promise.all(
    Array.from({length: Math.min(CONCURRENT_WINDOWS, windows.length)}, async () => {
      while (true) {
        const index = cursor++
        if (index >= windows.length) return
        const window = windows[index]
        const query = new URLSearchParams({
          "page[size]": "100",
          "filter[since]": window.since,
        })
        if (window.until) query.set("filter[until]", window.until)
        results[index] = await walk(`/transactions?${query}`, token)
      }
    }),
  )

  // Windows share their boundary instant by design, so the merge is by id.
  const byId = new Map<string, UpTransaction>()
  for (const chunk of results) {
    for (const tx of chunk) byId.set(tx.id, slim(tx))
  }

  const transactions = [...byId.values()]
  write({
    generatedAt: new Date().toISOString(),
    since: windows[0].since,
    count: transactions.length,
    truncated: false,
    transactions,
  })

  const seconds = ((Date.now() - started) / 1000).toFixed(1)
  console.log(
    `Snapshot: ${transactions.length} transactions since ${windows[0].since.slice(0, 10)} in ${seconds}s.`,
  )
}

// A bank that's down, or a token that's expired, must not take the whole
// site's deploy with it. The build continues with an empty snapshot — the
// dashboard then fetches live, which is slow but correct — and says loudly
// what happened, because silently reverting to the slow path is how this
// problem comes back without anyone noticing.
try {
  await main()
} catch (error) {
  write(EMPTY)
  console.error(
    `\n  Snapshot failed: ${error instanceof Error ? error.message : error}`,
  )
  console.error(
    "  Built with an empty snapshot. The dashboard will fall back to fetching\n" +
      "  history live on every render, which is what the snapshot exists to avoid.\n",
  )
}
