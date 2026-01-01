import axios from 'axios'
import type { FundamentalData, Industry } from './types'
import { getIndustryETF } from './stock-api'

/**
 * Yahoo Finance API (using unofficial endpoints - no API key required)
 * Note: These endpoints may change. For production, consider yfinance Python wrapper
 * or a paid service like Financial Modeling Prep
 */

interface YahooQuoteResponse {
  quoteResponse: {
    result: Array<{
      symbol: string
      shortName?: string
      longName?: string
      regularMarketPrice: number
      regularMarketChange: number
      regularMarketChangePercent: number
      marketCap: number
      trailingPE?: number
      forwardPE?: number
      priceToBook?: number
      dividendYield?: number
      fiftyTwoWeekHigh: number
      fiftyTwoWeekLow: number
      averageVolume: number
      trailingAnnualDividendRate?: number
      trailingAnnualDividendYield?: number
      epsTrailingTwelveMonths?: number
      epsCurrentYear?: number
      priceToSalesTrailing12Months?: number
      enterpriseValue?: number
      profitMargins?: number
      operatingMargins?: number
      returnOnAssets?: number
      returnOnEquity?: number
      totalRevenue?: number
      revenuePerShare?: number
      revenueGrowth?: number
      grossProfits?: number
      freeCashflow?: number
      operatingCashflow?: number
      earningsGrowth?: number
      currentRatio?: number
      debtToEquity?: number
      totalCash?: number
      totalDebt?: number
      totalAssets?: number
      totalLiabilities?: number
      bookValue?: number
      sharesOutstanding?: number
    }>
  }
}

/**
 * Fetch comprehensive fundamental data from Yahoo Finance
 * Uses public Yahoo Finance endpoints (no API key required)
 */
export async function fetchFundamentals(
  ticker: string
): Promise<FundamentalData | null> {
  try {
    // Yahoo Finance quote endpoint with fundamental modules
    const response = await axios.get<YahooQuoteResponse>(
      `https://query1.finance.yahoo.com/v7/finance/quote`,
      {
        params: {
          symbols: ticker,
          fields: 'symbol,shortName,longName,regularMarketPrice,marketCap,trailingPE,priceToBook,epsTrailingTwelveMonths,profitMargins,operatingMargins,returnOnAssets,returnOnEquity,totalRevenue,revenueGrowth,freeCashflow,operatingCashflow,earningsGrowth,currentRatio,debtToEquity,totalCash,totalDebt,totalAssets,bookValue,sharesOutstanding,priceToSalesTrailing12Months,enterpriseValue',
        },
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      }
    )

    const quote = response.data.quoteResponse?.result?.[0]
    if (!quote) {
      console.warn(`No fundamental data found for ticker: ${ticker}`)
      return null
    }

    // Calculate derived metrics
    const revenue = quote.totalRevenue || 0
    const grossProfit = quote.grossProfits || 0
    const operatingIncome = revenue * (quote.operatingMargins || 0)
    const netIncome = revenue * (quote.profitMargins || 0)
    const totalEquity = (quote.totalAssets || 0) - (quote.totalLiabilities || 0)
    const freeCashFlow = quote.freeCashflow || 0
    const operatingCashFlow = quote.operatingCashflow || 0
    const sharesOutstanding = quote.sharesOutstanding || 1
    const evToEbitda = quote.enterpriseValue && operatingIncome 
      ? quote.enterpriseValue / operatingIncome 
      : null

    const fundamentalData: FundamentalData = {
      ticker: quote.symbol,
      companyName: quote.longName || quote.shortName || ticker,
      lastUpdated: new Date().toISOString().split('T')[0],
      dataSource: 'company',
      
      // Income Statement
      revenue: revenue,
      revenueGrowthYoY: (quote.revenueGrowth || 0) * 100,
      grossProfit: grossProfit,
      grossMargin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
      operatingIncome: operatingIncome,
      operatingMargin: (quote.operatingMargins || 0) * 100,
      netIncome: netIncome,
      netMargin: (quote.profitMargins || 0) * 100,
      eps: quote.epsTrailingTwelveMonths || 0,
      epsGrowthYoY: (quote.earningsGrowth || 0) * 100,
      
      // Balance Sheet
      totalAssets: quote.totalAssets || 0,
      totalLiabilities: quote.totalLiabilities || 0,
      totalEquity: totalEquity,
      cash: quote.totalCash || 0,
      debt: quote.totalDebt || 0,
      debtToEquity: quote.debtToEquity || 0,
      currentRatio: quote.currentRatio || 0,
      
      // Cash Flow
      operatingCashFlow: operatingCashFlow,
      freeCashFlow: freeCashFlow,
      freeCashFlowPerShare: sharesOutstanding > 0 ? freeCashFlow / sharesOutstanding : 0,
      freeCashFlowYield: quote.marketCap > 0 ? (freeCashFlow / quote.marketCap) * 100 : 0,
      
      // Valuation
      marketCap: quote.marketCap || 0,
      enterpriseValue: quote.enterpriseValue || 0,
      peRatio: quote.trailingPE || null,
      priceToBook: quote.priceToBook || 0,
      priceToSales: quote.priceToSalesTrailing12Months || 0,
      evToEbitda: evToEbitda,
      
      // Profitability
      returnOnEquity: (quote.returnOnEquity || 0) * 100,
      returnOnAssets: (quote.returnOnAssets || 0) * 100,
      returnOnInvestedCapital: totalEquity + (quote.totalDebt || 0) > 0
        ? (netIncome / (totalEquity + (quote.totalDebt || 0))) * 100
        : 0,
    }

    return fundamentalData
  } catch (error) {
    console.error('Error fetching fundamental data from Yahoo Finance:', error)
    return null
  }
}

