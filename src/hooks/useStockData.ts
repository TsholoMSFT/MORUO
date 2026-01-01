import { useQuery } from '@tanstack/react-query'
import type { StockData, Industry, FundamentalData } from '@/lib/types'
import { fetchStockQuote, fetchIndustryIndex } from '@/lib/stock-api'

/**
 * Hook to fetch stock data for a specific ticker
 * Caches for 5 minutes to avoid API rate limits
 */
export function useStockData(ticker: string | undefined | null, enabled = true) {
  return useQuery<StockData | null>({
    queryKey: ['stock', ticker],
    queryFn: async () => {
      if (!ticker) return null
      return fetchStockQuote(ticker)
    },
    enabled: enabled && !!ticker,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    retry: 1,
  })
}

/**
 * Hook to fetch industry index data as fallback for private companies
 * Caches for 5 minutes
 */
export function useIndustryIndex(industry: Industry, enabled = true) {
  return useQuery<StockData | null>({
    queryKey: ['industry-index', industry],
    queryFn: async () => {
      return fetchIndustryIndex(industry)
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  })
}

/**
 * Hook that intelligently fetches either stock data or industry index
 * based on whether a ticker is available
 */
export function useMarketData(
  ticker: string | undefined | null,
  industry: Industry,
  enabled = true
) {
  const hasTickerData = !!ticker && ticker.trim().length > 0

  const stockData = useStockData(ticker, enabled && hasTickerData)
  const industryData = useIndustryIndex(industry, enabled && !hasTickerData)

  if (hasTickerData) {
    return {
      ...stockData,
      isIndustryFallback: false,
    }
  } else {
    return {
      ...industryData,
      isIndustryFallback: true,
    }
  }
}

/**
 * Hook to fetch fundamental data for a company or industry
 * Caches for 1 hour since fundamentals change slowly
 */
export function useFundamentals(
  ticker: string | undefined | null,
  industry: Industry,
  isPrivateCompany: boolean = false,
  enabled = true
) {
  return useQuery({
    queryKey: ['fundamentals', ticker, industry, isPrivateCompany],
    queryFn: async () => {
      const { fetchFundamentalsWithFallback } = await import('@/lib/fundamentals-api')
      return fetchFundamentalsWithFallback(ticker || undefined, industry, isPrivateCompany)
    },
    enabled: enabled,
    staleTime: 60 * 60 * 1000, // 1 hour
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    retry: 2,
  })
}

/**
 * Hook to fetch complete market context including stock data and fundamentals
 * Orchestrates multiple data sources with fallback logic
 */
export function useCompleteMarketContext(
  ticker: string | undefined | null,
  industry: Industry,
  isPrivateCompany: boolean = false,
  enabled = true
) {
  const marketData = useMarketData(ticker, industry, enabled)
  const fundamentals = useFundamentals(ticker, industry, isPrivateCompany, enabled)

  return {
    stockData: marketData.data,
    stockLoading: marketData.isLoading,
    stockError: marketData.error,
    isIndustryFallback: marketData.isIndustryFallback,
    
    fundamentals: fundamentals.data?.data,
    fundamentalsLoading: fundamentals.isLoading,
    fundamentalsError: fundamentals.error,
    usingFundamentalsFallback: fundamentals.data?.usingFallback || false,
    
    isLoading: marketData.isLoading || fundamentals.isLoading,
    hasError: !!marketData.error && !!fundamentals.error,
  }
}
