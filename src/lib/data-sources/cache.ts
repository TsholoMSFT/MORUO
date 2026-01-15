/**
 * LocalStorage caching layer for financial data
 * Reduces API calls and improves performance
 */

import type { CacheEntry, DataSourceName } from './types'

const CACHE_PREFIX = 'moruo_data_cache_'

export function getCacheKey(type: string, identifier: string): string {
  return `${CACHE_PREFIX}${type}_${identifier.toLowerCase().replace(/[^a-z0-9]/g, '_')}`
}

export function getFromCache<T>(key: string): CacheEntry<T> | null {
  try {
    const cached = localStorage.getItem(key)
    if (!cached) return null

    const entry: CacheEntry<T> = JSON.parse(cached)
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      localStorage.removeItem(key)
      return null
    }

    return entry
  } catch {
    return null
  }
}

export function setCache<T>(
  key: string,
  data: T,
  source: DataSourceName,
  durationMs: number
): void {
  try {
    const entry: CacheEntry<T> = {
      data,
      source,
      timestamp: Date.now(),
      expiresAt: Date.now() + durationMs,
    }
    localStorage.setItem(key, JSON.stringify(entry))
  } catch (error) {
    // Storage might be full - clear old entries
    console.warn('Cache storage error, clearing old entries:', error)
    clearExpiredCache()
  }
}

export function clearExpiredCache(): void {
  try {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const item = localStorage.getItem(key)
          if (item) {
            const entry = JSON.parse(item)
            if (Date.now() > entry.expiresAt) {
              keysToRemove.push(key)
            }
          }
        } catch {
          keysToRemove.push(key!)
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.warn('Error clearing cache:', error)
  }
}

export function clearAllCache(): void {
  try {
    const keysToRemove: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.warn('Error clearing all cache:', error)
  }
}

export function getCacheStats(): { 
  entries: number
  totalSize: number
  oldestEntry: number | null 
} {
  let entries = 0
  let totalSize = 0
  let oldestEntry: number | null = null

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith(CACHE_PREFIX)) {
        entries++
        const item = localStorage.getItem(key)
        if (item) {
          totalSize += item.length * 2 // UTF-16 encoding
          try {
            const entry = JSON.parse(item)
            if (!oldestEntry || entry.timestamp < oldestEntry) {
              oldestEntry = entry.timestamp
            }
          } catch {}
        }
      }
    }
  } catch {}

  return { entries, totalSize, oldestEntry }
}

/**
 * Wrapper function to fetch with caching
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<{ data: T; source: DataSourceName }>,
  durationMs: number
): Promise<{ data: T; source: DataSourceName; cached: boolean }> {
  // Check cache first
  const cached = getFromCache<T>(key)
  if (cached) {
    return { data: cached.data, source: cached.source, cached: true }
  }

  // Fetch fresh data
  const result = await fetcher()
  
  // Cache the result
  setCache(key, result.data, result.source, durationMs)
  
  return { ...result, cached: false }
}
