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

/**
 * `path` is either a path relative to the API base ("/accounts") or an absolute
 * URL, which is what the pagination `links.next` field hands back.
 */
async function upFetch<T>(path: string): Promise<T> {
  const url = path.startsWith("http") ? path : `${UP_API_BASE}${path}`

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token()}`,
      Accept: "application/json",
    },
    // Balances need to be current — never serve these from a cache.
    cache: "no-store",
  })

  if (!response.ok) {
    let detail = response.statusText

    try {
      const body = (await response.json()) as UpErrorResponse
      detail = body.errors?.[0]?.detail ?? body.errors?.[0]?.title ?? detail
    } catch {
      // Non-JSON error body; the status text will have to do.
    }

    if (response.status === 401) {
      throw new UpApiError(
        "Up rejected the API token. Check UP_API_TOKEN is current.",
        401,
      )
    }

    if (response.status === 429) {
      throw new UpApiError("Rate limited by Up. Wait a moment and reload.", 429)
    }

    throw new UpApiError(`Up API error: ${detail}`, response.status)
  }

  return response.json() as Promise<T>
}

export async function upGet<T>(path: string): Promise<T> {
  return upFetch<T>(path)
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
export async function upGetAll<T>(path: string): Promise<UpCollection<T>> {
  const items: T[] = []
  let next: string | null = path
  let pages = 0

  while (next && pages < MAX_PAGES) {
    const page: UpListResponse<T> = await upFetch<UpListResponse<T>>(next)
    items.push(...page.data)
    next = page.links.next
    pages += 1
  }

  return {items, truncated: next !== null}
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
