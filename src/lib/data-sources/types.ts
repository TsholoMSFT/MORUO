/**
 * Unified types for multi-source financial data
 */

export type DataSourceName =
  | 'yahoo-finance'
  | 'alpha-vantage'
  | 'financial-modeling-prep'
  | 'iex-cloud'
  | 'fred'
  | 'world-bank'
  | 'sec-edgar'
  | 'eod-historical'
  | 'github'
  | 'google-trends'
  | 'hackernews'
  | 'npm-stats'
  | 'pypi-stats'
  | 'arxiv'
  | 'ai-enriched'
  | 'fallback'

export interface DataSourceResult<T> {
  data: T | null
  source: DataSourceName
  timestamp: number
  cached: boolean
  error?: string
  metadata?: Record<string, unknown>
}

export interface CompanyFinancials {
  // Identification
  ticker: string
  companyName: string
  exchange?: string
  sector?: string
  industry?: string
  country?: string

  // Income Statement (Annual)
  revenue: number | null
  revenueGrowthYoY: number | null
  grossProfit: number | null
  grossMargin: number | null
  operatingIncome: number | null
  operatingMargin: number | null
  netIncome: number | null
  netMargin: number | null
  ebitda: number | null

  // Balance Sheet
  totalAssets: number | null
  totalLiabilities: number | null
  totalEquity: number | null
  cash: number | null
  totalDebt: number | null
  currentAssets: number | null
  currentLiabilities: number | null

  // Cash Flow
  operatingCashFlow: number | null
  freeCashFlow: number | null
  capitalExpenditures: number | null

  // Per Share
  eps: number | null
  bookValuePerShare: number | null
  revenuePerShare: number | null

  // Employees
  employeeCount: number | null

  // Valuation
  marketCap: number | null
  enterpriseValue: number | null
  peRatio: number | null
  pbRatio: number | null
  psRatio: number | null
  evToEbitda: number | null

  // Profitability Ratios
  returnOnEquity: number | null
  returnOnAssets: number | null
  returnOnCapital: number | null

  // Liquidity Ratios
  currentRatio: number | null
  quickRatio: number | null

  // Leverage Ratios
  debtToEquity: number | null
  debtToAssets: number | null

  // Metadata
  fiscalYearEnd: string | null
  lastUpdated: string
  dataSource: DataSourceName
  dataQuality: 'high' | 'medium' | 'low'
}

export interface MacroeconomicData {
  indicator: string
  value: number
  unit: string
  date: string
  country: string
  source: DataSourceName
  description?: string
}

export interface SECFiling {
  type: '10-K' | '10-Q' | '8-K' | 'DEF 14A' | 'S-1' | 'other'
  filingDate: string
  acceptedDate: string
  documentUrl: string
  description: string
  formType: string
  cik: string
}

export interface TechSentiment {
  source: DataSourceName
  query: string
  timestamp: string
  metrics: Record<string, unknown>
  sentiment: 'positive' | 'negative' | 'neutral'
  confidence: number
}

export interface PackageStats {
  name: string
  platform: 'npm' | 'pypi'
  version: string
  downloadsLastWeek: number
  downloadsLastMonth: number
  downloadsLastYear: number
  trend: 'rising' | 'stable' | 'falling'
  trendPercent: number
  stars: number | null
  forks: number | null
  openIssues: number | null
  contributors: number | null
  lastPublish: string | null
  firstPublish: string | null
  dependencyCount: number
  repositoryUrl: string | null
}

export interface ArxivPaper {
  id: string
  title: string
  abstract: string
  authors: string[]
  categories: string[]
  publishedDate: string
  updatedDate: string
  pdfUrl: string
  arxivUrl: string
}

export interface TechTrendAnalysis {
  technology: string
  overallSentiment: 'bullish' | 'bearish' | 'neutral'
  sentimentScore: number
  adoptionTrend: number
  researchActivity: number
  insights: string[]
  risks: string[]
  sources: DataSourceName[]
  generatedAt: string
}

export interface CacheEntry<T> {
  data: T
  source: DataSourceName
  timestamp: number
  expiresAt: number
}

// Cache duration in milliseconds
export const CACHE_DURATIONS = {
  fundamentals: 24 * 60 * 60 * 1000, // 24 hours
  quotes: 5 * 60 * 1000, // 5 minutes
  macro: 12 * 60 * 60 * 1000, // 12 hours
  filings: 24 * 60 * 60 * 1000, // 24 hours
  sentiment: 60 * 60 * 1000, // 1 hour
  packages: 6 * 60 * 60 * 1000, // 6 hours
  arxiv: 12 * 60 * 60 * 1000, // 12 hours
  techStats: 6 * 60 * 60 * 1000, // 6 hours
} as const

// API Keys - read from environment or use empty string
export const API_KEYS = {
  alphaVantage: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || '',
  financialModelingPrep: import.meta.env.VITE_FMP_API_KEY || '',
  iexCloud: import.meta.env.VITE_IEX_CLOUD_API_KEY || '',
  fred: import.meta.env.VITE_FRED_API_KEY || '',
  eodHistorical: import.meta.env.VITE_EOD_API_KEY || '',
} as const
