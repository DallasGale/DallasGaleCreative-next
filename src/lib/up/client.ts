import "server-only"

import type {UpErrorResponse, UpListResponse} from "./types"

const UP_API_BASE = "https://api.up.com.au/api/v1"

/**
 * Safety valve so a wide date range can't walk the whole account history.
 * At Up's maximum page size of 100 this caps a request at 6,000 records —
 * comfortably more than 13 months for a normal account, and callers are told
 * when they hit it rather than silently receiving short totals.
 */
const MAX_PAGES = 60

/**
 * How long a response may be reused, and under which tag.
 *
 * Balances have to be current, so they go to the network every time. History
 * doesn't change once it has happened — and re-walking fifty pages of it on
 * every page load is what makes the dashboard slow enough for a platform to
 * hang up mid-render.
 */
export type CachePolicy = {
  /** Seconds the response may be reused. Omit to always fetch live. */
  revalidate?: number
  /** Cache tags, so a Refresh can force a real refetch. */
  tags?: string[]
}

/**
 * Thirteen months is around fifty requests, back to back, to an API that rate
 * limits. Any one of them failing used to take the whole dashboard down with
 * it, and a socket dying mid-walk is the likeliest failure of the lot — so
 * transient trouble is retried rather than surfaced.
 */
const RETRY_STATUSES = new Set([429, 500, 502, 503, 504])
const RETRY_DELAYS_MS = [400, 1_200]
/** Cap on an honoured Retry-After, so Up can't park a render for a minute. */
const MAX_RETRY_AFTER_MS = 5_000

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class UpApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "UpApiError"
    this.status = status
  }
}

function token(): string {
  const value = process.env.UP_API_TOKEN
  if (!value) {
    throw new UpApiError(
      "UP_API_TOKEN is not set. Get a token from https://api.up.com.au/getting_started and add it to .env.local",
      500,
    )
  }
  return value
}

/** Turns a failed response into the clearest error we can offer. */
async function failure(response: Response): Promise<UpApiError> {
  let detail = response.statusText

  try {
    const body = (await response.json()) as UpErrorResponse
    detail = body.errors?.[0]?.detail ?? body.errors?.[0]?.title ?? detail
  } catch {
    // Non-JSON error body; the status text will have to do.
  }

  if (response.status === 401) {
    return new UpApiError(
      "Up rejected the API token. Check UP_API_TOKEN is current.",
      401,
    )
  }

  if (response.status === 429) {
    return new UpApiError("Rate limited by Up. Wait a moment and reload.", 429)
  }

  return new UpApiError(`Up API error: ${detail}`, response.status)
}

/**
 * `path` is either a path relative to the API base ("/accounts") or an absolute
 * URL, which is what the pagination `links.next` field hands back.
 */
async function upFetch<T>(path: string, policy: CachePolicy = {}): Promise<T> {
  const url = path.startsWith("http") ? path : `${UP_API_BASE}${path}`

  const init: RequestInit = {
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
    },
    // A revalidate window and no-store are mutually exclusive: set both and
    // Next.js ignores both, which would silently mean no caching at all.
    ...(policy.revalidate === undefined
      ? {cache: "no-store" as const}
      : {next: {revalidate: policy.revalidate, tags: policy.tags}}),
  }

  for (let attempt = 0; ; attempt++) {
    const canRetry = attempt < RETRY_DELAYS_MS.length
    let response: Response

    try {
      response = await fetch(url, init)
    } catch (error) {
      // No response at all: DNS, a reset socket, a keep-alive Up closed
      // underneath us. Worth another go before giving up on the page.
      if (!canRetry) {
        throw new UpApiError(
          `Couldn't reach Up: ${
            error instanceof Error ? error.message : "network error"
          }`,
          503,
        )
      }
      await sleep(RETRY_DELAYS_MS[attempt])
      continue
    }

    if (response.ok) return response.json() as Promise<T>

    if (canRetry && RETRY_STATUSES.has(response.status)) {
      const after = Number(response.headers.get("retry-after"))
      await sleep(
        Number.isFinite(after) && after > 0
          ? Math.min(after * 1_000, MAX_RETRY_AFTER_MS)
          : RETRY_DELAYS_MS[attempt],
      )
      continue
    }

    throw await failure(response)
  }
}

export async function upGet<T>(
  path: string,
  policy?: CachePolicy,
): Promise<T> {
  return upFetch<T>(path, policy)
}

export type UpCollection<T> = {
  items: T[]
  /**
   * True when MAX_PAGES cut the walk short, so `items` is an incomplete view
   * of the range. Averages built on a truncated set understate reality, so
   * the UI says so rather than quietly reporting the wrong number.
   */
  truncated: boolean
}

/**
 * Follows `links.next` until the collection is exhausted or MAX_PAGES is hit,
 * returning the concatenated `data` arrays.
 */
export async function upGetAll<T extends {id: string}>(
  path: string,
  policy?: CachePolicy,
): Promise<UpCollection<T>> {
  // Keyed by id rather than pushed, because a cached walk can in principle
  // straddle a cursor shift: if the first page comes back fresh while later
  // pages are still cached, a record that moved between them would otherwise
  // be counted twice — and a duplicated transaction quietly inflates every
  // total on the page rather than failing.
  const seen = new Map<string, T>()
  let next: string | null = path
  let pages = 0

  while (next && pages < MAX_PAGES) {
    // Each page is cached under its own URL. The cursor in `links.next` is
    // stable for a fixed `filter[since]`, so a cached first page leads to the
    // same chain rather than a half-old, half-new one.
    const page: UpListResponse<T> = await upFetch<UpListResponse<T>>(
      next,
      policy,
    )
    for (const item of page.data) seen.set(item.id, item)
    next = page.links?.next ?? null
    pages += 1
  }

  return {items: [...seen.values()], truncated: next !== null}
}

/** Builds a query string from the bracketed params the Up API expects. */
export function upQuery(params: Record<string, string | number | undefined>) {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value))
  }

  const query = search.toString()
  return query ? `?${query}` : ""
}
