/**
 * IEX Cloud Data Source
 * Free tier: 50,000 credits/month
 * US stocks with real-time data
 */

import type { CompanyFinancials, DataSourceResult } from './types'
import { API_KEYS, CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const BASE_URL = 'https://cloud.iexapis.com/stable'

interface IEXCompany {
  symbol: string
  companyName: string
  exchange: string
  industry: string
  sector: string
  employees: number
  country: string
}

interface IEXFinancials {
  symbol: string
  financials: Array<{
    reportDate: string
    fiscalDate: string
    totalRevenue: number
    grossProfit: number
    operatingIncome: number
    netIncome: number
    totalAssets: number
    totalLiabilities: number
    shareholderEquity: number
    cashFlow: number
    totalCash: number
    totalDebt: number
    currentAssets: number
    currentDebt: number
    ebitda: number
  }>
}

interface IEXKeyStats {
  companyName: string
  marketcap: number
  week52high: number
  week52low: number
  sharesOutstanding: number
  ttmEPS: number
  ttmDividendRate: number
  peRatio: number
  beta: number
  employees: number
  nextEarningsDate: string
}

interface IEXAdvancedStats {
  totalCash: number
  currentDebt: number
  revenue: number
  grossProfit: number
  totalRevenue: number
  ebitda: number
  revenuePerShare: number
  revenuePerEmployee: number
  debtToEquity: number
  profitMargin: number
  enterpriseValue: number
  enterpriseValueToRevenue: number
  priceToSales: number
  priceToBook: number
  forwardPERatio: number
  pegRatio: number
  returnOnEquity: number
  returnOnAssets: number
  returnOnCapital: number
  currentRatio: number
  quickRatio: number
}

async function fetchIEXEndpoint<T>(endpoint: string): Promise<T> {
  const apiKey = API_KEYS.iexCloud
  if (!apiKey) {
    throw new Error('IEX Cloud API key not configured')
  }

  const separator = endpoint.includes('?') ? '&' : '?'
  const url = `${BASE_URL}${endpoint}${separator}token=${apiKey}`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`IEX Cloud error: ${response.status}`)
  }

  return response.json()
}

export async function fetchIEXFinancials(
  ticker: string
): Promise<DataSourceResult<CompanyFinancials>> {
  const cacheKey = getCacheKey('iex_fundamentals', ticker)

  try {
    const result = await fetchWithCache<CompanyFinancials>(
      cacheKey,
      async () => {
        // Fetch all data in parallel
        const [company, financials, keyStats, advStats] = await Promise.all([
          fetchIEXEndpoint<IEXCompany>(`/stock/${ticker}/company`),
          fetchIEXEndpoint<IEXFinancials>(`/stock/${ticker}/financials?last=1`),
          fetchIEXEndpoint<IEXKeyStats>(`/stock/${ticker}/stats`),
          fetchIEXEndpoint<IEXAdvancedStats>(`/stock/${ticker}/advanced-stats`).catch(() => null),
        ])

        const latestFinancial = financials?.financials?.[0]

        const data: CompanyFinancials = {
          ticker: company.symbol,
          companyName: company.companyName,
          exchange: company.exchange,
          sector: company.sector,
          industry: company.industry,
          country: company.country,

          revenue: latestFinancial?.totalRevenue ?? advStats?.totalRevenue ?? null,
          revenueGrowthYoY: null, // Not directly available
          grossProfit: latestFinancial?.grossProfit ?? advStats?.grossProfit ?? null,
          grossMargin: null,
          operatingIncome: latestFinancial?.operatingIncome ?? null,
          operatingMargin: null,
          netIncome: latestFinancial?.netIncome ?? null,
          netMargin: advStats?.profitMargin ? advStats.profitMargin * 100 : null,
          ebitda: latestFinancial?.ebitda ?? advStats?.ebitda ?? null,

          totalAssets: latestFinancial?.totalAssets ?? null,
          totalLiabilities: latestFinancial?.totalLiabilities ?? null,
          totalEquity: latestFinancial?.shareholderEquity ?? null,
          cash: latestFinancial?.totalCash ?? advStats?.totalCash ?? null,
          totalDebt: latestFinancial?.totalDebt ?? null,
          currentAssets: latestFinancial?.currentAssets ?? null,
          currentLiabilities: latestFinancial?.currentDebt ?? advStats?.currentDebt ?? null,

          operatingCashFlow: latestFinancial?.cashFlow ?? null,
          freeCashFlow: null,
          capitalExpenditures: null,

          eps: keyStats?.ttmEPS ?? null,
          bookValuePerShare: null,
          revenuePerShare: advStats?.revenuePerShare ?? null,

          employeeCount: company.employees ?? keyStats?.employees ?? null,

          marketCap: keyStats?.marketcap ?? null,
          enterpriseValue: advStats?.enterpriseValue ?? null,
          peRatio: keyStats?.peRatio ?? null,
          pbRatio: advStats?.priceToBook ?? null,
          psRatio: advStats?.priceToSales ?? null,
          evToEbitda: null,

          returnOnEquity: advStats?.returnOnEquity ? advStats.returnOnEquity * 100 : null,
          returnOnAssets: advStats?.returnOnAssets ? advStats.returnOnAssets * 100 : null,
          returnOnCapital: advStats?.returnOnCapital ? advStats.returnOnCapital * 100 : null,

          currentRatio: advStats?.currentRatio ?? null,
          quickRatio: advStats?.quickRatio ?? null,

          debtToEquity: advStats?.debtToEquity ?? null,
          debtToAssets: null,

          fiscalYearEnd: latestFinancial?.fiscalDate ?? null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'iex-cloud',
          dataQuality: 'high',
        }

        return { data, source: 'iex-cloud' as const }
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
      source: 'iex-cloud',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
