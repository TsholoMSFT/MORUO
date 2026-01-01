import axios from 'axios'
import type { StockData, Industry } from './types'

// Using free APIs: Alpha Vantage for stock data (free tier: 25 calls/day)
// Fallback to Yahoo Finance scraping if needed
const ALPHA_VANTAGE_KEY = 'demo' // Users should replace with their own free key from alphavantage.co

// Industry index mapping for fallback when no ticker is available
const INDUSTRY_INDICES: Record<Industry, { ticker: string; name: string }> = {
  technology: { ticker: 'XLK', name: 'Technology Select Sector SPDR Fund' },
  banking: { ticker: 'XLF', name: 'Financial Select Sector SPDR Fund' },
  retail: { ticker: 'XRT', name: 'SPDR S&P Retail ETF' },
  manufacturing: { ticker: 'XLI', name: 'Industrial Select Sector SPDR Fund' },
  general: { ticker: 'SPY', name: 'S&P 500 ETF' },
}

interface AlphaVantageQuote {
  '01. symbol': string
  '02. open': string
  '03. high': string
  '04. low': string
  '05. price': string
  '06. volume': string
  '07. latest trading day': string
  '08. previous close': string
  '09. change': string
  '10. change percent': string
}

interface AlphaVantageOverview {
  Symbol: string
  Name: string
  MarketCapitalization: string
  PERatio: string
  '52WeekHigh': string
  '52WeekLow': string
}

/**
 * Fetch real-time stock quote from Alpha Vantage
 */
export async function fetchStockQuote(ticker: string): Promise<StockData | null> {
  try {
    // Alpha Vantage Global Quote endpoint
    const quoteResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: ticker,
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 5000,
    })

    const quote: AlphaVantageQuote = quoteResponse.data['Global Quote']
    
    if (!quote || !quote['05. price']) {
      console.warn(`No data found for ticker: ${ticker}`)
      return null
    }

    // Fetch company overview for additional data
    const overviewResponse = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'OVERVIEW',
        symbol: ticker,
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 5000,
    })

    const overview: AlphaVantageOverview = overviewResponse.data

    return {
      ticker: quote['01. symbol'],
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      marketCap: overview.MarketCapitalization ? parseFloat(overview.MarketCapitalization) : 0,
      peRatio: overview.PERatio && overview.PERatio !== 'None' ? parseFloat(overview.PERatio) : null,
      fiftyTwoWeekHigh: overview['52WeekHigh'] ? parseFloat(overview['52WeekHigh']) : 0,
      fiftyTwoWeekLow: overview['52WeekLow'] ? parseFloat(overview['52WeekLow']) : 0,
      volume: parseFloat(quote['06. volume']),
      lastUpdated: quote['07. latest trading day'],
      companyName: overview.Name || ticker,
    }
  } catch (error) {
    console.error('Error fetching stock data:', error)
    return null
  }
}

/**
 * Fetch industry index as fallback for private companies
 */
export async function fetchIndustryIndex(industry: Industry): Promise<StockData | null> {
  const indexInfo = INDUSTRY_INDICES[industry]
  return fetchStockQuote(indexInfo.ticker)
}

/**
 * Get industry index information without fetching live data
 */
export function getIndustryIndexInfo(industry: Industry) {
  return INDUSTRY_INDICES[industry]
}

/**
 * Get industry ETF ticker for a given industry
 */
export function getIndustryETF(industry: Industry): string {
  return INDUSTRY_INDICES[industry].ticker
}

/**
 * Validate if a ticker symbol is valid (basic check)
 */
export function isValidTicker(ticker: string): boolean {
  // Basic validation: 1-5 uppercase letters
  return /^[A-Z]{1,5}$/.test(ticker.trim().toUpperCase())
}

/**
 * Search for ticker symbol by company name (simplified version)
 * In production, use Alpha Vantage SYMBOL_SEARCH or similar API
 */
export async function searchTicker(companyName: string): Promise<{ ticker: string; name: string }[]> {
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: companyName,
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 5000,
    })

    const matches = response.data.bestMatches || []
    return matches.slice(0, 5).map((match: any) => ({
      ticker: match['1. symbol'],
      name: match['2. name'],
    }))
  } catch (error) {
    console.error('Error searching ticker:', error)
    return []
  }
}

/**
 * Format market cap to readable string (e.g., $1.2B, $500M)
 */
export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1e12) {
    return `$${(marketCap / 1e12).toFixed(2)}T`
  } else if (marketCap >= 1e9) {
    return `$${(marketCap / 1e9).toFixed(2)}B`
  } else if (marketCap >= 1e6) {
    return `$${(marketCap / 1e6).toFixed(2)}M`
  } else {
    return `$${marketCap.toFixed(0)}`
  }
}

/**
 * Format large numbers with commas
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US', { maximumFractionDigits: 2 })
}
