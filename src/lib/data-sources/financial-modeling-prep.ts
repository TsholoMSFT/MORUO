/**
 * Financial Modeling Prep (FMP) Data Source
 * Free tier: 250 API calls per day
 * Global stock coverage with comprehensive fundamentals
 */

import type { CompanyFinancials, DataSourceResult } from './types'
import { API_KEYS, CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const BASE_URL = 'https://financialmodelingprep.com/api/v3'

interface FMPCompanyProfile {
  symbol: string
  companyName: string
  exchange: string
  exchangeShortName: string
  industry: string
  sector: string
  country: string
  fullTimeEmployees: string
  mktCap: number
  price: number
}

interface FMPIncomeStatement {
  date: string
  revenue: number
  grossProfit: number
  operatingIncome: number
  netIncome: number
  ebitda: number
  eps: number
  epsdiluted: number
}

interface FMPBalanceSheet {
  date: string
  totalAssets: number
  totalLiabilities: number
  totalStockholdersEquity: number
  cashAndCashEquivalents: number
  shortTermDebt: number
  longTermDebt: number
  totalDebt: number
  totalCurrentAssets: number
  totalCurrentLiabilities: number
}

interface FMPCashFlow {
  date: string
  operatingCashFlow: number
  capitalExpenditure: number
  freeCashFlow: number
}

interface FMPKeyMetrics {
  date: string
  revenuePerShare: number
  netIncomePerShare: number
  operatingCashFlowPerShare: number
  freeCashFlowPerShare: number
  bookValuePerShare: number
  peRatio: number
  priceToBookRatio: number
  priceToSalesRatio: number
  evToEbitda: number
  enterpriseValue: number
  roe: number
  roa: number
  roic: number
  currentRatio: number
  quickRatio: number
  debtToEquity: number
  debtToAssets: number
  revenueGrowth: number
  grossProfitMargin: number
  operatingProfitMargin: number
  netProfitMargin: number
}

async function fetchFMPEndpoint<T>(endpoint: string): Promise<T> {
  const apiKey = API_KEYS.financialModelingPrep
  if (!apiKey) {
    throw new Error('Financial Modeling Prep API key not configured')
  }

  const separator = endpoint.includes('?') ? '&' : '?'
  const url = `${BASE_URL}${endpoint}${separator}apikey=${apiKey}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`FMP error: ${response.status}`)
  }

  const data = await response.json()
  
  if (data['Error Message']) {
    throw new Error(data['Error Message'])
  }

  return data
}

export async function fetchFMPFinancials(
  ticker: string
): Promise<DataSourceResult<CompanyFinancials>> {
  const cacheKey = getCacheKey('fmp_fundamentals', ticker)

  try {
    const result = await fetchWithCache<CompanyFinancials>(
      cacheKey,
      async () => {
        // Fetch all data in parallel
        const [profiles, income, balance, cashflow, metrics] = await Promise.all([
          fetchFMPEndpoint<FMPCompanyProfile[]>(`/profile/${ticker}`),
          fetchFMPEndpoint<FMPIncomeStatement[]>(`/income-statement/${ticker}?limit=1`),
          fetchFMPEndpoint<FMPBalanceSheet[]>(`/balance-sheet-statement/${ticker}?limit=1`),
          fetchFMPEndpoint<FMPCashFlow[]>(`/cash-flow-statement/${ticker}?limit=1`),
          fetchFMPEndpoint<FMPKeyMetrics[]>(`/key-metrics/${ticker}?limit=1`),
        ])

        const profile = profiles[0]
        const latestIncome = income[0]
        const latestBalance = balance[0]
        const latestCashflow = cashflow[0]
        const latestMetrics = metrics[0]

        if (!profile) {
          throw new Error('Company not found')
        }

        const data: CompanyFinancials = {
          ticker: profile.symbol,
          companyName: profile.companyName,
          exchange: profile.exchangeShortName || profile.exchange,
          sector: profile.sector,
          industry: profile.industry,
          country: profile.country,

          revenue: latestIncome?.revenue ?? null,
          revenueGrowthYoY: latestMetrics?.revenueGrowth ? latestMetrics.revenueGrowth * 100 : null,
          grossProfit: latestIncome?.grossProfit ?? null,
          grossMargin: latestMetrics?.grossProfitMargin ? latestMetrics.grossProfitMargin * 100 : null,
          operatingIncome: latestIncome?.operatingIncome ?? null,
          operatingMargin: latestMetrics?.operatingProfitMargin ? latestMetrics.operatingProfitMargin * 100 : null,
          netIncome: latestIncome?.netIncome ?? null,
          netMargin: latestMetrics?.netProfitMargin ? latestMetrics.netProfitMargin * 100 : null,
          ebitda: latestIncome?.ebitda ?? null,

          totalAssets: latestBalance?.totalAssets ?? null,
          totalLiabilities: latestBalance?.totalLiabilities ?? null,
          totalEquity: latestBalance?.totalStockholdersEquity ?? null,
          cash: latestBalance?.cashAndCashEquivalents ?? null,
          totalDebt: latestBalance?.totalDebt ?? null,
          currentAssets: latestBalance?.totalCurrentAssets ?? null,
          currentLiabilities: latestBalance?.totalCurrentLiabilities ?? null,

          operatingCashFlow: latestCashflow?.operatingCashFlow ?? null,
          freeCashFlow: latestCashflow?.freeCashFlow ?? null,
          capitalExpenditures: latestCashflow?.capitalExpenditure ? Math.abs(latestCashflow.capitalExpenditure) : null,

          eps: latestIncome?.epsdiluted ?? latestIncome?.eps ?? null,
          bookValuePerShare: latestMetrics?.bookValuePerShare ?? null,
          revenuePerShare: latestMetrics?.revenuePerShare ?? null,

          employeeCount: profile.fullTimeEmployees ? parseInt(profile.fullTimeEmployees) : null,

          marketCap: profile.mktCap ?? null,
          enterpriseValue: latestMetrics?.enterpriseValue ?? null,
          peRatio: latestMetrics?.peRatio ?? null,
          pbRatio: latestMetrics?.priceToBookRatio ?? null,
          psRatio: latestMetrics?.priceToSalesRatio ?? null,
          evToEbitda: latestMetrics?.evToEbitda ?? null,

          returnOnEquity: latestMetrics?.roe ? latestMetrics.roe * 100 : null,
          returnOnAssets: latestMetrics?.roa ? latestMetrics.roa * 100 : null,
          returnOnCapital: latestMetrics?.roic ? latestMetrics.roic * 100 : null,

          currentRatio: latestMetrics?.currentRatio ?? null,
          quickRatio: latestMetrics?.quickRatio ?? null,

          debtToEquity: latestMetrics?.debtToEquity ?? null,
          debtToAssets: latestMetrics?.debtToAssets ? latestMetrics.debtToAssets * 100 : null,

          fiscalYearEnd: latestIncome?.date ?? null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'financial-modeling-prep',
          dataQuality: 'high',
        }

        return { data, source: 'financial-modeling-prep' as const }
      },
      CACHE_DURATIONS.fundamentals
    )

    return {
      data: result.data,
      source: result.source,
      timestamp: Date.now(),
      cached: result.cached,
    }
  } catch (error) {
    return {
      data: null,
      source: 'financial-modeling-prep',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Search for companies by name
 */
export async function searchFMPCompanies(
  query: string
): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
  try {
    const results = await fetchFMPEndpoint<Array<{
      symbol: string
      name: string
      exchangeShortName: string
    }>>(`/search?query=${encodeURIComponent(query)}&limit=10`)

    return results.map(r => ({
      symbol: r.symbol,
      name: r.name,
      exchange: r.exchangeShortName,
    }))
  } catch {
    return []
  }
}
