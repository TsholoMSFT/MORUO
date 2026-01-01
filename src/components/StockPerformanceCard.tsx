import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { TrendingUp, TrendingDown, Activity, Building2, Info } from 'lucide-react'
import type { StockData } from '@/lib/types'
import { formatMarketCap, formatNumber } from '@/lib/stock-api'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface StockPerformanceCardProps {
  stockData: StockData | null
  isLoading: boolean
  isError: boolean
  isIndustryFallback?: boolean
  industryName?: string
}

export function StockPerformanceCard({
  stockData,
  isLoading,
  isError,
  isIndustryFallback = false,
  industryName,
}: StockPerformanceCardProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </Card>
    )
  }

  if (isError || !stockData) {
    return (
      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Market Data Unavailable
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isIndustryFallback
                ? 'Industry index data could not be loaded'
                : 'Stock data not available for this company'}
            </p>
          </div>
        </div>
      </Card>
    )
  }

  const isPositive = stockData.change >= 0
  const priceFromHigh = ((stockData.price / stockData.fiftyTwoWeekHigh) * 100).toFixed(1)
  const priceFromLow = ((stockData.price / stockData.fiftyTwoWeekLow) * 100).toFixed(1)

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              {isIndustryFallback ? (
                <Building2 className="h-4 w-4 text-muted-foreground" />
              ) : (
                <Activity className="h-4 w-4 text-muted-foreground" />
              )}
              <h3 className="text-sm font-medium text-muted-foreground">
                {isIndustryFallback ? 'Industry Index' : 'Stock Performance'}
              </h3>
              {isIndustryFallback && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="h-3 w-3 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs max-w-xs">
                        No stock ticker available. Showing {industryName || 'industry'} index as proxy.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stockData.companyName}
            </p>
          </div>
          <Badge variant={isIndustryFallback ? 'secondary' : 'outline'} className="text-xs">
            {stockData.ticker}
          </Badge>
        </div>

        {/* Price and Change */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              ${formatNumber(stockData.price)}
            </span>
            <div
              className={`flex items-center gap-1 ${
                isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-medium">
                {isPositive ? '+' : ''}
                {stockData.change.toFixed(2)} ({isPositive ? '+' : ''}
                {stockData.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            As of {stockData.lastUpdated}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t">
          <div>
            <p className="text-xs text-muted-foreground">Market Cap</p>
            <p className="text-sm font-semibold">
              {formatMarketCap(stockData.marketCap)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">P/E Ratio</p>
            <p className="text-sm font-semibold">
              {stockData.peRatio !== null ? stockData.peRatio.toFixed(2) : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">52W High</p>
            <p className="text-sm font-semibold">
              ${formatNumber(stockData.fiftyTwoWeekHigh)}
              <span className="text-xs text-muted-foreground ml-1">
                ({priceFromHigh}%)
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">52W Low</p>
            <p className="text-sm font-semibold">
              ${formatNumber(stockData.fiftyTwoWeekLow)}
              <span className="text-xs text-muted-foreground ml-1">
                ({priceFromLow}%)
              </span>
            </p>
          </div>
        </div>

        {/* Volume */}
        <div className="pt-3 border-t">
          <p className="text-xs text-muted-foreground">Volume</p>
          <p className="text-sm font-semibold">{formatNumber(stockData.volume)}</p>
        </div>
      </div>
    </Card>
  )
}
