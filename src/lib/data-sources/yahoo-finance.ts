/**
 * Yahoo Finance Data Source
 * Uses unofficial public endpoints - no API key required
 */

import type { CompanyFinancials, DataSourceResult } from './types'
import { getCacheKey, fetchWithCache, CACHE_DURATIONS } from './cache'

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v10/finance'

interface YahooQuoteSummary {
  quoteSummary?: {
    result?: Array<{
      summaryProfile?: {
        sector?: string
        industry?: string
        country?: string
        fullTimeEmployees?: number
      }
      financialData?: {
        currentPrice?: { raw: number }
        totalRevenue?: { raw: number }
        revenueGrowth?: { raw: number }
        grossMargins?: { raw: number }
        operatingMargins?: { raw: number }
        profitMargins?: { raw: number }
        ebitda?: { raw: number }
        totalCash?: { raw: number }
        totalDebt?: { raw: number }
        freeCashflow?: { raw: number }
        operatingCashflow?: { raw: number }
        returnOnEquity?: { raw: number }
        returnOnAssets?: { raw: number }
        currentRatio?: { raw: number }
        quickRatio?: { raw: number }
        debtToEquity?: { raw: number }
      }
      defaultKeyStatistics?: {
        enterpriseValue?: { raw: number }
        trailingPE?: { raw: number }
        priceToBook?: { raw: number }
        enterpriseToEbitda?: { raw: number }
        bookValue?: { raw: number }
        sharesOutstanding?: { raw: number }
      }
      incomeStatementHistory?: {
        incomeStatementHistory?: Array<{
          totalRevenue?: { raw: number }
          grossProfit?: { raw: number }
          operatingIncome?: { raw: number }
          netIncome?: { raw: number }
        }>
      }
      balanceSheetHistory?: {
        balanceSheetStatements?: Array<{
          totalAssets?: { raw: number }
          totalLiab?: { raw: number }
          totalStockholderEquity?: { raw: number }
          totalCurrentAssets?: { raw: number }
          totalCurrentLiabilities?: { raw: number }
        }>
      }
      cashflowStatementHistory?: {
        cashflowStatements?: Array<{
          totalCashFromOperatingActivities?: { raw: number }
          capitalExpenditures?: { raw: number }
        }>
      }
      price?: {
        shortName?: string
        longName?: string
        marketCap?: { raw: number }
        exchangeName?: string
      }
      summaryDetail?: {
        trailingPE?: { raw: number }
        priceToSalesTrailing12Months?: { raw: number }
      }
      earningsHistory?: {
        history?: Array<{
          epsActual?: { raw: number }
        }>
      }
    }>
  }
}