/**
 * Fetch ETF fundamentals as proxy for industry averages
 * Primary data source when company data unavailable
 */
export async function fetchETFFundamentals(
  industry: Industry
): Promise<FundamentalData | null> {
  const etfTicker = getIndustryETF(industry)
  
  try {
    const etfData = await fetchFundamentals(etfTicker)
    if (etfData) {
      // Mark as industry data
      etfData.dataSource = 'industry-etf'
      etfData.companyName = `${getIndustryName(industry)} Sector Average (${etfTicker})`
    }
    return etfData
  } catch (error) {
    console.error(`Error fetching ETF fundamentals for ${etfTicker}:`, error)
    return null
  }
}

/**
 * Get hard-coded industry benchmark fundamentals as fallback
 * Based on S&P 500 sector averages and industry research
 */
export function getHardcodedIndustryBenchmarks(industry: Industry): FundamentalData {
  const benchmarks: Record<Industry, Omit<FundamentalData, 'ticker' | 'companyName' | 'lastUpdated' | 'dataSource'>> = {
    technology: {
      revenue: 50000000000, // $50B average
      revenueGrowthYoY: 12.5,
      grossProfit: 30000000000,
      grossMargin: 60.0,
      operatingIncome: 12500000000,
      operatingMargin: 25.0,
      netIncome: 10000000000,
      netMargin: 20.0,
      eps: 5.50,
      epsGrowthYoY: 15.0,
      
      totalAssets: 100000000000,
      totalLiabilities: 40000000000,
      totalEquity: 60000000000,
      cash: 20000000000,
      debt: 15000000000,
      debtToEquity: 0.25,
      currentRatio: 2.0,
      
      operatingCashFlow: 15000000000,
      freeCashFlow: 12000000000,
      freeCashFlowPerShare: 6.00,
      freeCashFlowYield: 4.0,
      
      marketCap: 300000000000,
      enterpriseValue: 295000000000,
      peRatio: 30.0,
      priceToBook: 5.0,
      priceToSales: 6.0,
      evToEbitda: 20.0,
      
      returnOnEquity: 18.0,
      returnOnAssets: 10.0,
      returnOnInvestedCapital: 15.0,
    },
    banking: {
      revenue: 30000000000,
      revenueGrowthYoY: 5.5,
      grossProfit: 18000000000,
      grossMargin: 60.0,
      operatingIncome: 9000000000,
      operatingMargin: 30.0,
      netIncome: 7000000000,
      netMargin: 23.3,
      eps: 4.20,
      epsGrowthYoY: 8.0,
      
      totalAssets: 500000000000,
      totalLiabilities: 450000000000,
      totalEquity: 50000000000,
      cash: 50000000000,
      debt: 100000000000,
      debtToEquity: 2.0,
      currentRatio: 1.1,
      
      operatingCashFlow: 12000000000,
      freeCashFlow: 10000000000,
      freeCashFlowPerShare: 6.00,
      freeCashFlowYield: 6.7,
      
      marketCap: 150000000000,
      enterpriseValue: 200000000000,
      peRatio: 12.0,
      priceToBook: 1.2,
      priceToSales: 5.0,
      evToEbitda: 10.0,
      
      returnOnEquity: 12.0,
      returnOnAssets: 1.4,
      returnOnInvestedCapital: 8.0,
    },
    retail: {
      revenue: 25000000000,
      revenueGrowthYoY: 8.0,
      grossProfit: 7500000000,
      grossMargin: 30.0,
      operatingIncome: 2000000000,
      operatingMargin: 8.0,
      netIncome: 1500000000,
      netMargin: 6.0,
      eps: 3.50,
      epsGrowthYoY: 10.0,
      
      totalAssets: 40000000000,
      totalLiabilities: 25000000000,
      totalEquity: 15000000000,
      cash: 3000000000,
      debt: 8000000000,
      debtToEquity: 0.53,
      currentRatio: 1.5,
      
      operatingCashFlow: 4000000000,
      freeCashFlow: 2500000000,
      freeCashFlowPerShare: 5.80,
      freeCashFlowYield: 5.0,
      
      marketCap: 50000000000,
      enterpriseValue: 55000000000,
      peRatio: 18.0,
      priceToBook: 3.3,
      priceToSales: 2.0,
      evToEbitda: 12.0,
      
      returnOnEquity: 15.0,
      returnOnAssets: 3.8,
      returnOnInvestedCapital: 10.0,
    },
    manufacturing: {
      revenue: 40000000000,
      revenueGrowthYoY: 6.5,
      grossProfit: 12000000000,
      grossMargin: 30.0,
      operatingIncome: 4800000000,
      operatingMargin: 12.0,
      netIncome: 3200000000,
      netMargin: 8.0,
      eps: 4.00,
      epsGrowthYoY: 9.0,
      
      totalAssets: 80000000000,
      totalLiabilities: 50000000000,
      totalEquity: 30000000000,
      cash: 5000000000,
      debt: 20000000000,
      debtToEquity: 0.67,
      currentRatio: 1.8,
      
      operatingCashFlow: 6000000000,
      freeCashFlow: 4000000000,
      freeCashFlowPerShare: 5.00,
      freeCashFlowYield: 4.5,
      
      marketCap: 90000000000,
      enterpriseValue: 105000000000,
      peRatio: 16.0,
      priceToBook: 3.0,
      priceToSales: 2.3,
      evToEbitda: 13.0,
      
      returnOnEquity: 13.3,
      returnOnAssets: 4.0,
      returnOnInvestedCapital: 9.0,
    },
    general: {
      // S&P 500 averages
      revenue: 35000000000,
      revenueGrowthYoY: 8.0,
      grossProfit: 14000000000,
      grossMargin: 40.0,
      operatingIncome: 5250000000,
      operatingMargin: 15.0,
      netIncome: 3500000000,
      netMargin: 10.0,
      eps: 4.50,
      epsGrowthYoY: 10.0,
      
      totalAssets: 100000000000,
      totalLiabilities: 60000000000,
      totalEquity: 40000000000,
      cash: 10000000000,
      debt: 25000000000,
      debtToEquity: 0.63,
      currentRatio: 1.5,
      
      operatingCashFlow: 7000000000,
      freeCashFlow: 5000000000,
      freeCashFlowPerShare: 6.50,
      freeCashFlowYield: 4.5,
      
      marketCap: 110000000000,
      enterpriseValue: 125000000000,
      peRatio: 20.0,
      priceToBook: 3.5,
      priceToSales: 3.1,
      evToEbitda: 14.0,
      
      returnOnEquity: 15.0,
      returnOnAssets: 5.0,
      returnOnInvestedCapital: 10.0,
    },
  }

  const benchmark = benchmarks[industry]
  return {
    ...benchmark,
    ticker: getIndustryETF(industry),
    companyName: `${getIndustryName(industry)} Industry Average`,
    lastUpdated: new Date().toISOString().split('T')[0],
    dataSource: 'hardcoded',
  }
}

