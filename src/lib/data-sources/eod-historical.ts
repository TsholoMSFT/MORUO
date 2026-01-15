/**
 * EOD Historical Data Source
 * Free tier: 20 API calls per day
 * Global coverage (70+ exchanges)
 */

import type { CompanyFinancials, DataSourceResult } from './types'
import { API_KEYS, CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const BASE_URL = 'https://eodhd.com/api'

interface EODFundamentals {
  General: {
    Code: string
    Name: string
    Exchange: string
    CurrencyCode: string
    CountryName: string
    Sector: string
    Industry: string
    FullTimeEmployees: number
    FiscalYearEnd: string
  }
  Highlights: {
    MarketCapitalization: number
    EBITDA: number
    PERatio: number
    PEGRatio: number
    WallStreetTargetPrice: number
    BookValue: number
    DividendShare: number
    DividendYield: number
    EarningsShare: number
    EPSEstimateCurrentYear: number
    EPSEstimateNextYear: number
    MostRecentQuarter: string
    ProfitMargin: number
    OperatingMarginTTM: number
    ReturnOnAssetsTTM: number
    ReturnOnEquityTTM: number
    RevenueTTM: number
    RevenuePerShareTTM: number
    QuarterlyRevenueGrowthYOY: number
    GrossProfitTTM: number
    DilutedEpsTTM: number
  }
  Valuation: {
    TrailingPE: number
    ForwardPE: number
    PriceSalesTTM: number
    PriceBookMRQ: number
    EnterpriseValue: number
    EnterpriseValueRevenue: number
    EnterpriseValueEbitda: number
  }
  Financials: {
    Balance_Sheet: {
      yearly: Record<string, {
        date: string
        totalAssets: string
        totalLiab: string
        totalStockholderEquity: string
        cash: string
        shortLongTermDebt: string
        longTermDebt: string
        totalCurrentAssets: string
        totalCurrentLiabilities: string
      }>
    }
    Cash_Flow: {
      yearly: Record<string, {
        date: string
        totalCashFromOperatingActivities: string
        capitalExpenditures: string
        freeCashFlow: string
      }>
    }
    Income_Statement: {
      yearly: Record<string, {
        date: string
        totalRevenue: string
        grossProfit: string
        operatingIncome: string
        netIncome: string
        ebitda: string
      }>
    }
  }
}

function parseNumber(value: string | number | undefined): number | null {
  if (value === undefined || value === null || value === '') return null
  const num = typeof value === 'string' ? parseFloat(value) : value
  return isNaN(num) ? null : num
}

export async function fetchEODFinancials(
  ticker: string,
  exchange: string = 'US'
): Promise<DataSourceResult<CompanyFinancials>> {
  const cacheKey = getCacheKey('eod_fundamentals', `${ticker}_${exchange}`)

  try {
    const result = await fetchWithCache<CompanyFinancials>(
      cacheKey,
      async () => {
        const apiKey = API_KEYS.eodHistorical
        if (!apiKey) {
          throw new Error('EOD Historical Data API key not configured')
        }

        const symbol = `${ticker}.${exchange}`
        const url = `${BASE_URL}/fundamentals/${symbol}?api_token=${apiKey}&fmt=json`

        const response = await fetch(url)
        if (!response.ok) {
          throw new Error(`EOD API error: ${response.status}`)
        }

        const data: EODFundamentals = await response.json()

        const general = data.General
        const highlights = data.Highlights
        const valuation = data.Valuation

        // Get latest annual financial statements
        const incomeYears = Object.keys(data.Financials?.Income_Statement?.yearly || {}).sort().reverse()
        const balanceYears = Object.keys(data.Financials?.Balance_Sheet?.yearly || {}).sort().reverse()
        const cashflowYears = Object.keys(data.Financials?.Cash_Flow?.yearly || {}).sort().reverse()

        const latestIncome = incomeYears[0] ? data.Financials.Income_Statement.yearly[incomeYears[0]] : null
        const latestBalance = balanceYears[0] ? data.Financials.Balance_Sheet.yearly[balanceYears[0]] : null
        const latestCashflow = cashflowYears[0] ? data.Financials.Cash_Flow.yearly[cashflowYears[0]] : null

        const shortTermDebt = parseNumber(latestBalance?.shortLongTermDebt) ?? 0
        const longTermDebt = parseNumber(latestBalance?.longTermDebt) ?? 0

        const financials: CompanyFinancials = {
          ticker: general.Code,
          companyName: general.Name,
          exchange: general.Exchange,
          sector: general.Sector,
          industry: general.Industry,
          country: general.CountryName,

          revenue: parseNumber(latestIncome?.totalRevenue) ?? highlights.RevenueTTM,
          revenueGrowthYoY: highlights.QuarterlyRevenueGrowthYOY,
          grossProfit: parseNumber(latestIncome?.grossProfit) ?? highlights.GrossProfitTTM,
          grossMargin: null,
          operatingIncome: parseNumber(latestIncome?.operatingIncome),
          operatingMargin: highlights.OperatingMarginTTM,
          netIncome: parseNumber(latestIncome?.netIncome),
          netMargin: highlights.ProfitMargin,
          ebitda: parseNumber(latestIncome?.ebitda) ?? highlights.EBITDA,

          totalAssets: parseNumber(latestBalance?.totalAssets),
          totalLiabilities: parseNumber(latestBalance?.totalLiab),
          totalEquity: parseNumber(latestBalance?.totalStockholderEquity),
          cash: parseNumber(latestBalance?.cash),
          totalDebt: shortTermDebt + longTermDebt > 0 ? shortTermDebt + longTermDebt : null,
          currentAssets: parseNumber(latestBalance?.totalCurrentAssets),
          currentLiabilities: parseNumber(latestBalance?.totalCurrentLiabilities),

          operatingCashFlow: parseNumber(latestCashflow?.totalCashFromOperatingActivities),
          freeCashFlow: parseNumber(latestCashflow?.freeCashFlow),
          capitalExpenditures: parseNumber(latestCashflow?.capitalExpenditures),

          eps: highlights.EarningsShare ?? highlights.DilutedEpsTTM,
          bookValuePerShare: highlights.BookValue,
          revenuePerShare: highlights.RevenuePerShareTTM,

          employeeCount: general.FullTimeEmployees,

          marketCap: highlights.MarketCapitalization,
          enterpriseValue: valuation.EnterpriseValue,
          peRatio: highlights.PERatio ?? valuation.TrailingPE,
          pbRatio: valuation.PriceBookMRQ,
          psRatio: valuation.PriceSalesTTM,
          evToEbitda: valuation.EnterpriseValueEbitda,

          returnOnEquity: highlights.ReturnOnEquityTTM,
          returnOnAssets: highlights.ReturnOnAssetsTTM,
          returnOnCapital: null,

          currentRatio: null,
          quickRatio: null,

          debtToEquity: null,
          debtToAssets: null,

          fiscalYearEnd: general.FiscalYearEnd,
          lastUpdated: new Date().toISOString(),
          dataSource: 'eod-historical',
          dataQuality: 'high',
        }

        // Calculate ratios
        if (financials.currentAssets && financials.currentLiabilities) {
          financials.currentRatio = financials.currentAssets / financials.currentLiabilities
        }
        if (financials.totalDebt && financials.totalEquity) {
          financials.debtToEquity = financials.totalDebt / financials.totalEquity
        }

        return { data: financials, source: 'eod-historical' as const }
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
      source: 'eod-historical',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Search for tickers across exchanges
 */
export async function searchEODTickers(
  query: string
): Promise<Array<{ code: string; name: string; exchange: string; country: string }>> {
  try {
    const apiKey = API_KEYS.eodHistorical
    if (!apiKey) return []

    const url = `${BASE_URL}/search/${encodeURIComponent(query)}?api_token=${apiKey}&fmt=json`
    const response = await fetch(url)
    
    if (!response.ok) return []

    const results: Array<{
      Code: string
      Name: string
      Exchange: string
      Country: string
    }> = await response.json()

    return results.slice(0, 10).map(r => ({
      code: r.Code,
      name: r.Name,
      exchange: r.Exchange,
      country: r.Country,
    }))
  } catch {
    return []
  }
}
