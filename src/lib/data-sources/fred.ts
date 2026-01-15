/**
 * FRED (Federal Reserve Economic Data) Data Source
 * Free API with generous limits (120 requests/minute)
 * US macroeconomic indicators
 */

import type { MacroeconomicData, DataSourceResult } from './types'
import { API_KEYS, CACHE_DURATIONS } from './types'
import { getCacheKey, fetchWithCache } from './cache'

const BASE_URL = 'https://api.stlouisfed.org/fred'

// Common FRED series IDs
export const FRED_SERIES = {
  // GDP & Growth
  GDP: { id: 'GDP', name: 'Gross Domestic Product', unit: 'Billions of Dollars' },
  GDPC1: { id: 'GDPC1', name: 'Real GDP', unit: 'Billions of Chained 2017 Dollars' },
  A191RL1Q225SBEA: { id: 'A191RL1Q225SBEA', name: 'Real GDP Growth Rate', unit: 'Percent' },

  // Inflation
  CPIAUCSL: { id: 'CPIAUCSL', name: 'Consumer Price Index', unit: 'Index 1982-84=100' },
  PCEPI: { id: 'PCEPI', name: 'PCE Price Index', unit: 'Index 2017=100' },
  FPCPITOTLZGUSA: { id: 'FPCPITOTLZGUSA', name: 'Inflation Rate', unit: 'Percent' },

  // Interest Rates
  FEDFUNDS: { id: 'FEDFUNDS', name: 'Federal Funds Rate', unit: 'Percent' },
  DGS10: { id: 'DGS10', name: '10-Year Treasury Rate', unit: 'Percent' },
  DGS2: { id: 'DGS2', name: '2-Year Treasury Rate', unit: 'Percent' },
  T10Y2Y: { id: 'T10Y2Y', name: '10Y-2Y Treasury Spread', unit: 'Percent' },

  // Employment
  UNRATE: { id: 'UNRATE', name: 'Unemployment Rate', unit: 'Percent' },
  PAYEMS: { id: 'PAYEMS', name: 'Total Nonfarm Payrolls', unit: 'Thousands of Persons' },
  ICSA: { id: 'ICSA', name: 'Initial Jobless Claims', unit: 'Number' },

  // Corporate & Business
  BAMLH0A0HYM2: { id: 'BAMLH0A0HYM2', name: 'High Yield Corporate Bond Spread', unit: 'Percent' },
  TEDRATE: { id: 'TEDRATE', name: 'TED Spread', unit: 'Percent' },
  VIXCLS: { id: 'VIXCLS', name: 'VIX Volatility Index', unit: 'Index' },

  // Technology Sector Specific
  ITMTFPVS: { id: 'ITMTFPVS', name: 'IT Multifactor Productivity', unit: 'Index' },
  BOGZ1FL893065005Q: { id: 'BOGZ1FL893065005Q', name: 'Tech Equipment Investment', unit: 'Billions of Dollars' },
} as const

interface FREDObservation {
  date: string
  value: string
}

interface FREDSeriesResponse {
  observations: FREDObservation[]
}

interface FREDSeriesInfo {
  seriess: Array<{
    id: string
    title: string
    units: string
    frequency: string
    notes: string
  }>
}

async function fetchFREDEndpoint<T>(endpoint: string): Promise<T> {
  const apiKey = API_KEYS.fred
  if (!apiKey) {
    throw new Error('FRED API key not configured')
  }

  const separator = endpoint.includes('?') ? '&' : '?'
  const url = `${BASE_URL}${endpoint}${separator}api_key=${apiKey}&file_type=json`

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`FRED error: ${response.status}`)
  }

  return response.json()
}

export async function fetchFREDSeries(
  seriesId: string
): Promise<DataSourceResult<MacroeconomicData>> {
  const cacheKey = getCacheKey('fred_series', seriesId)

  try {
    const result = await fetchWithCache<MacroeconomicData>(
      cacheKey,
      async () => {
        const [observations, info] = await Promise.all([
          fetchFREDEndpoint<FREDSeriesResponse>(
            `/series/observations?series_id=${seriesId}&sort_order=desc&limit=1`
          ),
          fetchFREDEndpoint<FREDSeriesInfo>(`/series?series_id=${seriesId}`),
        ])

        const latest = observations.observations[0]
        const seriesInfo = info.seriess[0]

        if (!latest || latest.value === '.') {
          throw new Error('No data available')
        }

        const data: MacroeconomicData = {
          indicator: seriesInfo?.title || seriesId,
          value: parseFloat(latest.value),
          unit: seriesInfo?.units || '',
          date: latest.date,
          country: 'USA',
          source: 'fred',
          description: seriesInfo?.notes,
        }

        return { data, source: 'fred' as const }
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
      source: 'fred',
      timestamp: Date.now(),
      cached: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Fetch multiple FRED series at once
 */
export async function fetchFREDIndicators(
  seriesIds: string[]
): Promise<Record<string, MacroeconomicData | null>> {
  const results: Record<string, MacroeconomicData | null> = {}

  await Promise.all(
    seriesIds.map(async (id) => {
      const result = await fetchFREDSeries(id)
      results[id] = result.data
    })
  )

  return results
}

/**
 * Get key economic indicators for business context
 */
export async function fetchKeyEconomicIndicators(): Promise<{
  gdpGrowth: MacroeconomicData | null
  inflationRate: MacroeconomicData | null
  fedFundsRate: MacroeconomicData | null
  unemployment: MacroeconomicData | null
  treasurySpread: MacroeconomicData | null
  vix: MacroeconomicData | null
}> {
  const results = await fetchFREDIndicators([
    FRED_SERIES.A191RL1Q225SBEA.id,
    FRED_SERIES.FPCPITOTLZGUSA.id,
    FRED_SERIES.FEDFUNDS.id,
    FRED_SERIES.UNRATE.id,
    FRED_SERIES.T10Y2Y.id,
    FRED_SERIES.VIXCLS.id,
  ])

  return {
    gdpGrowth: results[FRED_SERIES.A191RL1Q225SBEA.id],
    inflationRate: results[FRED_SERIES.FPCPITOTLZGUSA.id],
    fedFundsRate: results[FRED_SERIES.FEDFUNDS.id],
    unemployment: results[FRED_SERIES.UNRATE.id],
    treasurySpread: results[FRED_SERIES.T10Y2Y.id],
    vix: results[FRED_SERIES.VIXCLS.id],
  }
}
