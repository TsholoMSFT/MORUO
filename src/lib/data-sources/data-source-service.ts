/**
 * Data Source Service - Enhanced Integration Layer
 * Provides connection testing, retry logic, health monitoring, and status reporting
 */

import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import type { DataSourceName, DataSourceResult, CompanyFinancials } from './types'
import { API_KEYS } from './types'
import { getCacheStats, clearAllCache } from './cache'
import { getDataSourcePriority } from './unified-fetcher'

// Connection status types
export type ConnectionStatus = 'connected' | 'degraded' | 'disconnected' | 'unknown' | 'no-key'

export interface DataSourceHealth {
  name: DataSourceName
  displayName: string
  status: ConnectionStatus
  lastCheck: number
  responseTime: number | null
  errorMessage: string | null
  hasApiKey: boolean
  rateLimit?: {
    remaining: number
    limit: number
    resetsAt: number
  }
  features: string[]
}

export interface SystemHealth {
  overall: ConnectionStatus
  sources: DataSourceHealth[]
  cacheStats: {
    entries: number
    totalSize: number
    oldestEntry: number | null
  }
  lastFullCheck: number
  activeSource: DataSourceName | null
  fallbackChain: DataSourceName[]
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number
  initialDelayMs: number
  maxDelayMs: number
  backoffMultiplier: number
  retryableErrors: number[] // HTTP status codes to retry
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [408, 429, 500, 502, 503, 504],
}

// Data source configuration
const DATA_SOURCE_CONFIG: Record<DataSourceName, {
  displayName: string
  testUrl: string
  apiKeyEnvVar: string | null
  features: string[]
  requiresApiKey: boolean
}> = {
  'yahoo-finance': {
    displayName: 'Yahoo Finance',
    testUrl: 'https://query1.finance.yahoo.com/v8/finance/chart/MSFT?interval=1d&range=1d',
    apiKeyEnvVar: null,
    features: ['Quotes', 'Historical', 'Fundamentals', 'International'],
    requiresApiKey: false,
  },
  'alpha-vantage': {
    displayName: 'Alpha Vantage',
    testUrl: 'https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=IBM&interval=5min',
    apiKeyEnvVar: 'VITE_ALPHA_VANTAGE_API_KEY',
    features: ['Quotes', 'Historical', 'Fundamentals', 'Technical Indicators'],
    requiresApiKey: true,
  },
  'financial-modeling-prep': {
    displayName: 'Financial Modeling Prep',
    testUrl: 'https://financialmodelingprep.com/api/v3/stock/list',
    apiKeyEnvVar: 'VITE_FMP_API_KEY',
    features: ['Fundamentals', 'Filings', 'Ratios', 'DCF'],
    requiresApiKey: true,
  },
  'iex-cloud': {
    displayName: 'IEX Cloud',
    testUrl: 'https://cloud.iexapis.com/stable/status',
    apiKeyEnvVar: 'VITE_IEX_CLOUD_API_KEY',
    features: ['Real-time Quotes', 'Fundamentals', 'News', 'Analytics'],
    requiresApiKey: true,
  },
  'eod-historical': {
    displayName: 'EOD Historical Data',
    testUrl: 'https://eodhistoricaldata.com/api/eod/AAPL.US',
    apiKeyEnvVar: 'VITE_EOD_API_KEY',
    features: ['Historical', 'Fundamentals', 'Dividends', 'Splits'],
    requiresApiKey: true,
  },
  'fred': {
    displayName: 'Federal Reserve (FRED)',
    testUrl: 'https://api.stlouisfed.org/fred/series?series_id=GDP',
    apiKeyEnvVar: 'VITE_FRED_API_KEY',
    features: ['Macroeconomic Data', 'Interest Rates', 'Economic Indicators'],
    requiresApiKey: true,
  },
  'sec-edgar': {
    displayName: 'SEC EDGAR',
    testUrl: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&output=atom',
    apiKeyEnvVar: null,
    features: ['SEC Filings', '10-K', '10-Q', '8-K', 'Insider Trading'],
    requiresApiKey: false,
  },
  'world-bank': {
    displayName: 'World Bank',
    testUrl: 'https://api.worldbank.org/v2/country/all/indicator/NY.GDP.MKTP.CD?format=json&per_page=1',
    apiKeyEnvVar: null,
    features: ['Global Economics', 'Country Data', 'Development Indicators'],
    requiresApiKey: false,
  },
  'github': {
    displayName: 'GitHub',
    testUrl: 'https://api.github.com/rate_limit',
    apiKeyEnvVar: null,
    features: ['Repository Stats', 'Commits', 'Stars', 'Contributors'],
    requiresApiKey: false,
  },
  'google-trends': {
    displayName: 'Google Trends',
    testUrl: 'https://trends.google.com/',
    apiKeyEnvVar: null,
    features: ['Search Trends', 'Interest Over Time'],
    requiresApiKey: false,
  },
  'hackernews': {
    displayName: 'Hacker News',
    testUrl: 'https://hacker-news.firebaseio.com/v0/topstories.json',
    apiKeyEnvVar: null,
    features: ['Tech News', 'Sentiment', 'Trending Topics'],
    requiresApiKey: false,
  },
  'npm-stats': {
    displayName: 'npm Registry',
    testUrl: 'https://registry.npmjs.org/',
    apiKeyEnvVar: null,
    features: ['Package Downloads', 'Version History', 'Dependencies'],
    requiresApiKey: false,
  },
  'pypi-stats': {
    displayName: 'PyPI Stats',
    testUrl: 'https://pypistats.org/api/',
    apiKeyEnvVar: null,
    features: ['Package Downloads', 'Python Ecosystem'],
    requiresApiKey: false,
  },
  'arxiv': {
    displayName: 'arXiv',
    testUrl: 'https://export.arxiv.org/api/query?search_query=all:electron&max_results=1',
    apiKeyEnvVar: null,
    features: ['Research Papers', 'AI/ML Papers', 'Academic Trends'],
    requiresApiKey: false,
  },
  'ai-enriched': {
    displayName: 'AI Enrichment',
    testUrl: '',
    apiKeyEnvVar: null,
    features: ['AI Analysis', 'Narrative Generation'],
    requiresApiKey: false,
  },
  'fallback': {
    displayName: 'Fallback Data',
    testUrl: '',
    apiKeyEnvVar: null,
    features: ['Mock Data', 'Demo Mode'],
    requiresApiKey: false,
  },
}