async function fetchYahooData(ticker: string): Promise<YahooQuoteSummary> {
  const modules = [
    'summaryProfile',
    'financialData',
    'defaultKeyStatistics',
    'incomeStatementHistory',
    'balanceSheetHistory',
    'cashflowStatementHistory',
    'price',
    'summaryDetail',
    'earningsHistory',
  ].join(',')

  const url = `${YAHOO_BASE_URL}/quoteSummary/${ticker}?modules=${modules}`
  
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Yahoo Finance error: ${response.status}`)
  }

  return response.json()
}

function parseYahooResponse(data: YahooQuoteSummary, ticker: string): CompanyFinancials {
  const result = data.quoteSummary?.result?.[0]
  if (!result) {
    throw new Error('No data found for ticker')
  }

  const profile = result.summaryProfile
  const financials = result.financialData
  const keyStats = result.defaultKeyStatistics
  const income = result.incomeStatementHistory?.incomeStatementHistory?.[0]
  const balance = result.balanceSheetHistory?.balanceSheetStatements?.[0]
  const cashflow = result.cashflowStatementHistory?.cashflowStatements?.[0]
  const price = result.price
  const summary = result.summaryDetail
  const earnings = result.earningsHistory?.history?.[0]

  // Calculate revenue per share
  const revenue = income?.totalRevenue?.raw ?? financials?.totalRevenue?.raw ?? null
  const shares = keyStats?.sharesOutstanding?.raw
  const revenuePerShare = revenue && shares ? revenue / shares : null

  return {
    ticker: ticker.toUpperCase(),
    companyName: price?.longName || price?.shortName || ticker,
    exchange: price?.exchangeName || undefined,
    sector: profile?.sector || undefined,
    industry: profile?.industry || undefined,
    country: profile?.country || undefined,

    revenue,
    revenueGrowthYoY: financials?.revenueGrowth?.raw ? financials.revenueGrowth.raw * 100 : null,
    grossProfit: income?.grossProfit?.raw ?? null,
    grossMargin: financials?.grossMargins?.raw ? financials.grossMargins.raw * 100 : null,
    operatingIncome: income?.operatingIncome?.raw ?? null,
    operatingMargin: financials?.operatingMargins?.raw ? financials.operatingMargins.raw * 100 : null,
    netIncome: income?.netIncome?.raw ?? null,
    netMargin: financials?.profitMargins?.raw ? financials.profitMargins.raw * 100 : null,
    ebitda: financials?.ebitda?.raw ?? null,

    totalAssets: balance?.totalAssets?.raw ?? null,
    totalLiabilities: balance?.totalLiab?.raw ?? null,
    totalEquity: balance?.totalStockholderEquity?.raw ?? null,
    cash: financials?.totalCash?.raw ?? null,
    totalDebt: financials?.totalDebt?.raw ?? null,
    currentAssets: balance?.totalCurrentAssets?.raw ?? null,
    currentLiabilities: balance?.totalCurrentLiabilities?.raw ?? null,

    operatingCashFlow: financials?.operatingCashflow?.raw ?? cashflow?.totalCashFromOperatingActivities?.raw ?? null,
    freeCashFlow: financials?.freeCashflow?.raw ?? null,
    capitalExpenditures: cashflow?.capitalExpenditures?.raw ? Math.abs(cashflow.capitalExpenditures.raw) : null,

    eps: earnings?.epsActual?.raw ?? null,
    bookValuePerShare: keyStats?.bookValue?.raw ?? null,
    revenuePerShare,

    employeeCount: profile?.fullTimeEmployees ?? null,

    marketCap: price?.marketCap?.raw ?? null,
    enterpriseValue: keyStats?.enterpriseValue?.raw ?? null,
    peRatio: keyStats?.trailingPE?.raw ?? summary?.trailingPE?.raw ?? null,
    pbRatio: keyStats?.priceToBook?.raw ?? null,
    psRatio: summary?.priceToSalesTrailing12Months?.raw ?? null,
    evToEbitda: keyStats?.enterpriseToEbitda?.raw ?? null,

    returnOnEquity: financials?.returnOnEquity?.raw ? financials.returnOnEquity.raw * 100 : null,
    returnOnAssets: financials?.returnOnAssets?.raw ? financials.returnOnAssets.raw * 100 : null,
    returnOnCapital: null, // Not directly available

    currentRatio: financials?.currentRatio?.raw ?? null,
    quickRatio: financials?.quickRatio?.raw ?? null,

    debtToEquity: financials?.debtToEquity?.raw ?? null,
    debtToAssets: balance?.totalLiab?.raw && balance?.totalAssets?.raw
      ? (balance.totalLiab.raw / balance.totalAssets.raw) * 100
      : null,

    fiscalYearEnd: null,
    lastUpdated: new Date().toISOString(),
    dataSource: 'yahoo-finance',
    dataQuality: 'high',
  }
}

export async function fetchYahooFinancials(ticker: string): Promise<DataSourceResult<CompanyFinancials>> {
  const cacheKey = getCacheKey('yahoo_fundamentals', ticker)

  try {
    const result = await fetchWithCache<CompanyFinancials>(
      cacheKey,
      async () => {
        const rawData = await fetchYahooData(ticker)
        const parsed = parseYahooResponse(rawData, ticker)
        return { data: parsed, source: 'yahoo-finance' as const }
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
      source: 'yahoo-finance',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