/**
 * Smart fundamental data fetcher with fallback cascade:
 * 1. Try company ticker
 * 2. Try industry ETF
 * 3. Use hard-coded benchmarks
 */
export async function fetchFundamentalsWithFallback(
  ticker: string | undefined,
  industry: Industry,
  isPrivateCompany: boolean = false
): Promise<{ data: FundamentalData; usingFallback: boolean }> {
  // If manually flagged as private, skip company ticker
  if (!isPrivateCompany && ticker) {
    try {
      const companyData = await fetchFundamentals(ticker)
      if (companyData) {
        return { data: companyData, usingFallback: false }
      }
    } catch (error) {
      console.warn(`Company ticker ${ticker} failed, trying ETF fallback`)
    }
  }

  // Try ETF fundamentals as primary fallback
  try {
    const etfData = await fetchETFFundamentals(industry)
    if (etfData) {
      return { data: etfData, usingFallback: true }
    }
  } catch (error) {
    console.warn(`ETF fallback failed, using hard-coded benchmarks`)
  }

  // Final fallback: hard-coded industry benchmarks
  const hardcodedData = getHardcodedIndustryBenchmarks(industry)
  return { data: hardcodedData, usingFallback: true }
}

/**
 * Calculate financial health score (0-100) based on fundamental metrics
 */