/**
 * Calculate delay for retry with exponential backoff
 */
function calculateRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt)
  return Math.min(delay, config.maxDelayMs)
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: unknown, config: RetryConfig): boolean {
  if (error instanceof AxiosError) {
    // Network errors are retryable
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true
    }
    // Check status code
    if (error.response?.status && config.retryableErrors.includes(error.response.status)) {
      return true
    }
  }
  return false
}

/**
 * Fetch with automatic retry logic
 */
export async function fetchWithRetry<T>(
  fetcher: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await fetcher()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))
      
      if (attempt < retryConfig.maxRetries && isRetryableError(error, retryConfig)) {
        const delay = calculateRetryDelay(attempt, retryConfig)
        console.warn(`[Retry] Attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message)
        await sleep(delay)
      } else {
        break
      }
    }
  }

  throw lastError || new Error('Unknown error during fetch with retry')
}

/**
 * Test connection to a specific data source
 */
export async function testDataSourceConnection(
  source: DataSourceName
): Promise<DataSourceHealth> {
  const config = DATA_SOURCE_CONFIG[source]
  const startTime = Date.now()
  
  // Check API key requirement
  const hasApiKey = config.apiKeyEnvVar 
    ? Boolean(API_KEYS[config.apiKeyEnvVar.replace('VITE_', '').toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof typeof API_KEYS])
    : true

  if (config.requiresApiKey && !hasApiKey) {
    return {
      name: source,
      displayName: config.displayName,
      status: 'no-key',
      lastCheck: Date.now(),
      responseTime: null,
      errorMessage: 'API key not configured',
      hasApiKey: false,
      features: config.features,
    }
  }

  // Skip test for internal sources
  if (!config.testUrl) {
    return {
      name: source,
      displayName: config.displayName,
      status: 'connected',
      lastCheck: Date.now(),
      responseTime: 0,
      errorMessage: null,
      hasApiKey: true,
      features: config.features,
    }
  }

  try {
    const response = await axios.get(config.testUrl, {
      timeout: 10000,
      headers: {
        'Accept': 'application/json',
      },
    })

    const responseTime = Date.now() - startTime

    return {
      name: source,
      displayName: config.displayName,
      status: responseTime > 5000 ? 'degraded' : 'connected',
      lastCheck: Date.now(),
      responseTime,
      errorMessage: null,
      hasApiKey,
      features: config.features,
    }
  } catch (error) {
    const responseTime = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'

    return {
      name: source,
      displayName: config.displayName,
      status: 'disconnected',
      lastCheck: Date.now(),
      responseTime,
      errorMessage: message,
      hasApiKey,
      features: config.features,
    }
  }
}

/**
 * Test all configured data sources
 */
export async function testAllDataSources(): Promise<DataSourceHealth[]> {
  const sources = Object.keys(DATA_SOURCE_CONFIG) as DataSourceName[]
  
  // Test all sources in parallel
  const results = await Promise.all(
    sources.map(source => testDataSourceConnection(source))
  )

  return results
}

/**
 * Get full system health status
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  const sourceResults = await testAllDataSources()
  const cacheStats = getCacheStats()
  const fallbackChain = getDataSourcePriority()
  
  // Determine overall status
  const connectedCount = sourceResults.filter(s => s.status === 'connected').length
  const degradedCount = sourceResults.filter(s => s.status === 'degraded').length
  const totalActive = sourceResults.filter(s => s.status !== 'no-key' && s.hasApiKey).length

  let overall: ConnectionStatus = 'disconnected'
  if (connectedCount > 0) {
    overall = degradedCount > connectedCount ? 'degraded' : 'connected'
  }

  // Find active source (first connected in priority order)
  const activeSource = fallbackChain.find(source => 
    sourceResults.find(s => s.name === source && s.status === 'connected')
  ) || null

  return {
    overall,
    sources: sourceResults,
    cacheStats,
    lastFullCheck: Date.now(),
    activeSource,
    fallbackChain,
  }
}

/**
 * Clear all cached data and return updated cache stats
 */
export function clearDataCache(): { entries: number; totalSize: number; oldestEntry: number | null } {
  clearAllCache()
  return getCacheStats()
}

/**
 * Get configuration status for all data sources
 */
export function getDataSourceConfiguration(): {
  configured: DataSourceName[]
  unconfigured: DataSourceName[]
  noKeyRequired: DataSourceName[]
} {
  const sources = Object.entries(DATA_SOURCE_CONFIG) as [DataSourceName, typeof DATA_SOURCE_CONFIG[DataSourceName]][]
  
  const noKeyRequired: DataSourceName[] = []
  const configured: DataSourceName[] = []
  const unconfigured: DataSourceName[] = []

  for (const [source, config] of sources) {
    if (!config.requiresApiKey) {
      noKeyRequired.push(source)
    } else if (config.apiKeyEnvVar) {
      const keyName = config.apiKeyEnvVar.replace('VITE_', '').toLowerCase().replace(/_([a-z])/g, (_, c) => c.toUpperCase()) as keyof typeof API_KEYS
      if (API_KEYS[keyName]) {
        configured.push(source)
      } else {
        unconfigured.push(source)
      }
    }
  }

  return { configured, unconfigured, noKeyRequired }
}

/**
 * Request wrapper with logging and metrics
 */
export async function instrumentedRequest<T>(
  source: DataSourceName,
  request: () => Promise<T>,
  options: {
    operation: string
    ticker?: string
    retryConfig?: Partial<RetryConfig>
  }
): Promise<DataSourceResult<T>> {
  const startTime = Date.now()
  const { operation, ticker, retryConfig } = options

  console.log(`[${source}] Starting ${operation}${ticker ? ` for ${ticker}` : ''}`)

  try {
    const data = await fetchWithRetry(request, retryConfig)
    const duration = Date.now() - startTime

    console.log(`[${source}] Completed ${operation} in ${duration}ms`)

    return {
      data,
      source,
      timestamp: Date.now(),
      cached: false,
      metadata: {
        duration,
        operation,
        ticker,
      },
    }
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : 'Unknown error'

    console.error(`[${source}] Failed ${operation} after ${duration}ms:`, message)

    return {
      data: null,
      source,
      timestamp: Date.now(),
      cached: false,
      error: message,
      metadata: {
        duration,
        operation,
        ticker,
      },
    }
  }
}

/**
 * Validate API key format (basic checks)
 */
export function validateApiKey(source: DataSourceName, key: string): boolean {
  const validators: Record<string, (key: string) => boolean> = {
    'alpha-vantage': (k) => k.length === 16 && /^[A-Z0-9]+$/.test(k),
    'financial-modeling-prep': (k) => k.length >= 20,
    'iex-cloud': (k) => k.startsWith('pk_') || k.startsWith('sk_'),
    'fred': (k) => k.length === 32,
    'eod-historical': (k) => k.length >= 20,
  }

  const validator = validators[source]
  if (!validator) return true // No validation for this source

  return validator(key)
}

/**
 * Get human-readable status message
 */
export function getStatusMessage(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'Connected and operational'
    case 'degraded':
      return 'Connected but experiencing slow responses'
    case 'disconnected':
      return 'Unable to connect'
    case 'no-key':
      return 'API key not configured'
    case 'unknown':
    default:
      return 'Status unknown'
  }
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'text-green-500'
    case 'degraded':
      return 'text-amber-500'
    case 'disconnected':
      return 'text-red-500'
    case 'no-key':
      return 'text-gray-400'
    case 'unknown':
    default:
      return 'text-gray-500'
  }
}

/**
 * Format bytes to human readable
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
