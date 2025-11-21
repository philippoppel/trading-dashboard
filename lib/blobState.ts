import { list } from '@vercel/blob'

type CachedState = {
  url: string
  state: any
  fetchedAt: number
}

const CACHE_TTL_MS = 10_000
let cache: CachedState | null = null

async function fetchLatestBlobUrl(token: string): Promise<string> {
  const { blobs } = await list({
    token,
    prefix: 'trading-state.json',
  })

  if (!blobs || blobs.length === 0) {
    throw new Error('State not found. Upload state data first.')
  }

  return blobs[0].url
}

export async function getLatestState(token: string) {
  const now = Date.now()
  const isCacheValid = cache && now - cache.fetchedAt < CACHE_TTL_MS

  try {
    const url = isCacheValid ? cache!.url : await fetchLatestBlobUrl(token)

    if (isCacheValid) {
      return cache!.state
    }

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch state blob: ${response.status}`)
    }

    const state = await response.json()
    cache = { url, state, fetchedAt: now }
    return state
  } catch (error) {
    // Invalidate cache on any error to avoid serving stale data
    cache = null
    throw error
  }
}
