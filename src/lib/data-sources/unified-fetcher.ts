/**
 * Unified Data Fetcher
 * Implements fallback cascade across data sources
 */

import type { CompanyFinancials, DataSourceName, DataSourceResult } from './types'
import { fetchYahooFinancials } from './yahoo-finance'
import { fetchAlphaVantageFinancials } from './alpha-vantage'
import { fetchFMPFinancials } from './financial-modeling-prep'
import { fetchIEXFinancials } from './iex-cloud'
import { fetchEODFinancials } from './eod-historical'
import { fetchSECFinancials } from './sec-edgar'
import { API_KEYS } from './types'

export interface FetchOptions {
  /** Preferred data sources in order */
  preferredSources?: DataSourceName[]
  /** Whether to try all sources or stop at first success */
  tryAll?: boolean
  /** Exchange for non-US stocks */
  exchange?: string
  /** Whether to merge data from multiple sources */
  mergeResults?: boolean
  /** Timeout per source in ms */
  timeout?: number
}

/**
 * Get default priority order based on available API keys
 */
export function getDataSourcePriority(): DataSourceName[] {
  const priority: DataSourceName[] = []

  // Yahoo Finance first - no API key needed
  priority.push('yahoo-finance')

  // Add sources with API keys configured
  if (API_KEYS.alphaVantage) {
    priority.push('alpha-vantage')
  }
  if (API_KEYS.financialModelingPrep) {
    priority.push('financial-modeling-prep')
  }
  if (API_KEYS.iexCloud) {
    priority.push('iex-cloud')
  }
  if (API_KEYS.eodHistorical) {
    priority.push('eod-historical')
  }

  // SEC EDGAR - no API key needed, but US-only
  priority.push('sec-edgar')

  return priority
}

/**
 * Fetch with timeout wrapper
 */
async function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    ),
  ])
}

/**
 * Merge partial financials from multiple sources
 */
function mergeFinancials(
  primary: Partial<CompanyFinancials>,
  secondary: Partial<CompanyFinancials>
): Partial<CompanyFinancials> {
  const merged = { ...primary }

  // Fill in missing values from secondary
  for (const key of Object.keys(secondary) as (keyof CompanyFinancials)[]) {
    if (merged[key] === null || merged[key] === undefined) {
      (merged as Record<string, unknown>)[key] = secondary[key]
    }
  }

  return merged
}

/**
 * Fetch financials with fallback cascade
 */
export async function fetchWithFallback(
  ticker: string,
  sources: DataSourceName[],
  options: FetchOptions = {}
): Promise<DataSourceResult<CompanyFinancials>> {
  const { exchange, timeout = 15000, mergeResults = false } = options
  const errors: string[] = []
  let mergedData: Partial<CompanyFinancials> | null = null
  let primarySource: DataSourceName | null = null

  for (const source of sources) {
    try {
      let result: DataSourceResult<CompanyFinancials>

      switch (source) {
        case 'yahoo-finance':
          result = await fetchWithTimeout(
            fetchYahooFinancials(ticker),
            timeout
          )
          break

        case 'alpha-vantage':
          result = await fetchWithTimeout(
            fetchAlphaVantageFinancials(ticker),
            timeout
          )
          break

        case 'financial-modeling-prep':
          result = await fetchWithTimeout(
            fetchFMPFinancials(ticker),
            timeout
          )
          break

        case 'iex-cloud':
          result = await fetchWithTimeout(
            fetchIEXFinancials(ticker),
            timeout
          )
          break

        case 'eod-historical':
          result = await fetchWithTimeout(
            fetchEODFinancials(ticker, exchange || 'US'),
            timeout
          )
          break

        case 'sec-edgar':
          const secResult = await fetchWithTimeout(
            fetchSECFinancials(ticker),
            timeout
          )
          // SEC returns partial data, treat as supplementary
          if (secResult.data && mergedData) {
            mergedData = mergeFinancials(mergedData, secResult.data)
          }
          continue

        default:
          continue
      }

      if (result.data) {
        if (!mergeResults) {
          // Return first successful result
          return {
            data: result.data,
            source,
            timestamp: Date.now(),
            cached: result.cached,
          }
        }

        // Merge mode: combine data
        if (!mergedData) {
          mergedData = result.data
          primarySource = source
        } else {
          mergedData = mergeFinancials(mergedData, result.data)
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      errors.push(`${source}: ${message}`)
      console.warn(`[${source}] Failed for ${ticker}: ${message}`)
    }
  }

  // Return merged result if we got any data
  if (mergedData && primarySource) {
    return {
      data: mergedData as CompanyFinancials,
      source: primarySource,
      timestamp: Date.now(),
      cached: false,
      metadata: {
        mergedFrom: sources.filter(s => s !== 'sec-edgar'),
      },
    }
  }

  // All sources failed
  return {
    data: null,
    source: sources[0] || 'yahoo-finance',
    timestamp: Date.now(),
    cached: false,
    error: `All sources failed: ${errors.join('; ')}`,
  }
}

/**
 * Main entry point - fetch company financials
 */
export async function fetchCompanyFinancials(
  ticker: string,
  options: FetchOptions = {}
): Promise<DataSourceResult<CompanyFinancials>> {
  const sources = options.preferredSources || getDataSourcePriority()

  console.log(`[DataSources] Fetching ${ticker} from sources:`, sources)

  const result = await fetchWithFallback(ticker, sources, options)

  if (result.data) {
    console.log(`[DataSources] Successfully fetched ${ticker} from ${result.source}`)
  } else {
    console.error(`[DataSources] Failed to fetch ${ticker}:`, result.error)
  }

  return result
}

/**
 * Get exchange suffix for international tickers
 */
export function getExchangeSuffix(country: string): string {
  const suffixes: Record<string, string> = {
    'South Africa': 'JSE',
    'ZA': 'JSE',
    'United Kingdom': 'L',
    'UK': 'L',
    'Germany': 'DE',
    'Japan': 'T',
    'Hong Kong': 'HK',
    'Australia': 'AX',
    'Canada': 'TO',
    'France': 'PA',
    'India': 'NS',
    'Brazil': 'SA',
    'China': 'SS',
  }

  return suffixes[country] || 'US'
}

/**
 * Detect if ticker needs exchange suffix
 */
export function formatTickerForSource(
  ticker: string,
  source: DataSourceName,
  country?: string
): string {
  // Most sources use plain ticker for US stocks
  if (!country || country === 'USA' || country === 'US') {
    return ticker.toUpperCase()
  }

  // Yahoo uses .XX suffix
  if (source === 'yahoo-finance') {
    const suffix = getExchangeSuffix(country)
    return suffix ? `${ticker.toUpperCase()}.${suffix}` : ticker.toUpperCase()
  }

  return ticker.toUpperCase()
}
