/**
 * World Bank API Data Source
 * Free, no API key required
 * Global development and economic indicators
 */

import type { MacroeconomicData, DataSourceResult } from './types'
import { CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const BASE_URL = 'https://api.worldbank.org/v2'

// Common World Bank indicators
export const WORLD_BANK_INDICATORS = {
  // GDP & Growth
  GDP_CURRENT: { id: 'NY.GDP.MKTP.CD', name: 'GDP (current US$)' },
  GDP_GROWTH: { id: 'NY.GDP.MKTP.KD.ZG', name: 'GDP Growth (annual %)' },
  GDP_PER_CAPITA: { id: 'NY.GDP.PCAP.CD', name: 'GDP per capita (current US$)' },

  // Technology & Innovation
  RD_EXPENDITURE: { id: 'GB.XPD.RSDV.GD.ZS', name: 'R&D expenditure (% of GDP)' },
  HIGH_TECH_EXPORTS: { id: 'TX.VAL.TECH.CD', name: 'High-technology exports (current US$)' },
  ICT_GOODS_EXPORTS: { id: 'TX.VAL.ICTG.ZS.UN', name: 'ICT goods exports (% of total)' },
  INTERNET_USERS: { id: 'IT.NET.USER.ZS', name: 'Individuals using Internet (%)' },
  MOBILE_SUBSCRIPTIONS: { id: 'IT.CEL.SETS.P2', name: 'Mobile subscriptions per 100 people' },

  // Business Environment
  EASE_OF_BUSINESS: { id: 'IC.BUS.EASE.XQ', name: 'Ease of doing business score' },
  TIME_TO_START_BUSINESS: { id: 'IC.REG.DURS', name: 'Time to start a business (days)' },

  // Labor & Productivity
  LABOR_FORCE: { id: 'SL.TLF.TOTL.IN', name: 'Total labor force' },
  UNEMPLOYMENT: { id: 'SL.UEM.TOTL.ZS', name: 'Unemployment rate (%)' },

  // Trade & Investment
  FDI_INFLOWS: { id: 'BX.KLT.DINV.CD.WD', name: 'FDI net inflows (current US$)' },
  TRADE_PCT_GDP: { id: 'NE.TRD.GNFS.ZS', name: 'Trade (% of GDP)' },
} as const

// Country codes for major economies
export const COUNTRY_CODES = {
  USA: 'USA',
  CHINA: 'CHN',
  JAPAN: 'JPN',
  GERMANY: 'DEU',
  UK: 'GBR',
  FRANCE: 'FRA',
  INDIA: 'IND',
  BRAZIL: 'BRA',
  SOUTH_AFRICA: 'ZAF',
  AUSTRALIA: 'AUS',
  CANADA: 'CAN',
  SOUTH_KOREA: 'KOR',
  WORLD: 'WLD',
} as const

interface WorldBankResponse {
  page: number
  pages: number
  per_page: string
  total: number
  sourceid: string
  lastupdated: string
}

interface WorldBankDataPoint {
  indicator: { id: string; value: string }
  country: { id: string; value: string }
  countryiso3code: string
  date: string
  value: number | null
  unit: string
  obs_status: string
  decimal: number
}

async function fetchWorldBankEndpoint(
  countryCode: string,
  indicatorId: string,
  perPage = 10
): Promise<[WorldBankResponse, WorldBankDataPoint[]]> {
  const url = `${BASE_URL}/country/${countryCode}/indicator/${indicatorId}?format=json&per_page=${perPage}&mrv=5`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`World Bank API error: ${response.status}`)
  }

  const data = await response.json()
  
  // World Bank returns [metadata, data] array
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error('Invalid World Bank response')
  }

  return data as [WorldBankResponse, WorldBankDataPoint[]]
}

export async function fetchWorldBankIndicator(
  countryCode: string,
  indicatorId: string
): Promise<DataSourceResult<MacroeconomicData>> {
  const cacheKey = getCacheKey('worldbank', `${countryCode}_${indicatorId}`)

  try {
    const result = await fetchWithCache<MacroeconomicData>(
      cacheKey,
      async () => {
        const [, dataPoints] = await fetchWorldBankEndpoint(countryCode, indicatorId)

        // Find most recent non-null value
        const latest = dataPoints.find(dp => dp.value !== null)
        
        if (!latest) {
          throw new Error('No data available')
        }

        const data: MacroeconomicData = {
          indicator: latest.indicator.value,
          value: latest.value!,
          unit: latest.unit || '',
          date: latest.date,
          country: latest.country.value,
          source: 'world-bank',
        }

        return { data, source: 'world-bank' as const }
      },
      CACHE_DURATIONS.macro
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
      source: 'world-bank',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch technology indicators for a country
 */
export async function fetchTechIndicators(
  countryCode: string = 'USA'
): Promise<{
  rdExpenditure: MacroeconomicData | null
  highTechExports: MacroeconomicData | null
  internetUsers: MacroeconomicData | null
  mobileSubscriptions: MacroeconomicData | null
}> {
  const results = await Promise.all([
    fetchWorldBankIndicator(countryCode, WORLD_BANK_INDICATORS.RD_EXPENDITURE.id),
    fetchWorldBankIndicator(countryCode, WORLD_BANK_INDICATORS.HIGH_TECH_EXPORTS.id),
    fetchWorldBankIndicator(countryCode, WORLD_BANK_INDICATORS.INTERNET_USERS.id),
    fetchWorldBankIndicator(countryCode, WORLD_BANK_INDICATORS.MOBILE_SUBSCRIPTIONS.id),
  ])

  return {
    rdExpenditure: results[0].data,
    highTechExports: results[1].data,
    internetUsers: results[2].data,
    mobileSubscriptions: results[3].data,
  }
}

/**
 * Compare countries on key metrics
 */
export async function compareCountries(
  countryCodes: string[],
  indicatorId: string
): Promise<Record<string, MacroeconomicData | null>> {
  const results: Record<string, MacroeconomicData | null> = {}

  await Promise.all(
    countryCodes.map(async (code) => {
      const result = await fetchWorldBankIndicator(code, indicatorId)
      results[code] = result.data
    })
  )

  return results
}
