/**
 * Alpha Vantage Data Source
 * Free tier: 25 API calls per day
 */

import type { CompanyFinancials, DataSourceResult } from './types'
import { API_KEYS, CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const BASE_URL = 'https://www.alphavantage.co/query'

interface AlphaVantageOverview {
  Symbol: string
  Name: string
  Exchange: string
  Sector: string
  Industry: string
  Country: string
  MarketCapitalization: string
  EBITDA: string
  PERatio: string
  PEGRatio: string
  BookValue: string
  DividendPerShare: string
  EPS: string
  RevenuePerShareTTM: string
  ProfitMargin: string
  OperatingMarginTTM: string
  ReturnOnAssetsTTM: string
  ReturnOnEquityTTM: string
  RevenueTTM: string
  GrossProfitTTM: string
  QuarterlyEarningsGrowthYOY: string
  QuarterlyRevenueGrowthYOY: string
  AnalystTargetPrice: string
  TrailingPE: string
  ForwardPE: string
  PriceToSalesRatioTTM: string
  PriceToBookRatio: string
  EVToRevenue: string
  EVToEBITDA: string
  FullTimeEmployees: string
  FiscalYearEnd: string
  LatestQuarter: string
}

interface AlphaVantageIncomeStatement {
  annualReports: Array<{
    fiscalDateEnding: string
    totalRevenue: string
    grossProfit: string
    operatingIncome: string
    netIncome: string
    ebitda: string
  }>
}

interface AlphaVantageBalanceSheet {
  annualReports: Array<{
    fiscalDateEnding: string
    totalAssets: string
    totalLiabilities: string
    totalShareholderEquity: string
    cashAndCashEquivalentsAtCarryingValue: string
    shortTermDebt: string
    longTermDebt: string
    totalCurrentAssets: string
    totalCurrentLiabilities: string
  }>
}

interface AlphaVantageCashFlow {
  annualReports: Array<{
    fiscalDateEnding: string
    operatingCashflow: string
    capitalExpenditures: string
  }>
}

function parseNumber(value: string | undefined): number | null {
  if (!value || value === 'None' || value === '-') return null
  const num = parseFloat(value)
  return isNaN(num) ? null : num
}

async function fetchAlphaVantageEndpoint<T>(
  endpoint: string,
  ticker: string
): Promise<T> {
  const apiKey = API_KEYS.alphaVantage
  if (!apiKey) {
    throw new Error('Alpha Vantage API key not configured')
  }

  const url = `${BASE_URL}?function=${endpoint}&symbol=${ticker}&apikey=${apiKey}`
  const response = await fetch(url)
  
  if (!response.ok) {
    throw new Error(`Alpha Vantage error: ${response.status}`)
  }

  const data = await response.json()
  
  // Check for rate limit or error messages
  if (data['Note'] || data['Information']) {
    throw new Error(data['Note'] || data['Information'])
  }
  if (data['Error Message']) {
    throw new Error(data['Error Message'])
  }

  return data
}

export async function fetchAlphaVantageFinancials(
  ticker: string
): Promise<DataSourceResult<CompanyFinancials>> {
  const cacheKey = getCacheKey('alphavantage_fundamentals', ticker)

  try {
    const result = await fetchWithCache<CompanyFinancials>(
      cacheKey,
      async () => {
        // Fetch all required data in parallel
        const [overview, income, balance, cashflow] = await Promise.all([
          fetchAlphaVantageEndpoint<AlphaVantageOverview>('OVERVIEW', ticker),
          fetchAlphaVantageEndpoint<AlphaVantageIncomeStatement>('INCOME_STATEMENT', ticker),
          fetchAlphaVantageEndpoint<AlphaVantageBalanceSheet>('BALANCE_SHEET', ticker),
          fetchAlphaVantageEndpoint<AlphaVantageCashFlow>('CASH_FLOW', ticker),
        ])

        const latestIncome = income.annualReports?.[0]
        const latestBalance = balance.annualReports?.[0]
        const latestCashflow = cashflow.annualReports?.[0]

        const revenue = parseNumber(latestIncome?.totalRevenue) ?? parseNumber(overview.RevenueTTM)
        const totalAssets = parseNumber(latestBalance?.totalAssets)
        const totalLiabilities = parseNumber(latestBalance?.totalLiabilities)
        const shortTermDebt = parseNumber(latestBalance?.shortTermDebt) ?? 0
        const longTermDebt = parseNumber(latestBalance?.longTermDebt) ?? 0
        const totalDebt = shortTermDebt + longTermDebt

        const data: CompanyFinancials = {
          ticker: overview.Symbol || ticker.toUpperCase(),
          companyName: overview.Name || ticker,
          exchange: overview.Exchange || undefined,
          sector: overview.Sector || undefined,
          industry: overview.Industry || undefined,
          country: overview.Country || undefined,

          revenue,
          revenueGrowthYoY: parseNumber(overview.QuarterlyRevenueGrowthYOY),
          grossProfit: parseNumber(latestIncome?.grossProfit) ?? parseNumber(overview.GrossProfitTTM),
          grossMargin: null, // Calculate if needed
          operatingIncome: parseNumber(latestIncome?.operatingIncome),
          operatingMargin: parseNumber(overview.OperatingMarginTTM),
          netIncome: parseNumber(latestIncome?.netIncome),
          netMargin: parseNumber(overview.ProfitMargin),
          ebitda: parseNumber(latestIncome?.ebitda) ?? parseNumber(overview.EBITDA),

          totalAssets,
          totalLiabilities,
          totalEquity: parseNumber(latestBalance?.totalShareholderEquity),
          cash: parseNumber(latestBalance?.cashAndCashEquivalentsAtCarryingValue),
          totalDebt: totalDebt > 0 ? totalDebt : null,
          currentAssets: parseNumber(latestBalance?.totalCurrentAssets),
          currentLiabilities: parseNumber(latestBalance?.totalCurrentLiabilities),

          operatingCashFlow: parseNumber(latestCashflow?.operatingCashflow),
          freeCashFlow: null, // Calculate from operating - capex
          capitalExpenditures: parseNumber(latestCashflow?.capitalExpenditures),

          eps: parseNumber(overview.EPS),
          bookValuePerShare: parseNumber(overview.BookValue),
          revenuePerShare: parseNumber(overview.RevenuePerShareTTM),

          employeeCount: parseNumber(overview.FullTimeEmployees),

          marketCap: parseNumber(overview.MarketCapitalization),
          enterpriseValue: null, // Can calculate
          peRatio: parseNumber(overview.PERatio),
          pbRatio: parseNumber(overview.PriceToBookRatio),
          psRatio: parseNumber(overview.PriceToSalesRatioTTM),
          evToEbitda: parseNumber(overview.EVToEBITDA),

          returnOnEquity: parseNumber(overview.ReturnOnEquityTTM),
          returnOnAssets: parseNumber(overview.ReturnOnAssetsTTM),
          returnOnCapital: null,

          currentRatio: null, // Calculate from balance sheet
          quickRatio: null,

          debtToEquity: null, // Calculate
          debtToAssets: totalDebt && totalAssets ? (totalDebt / totalAssets) * 100 : null,

          fiscalYearEnd: overview.FiscalYearEnd || null,
          lastUpdated: new Date().toISOString(),
          dataSource: 'alpha-vantage',
          dataQuality: 'high',
        }

        // Calculate free cash flow
        if (data.operatingCashFlow && data.capitalExpenditures) {
          data.freeCashFlow = data.operatingCashFlow - Math.abs(data.capitalExpenditures)
        }

        // Calculate current ratio
        if (data.currentAssets && data.currentLiabilities) {
          data.currentRatio = data.currentAssets / data.currentLiabilities
        }

        return { data, source: 'alpha-vantage' as const }
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
      source: 'alpha-vantage',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