export function calculateFinancialHealthScore(fundamentals: FundamentalData): number {
  let score = 0
  
  // Profitability (30 points)
  if (fundamentals.netMargin > 20) score += 10
  else if (fundamentals.netMargin > 10) score += 7
  else if (fundamentals.netMargin > 0) score += 4
  
  if (fundamentals.returnOnEquity > 15) score += 10
  else if (fundamentals.returnOnEquity > 10) score += 7
  else if (fundamentals.returnOnEquity > 5) score += 4
  
  if (fundamentals.operatingMargin > 20) score += 10
  else if (fundamentals.operatingMargin > 10) score += 7
  else if (fundamentals.operatingMargin > 0) score += 4
  
  // Liquidity (20 points)
  if (fundamentals.currentRatio > 2) score += 10
  else if (fundamentals.currentRatio > 1.5) score += 7
  else if (fundamentals.currentRatio > 1) score += 4
  
  if (fundamentals.freeCashFlowYield > 5) score += 10
  else if (fundamentals.freeCashFlowYield > 3) score += 7
  else if (fundamentals.freeCashFlowYield > 0) score += 4
  
  // Leverage (20 points)
  if (fundamentals.debtToEquity < 0.5) score += 10
  else if (fundamentals.debtToEquity < 1) score += 7
  else if (fundamentals.debtToEquity < 2) score += 4
  
  const cashToDebt = fundamentals.debt > 0 ? fundamentals.cash / fundamentals.debt : 1
  if (cashToDebt > 0.5) score += 10
  else if (cashToDebt > 0.3) score += 7
  else if (cashToDebt > 0.1) score += 4
  
  // Growth (30 points)
  if (fundamentals.revenueGrowthYoY > 20) score += 10
  else if (fundamentals.revenueGrowthYoY > 10) score += 7
  else if (fundamentals.revenueGrowthYoY > 5) score += 4
  
  if (fundamentals.epsGrowthYoY > 20) score += 10
  else if (fundamentals.epsGrowthYoY > 10) score += 7
  else if (fundamentals.epsGrowthYoY > 5) score += 4
  
  if (fundamentals.freeCashFlow > 0 && fundamentals.operatingCashFlow > 0) {
    const fcfConversion = fundamentals.freeCashFlow / fundamentals.operatingCashFlow
    if (fcfConversion > 0.8) score += 10
    else if (fcfConversion > 0.6) score += 7
    else if (fcfConversion > 0.4) score += 4
  }
  
  return Math.min(100, Math.max(0, score))
}

// Helper functions
function getIndustryName(industry: Industry): string {
  const names: Record<Industry, string> = {
    technology: 'Technology',
    banking: 'Banking & Financial Services',
    retail: 'Retail',
    manufacturing: 'Manufacturing & Industrial',
    general: 'General Market (S&P 500)',
  }
  return names[industry]
}
