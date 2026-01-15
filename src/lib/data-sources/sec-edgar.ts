/**
 * SEC EDGAR Data Source
 * Free, public API - no key required
 * US public company filings (10-K, 10-Q, 8-K, etc.)
 */

import type { SECFiling, CompanyFinancials, DataSourceResult } from './types'
import { CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const BASE_URL = 'https://data.sec.gov'
const SUBMISSIONS_URL = `${BASE_URL}/submissions`
const COMPANY_FACTS_URL = `${BASE_URL}/api/xbrl/companyfacts`

// SEC requires a User-Agent header
const SEC_HEADERS = {
  'User-Agent': 'MORUO Business Value Analyzer (contact@example.com)',
  'Accept': 'application/json',
}

interface SECSubmissionsResponse {
  cik: string
  entityType: string
  sic: string
  sicDescription: string
  name: string
  tickers: string[]
  exchanges: string[]
  ein: string
  fiscalYearEnd: string
  filings: {
    recent: {
      accessionNumber: string[]
      filingDate: string[]
      reportDate: string[]
      form: string[]
      primaryDocument: string[]
      primaryDocDescription: string[]
    }
    files: Array<{ name: string; filingCount: number }>
  }
}

interface SECCompanyFacts {
  cik: number
  entityName: string
  facts: {
    'us-gaap'?: Record<string, {
      label: string
      description: string
      units: Record<string, Array<{
        end: string
        val: number
        fy: number
        fp: string
        form: string
        filed: string
      }>>
    }>
  }
}

/**
 * Convert ticker to CIK (Central Index Key)
 */
async function tickerToCIK(ticker: string): Promise<string | null> {
  try {
    // SEC provides a ticker-to-CIK mapping
    const response = await fetch(
      'https://www.sec.gov/files/company_tickers.json',
      { headers: SEC_HEADERS }
    )
    
    if (!response.ok) return null
    
    const data: Record<string, { cik_str: number; ticker: string; title: string }> = await response.json()
    
    const match = Object.values(data).find(
      company => company.ticker.toUpperCase() === ticker.toUpperCase()
    )
    
    if (match) {
      // CIK must be 10 digits, zero-padded
      return match.cik_str.toString().padStart(10, '0')
    }
    
    return null
  } catch {
    return null
  }
}

export async function fetchSECFilings(
  ticker: string,
  filingTypes: string[] = ['10-K', '10-Q', '8-K']
): Promise<DataSourceResult<SECFiling[]>> {
  const cacheKey = getCacheKey('sec_filings', `${ticker}_${filingTypes.join('-')}`)

  try {
    const result = await fetchWithCache<SECFiling[]>(
      cacheKey,
      async () => {
        const cik = await tickerToCIK(ticker)
        if (!cik) {
          throw new Error(`Could not find CIK for ticker ${ticker}`)
        }

        const response = await fetch(
          `${SUBMISSIONS_URL}/CIK${cik}.json`,
          { headers: SEC_HEADERS }
        )

        if (!response.ok) {
          throw new Error(`SEC API error: ${response.status}`)
        }

        const data: SECSubmissionsResponse = await response.json()
        const filings: SECFiling[] = []

        const recent = data.filings.recent
        for (let i = 0; i < recent.form.length && filings.length < 20; i++) {
          const form = recent.form[i]
          
          if (!filingTypes.includes(form)) continue

          const accessionNumber = recent.accessionNumber[i].replace(/-/g, '')
          const primaryDoc = recent.primaryDocument[i]

          filings.push({
            type: form as SECFiling['type'],
            filingDate: recent.filingDate[i],
            acceptedDate: recent.filingDate[i],
            documentUrl: `https://www.sec.gov/Archives/edgar/data/${parseInt(cik)}/${accessionNumber}/${primaryDoc}`,
            description: recent.primaryDocDescription[i] || form,
            formType: form,
            cik,
          })
        }

        return { data: filings, source: 'sec-edgar' as const }
      },
      CACHE_DURATIONS.filings
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
      source: 'sec-edgar',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch financial facts from SEC XBRL data
 * This provides structured financial data extracted from filings
 */
export async function fetchSECFinancials(
  ticker: string
): Promise<DataSourceResult<Partial<CompanyFinancials>>> {
  const cacheKey = getCacheKey('sec_fundamentals', ticker)

  try {
    const result = await fetchWithCache<Partial<CompanyFinancials>>(
      cacheKey,
      async () => {
        const cik = await tickerToCIK(ticker)
        if (!cik) {
          throw new Error(`Could not find CIK for ticker ${ticker}`)
        }

        const response = await fetch(
          `${COMPANY_FACTS_URL}/CIK${cik}.json`,
          { headers: SEC_HEADERS }
        )

        if (!response.ok) {
          throw new Error(`SEC API error: ${response.status}`)
        }

        const data: SECCompanyFacts = await response.json()
        const gaap = data.facts['us-gaap']

        if (!gaap) {
          throw new Error('No GAAP data available')
        }

        // Helper to get latest annual value
        const getLatestAnnual = (concept: string): number | null => {
          const conceptData = gaap[concept]
          if (!conceptData) return null

          const values = conceptData.units['USD'] || conceptData.units['shares'] || Object.values(conceptData.units)[0]
          if (!values) return null

          // Find latest 10-K value
          const annualValues = values
            .filter(v => v.form === '10-K')
            .sort((a, b) => b.fy - a.fy)

          return annualValues[0]?.val ?? null
        }

        const financials: Partial<CompanyFinancials> = {
          ticker: ticker.toUpperCase(),
          companyName: data.entityName,

          revenue: getLatestAnnual('Revenues') ?? getLatestAnnual('RevenueFromContractWithCustomerExcludingAssessedTax'),
          grossProfit: getLatestAnnual('GrossProfit'),
          operatingIncome: getLatestAnnual('OperatingIncomeLoss'),
          netIncome: getLatestAnnual('NetIncomeLoss'),

          totalAssets: getLatestAnnual('Assets'),
          totalLiabilities: getLatestAnnual('Liabilities'),
          totalEquity: getLatestAnnual('StockholdersEquity') ?? getLatestAnnual('StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest'),
          cash: getLatestAnnual('CashAndCashEquivalentsAtCarryingValue'),

          operatingCashFlow: getLatestAnnual('NetCashProvidedByUsedInOperatingActivities'),
          capitalExpenditures: getLatestAnnual('PaymentsToAcquirePropertyPlantAndEquipment'),

          eps: getLatestAnnual('EarningsPerShareBasic'),

          dataSource: 'sec-edgar',
          dataQuality: 'high',
          lastUpdated: new Date().toISOString(),
        }

        return { data: financials, source: 'sec-edgar' as const }
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
      source: 'sec-edgar',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
