import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  TrendUp,
  TrendDown,
  CurrencyDollar,
  Buildings,
  ChartLine,
  Warning,
  CheckCircle,
  Info,
  Target,
  Lightning,
} from '@phosphor-icons/react'
import type { FundamentalData } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'

interface FundamentalOverviewProps {
  fundamentals: FundamentalData | null
  isLoading: boolean
  isError: boolean
  usingFallback?: boolean
}

export function FundamentalOverview({
  fundamentals,
  isLoading,
  isError,
  usingFallback = false,
}: FundamentalOverviewProps) {
  if (isLoading) {
    return (
      <Card className="p-6">
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </Card>
    )
  }

  if (isError || !fundamentals) {
    return (
      <Card className="p-6 bg-muted/50">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-muted-foreground mt-0.5" weight="fill" />
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Fundamental Data Unavailable
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Unable to load financial statement data for this company
            </p>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold">Fundamental Analysis</h3>
            {usingFallback && (
              <Badge variant="outline" className="text-xs">
                {fundamentals.dataSource === 'industry-etf'
                  ? 'Industry Average'
                  : 'Sector Benchmark'}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {fundamentals.companyName} ({fundamentals.ticker})
          </p>
          <p className="text-xs text-muted-foreground">
            As of {fundamentals.lastUpdated}
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="balance">Balance Sheet</TabsTrigger>
            <TabsTrigger value="cashflow">Cash Flow</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <MetricCard
                label="Market Cap"
                value={formatCurrency(fundamentals.marketCap)}
                icon={<Buildings className="h-4 w-4" weight="fill" />}
              />
              <MetricCard
                label="P/E Ratio"
                value={
                  fundamentals.peRatio ? fundamentals.peRatio.toFixed(2) : 'N/A'
                }
                icon={<ChartLine className="h-4 w-4" weight="fill" />}
              />
              <MetricCard
                label="EPS"
                value={`$${fundamentals.eps.toFixed(2)}`}
                icon={<CurrencyDollar className="h-4 w-4" weight="fill" />}
              />
              <MetricCard
                label="P/B Ratio"
                value={fundamentals.priceToBook.toFixed(2)}
                icon={<ChartLine className="h-4 w-4" weight="fill" />}
              />
            </div>

            {/* Growth Metrics */}
            <div>
              <h4 className="text-sm font-medium mb-3">Growth Metrics</h4>
              <div className="grid grid-cols-2 gap-4">
                <GrowthMetric
                  label="Revenue Growth YoY"
                  value={fundamentals.revenueGrowthYoY}
                />
                <GrowthMetric
                  label="EPS Growth YoY"
                  value={fundamentals.epsGrowthYoY}
                />
              </div>
            </div>

            {/* Profitability */}
            <div>
              <h4 className="text-sm font-medium mb-3">Profitability</h4>
              <div className="space-y-2">
                <ProfitabilityBar
                  label="Gross Margin"
                  value={fundamentals.grossMargin}
                />
                <ProfitabilityBar
                  label="Operating Margin"
                  value={fundamentals.operatingMargin}
                />
                <ProfitabilityBar
                  label="Net Margin"
                  value={fundamentals.netMargin}
                />
              </div>
            </div>
          </TabsContent>

          {/* Income Statement Tab */}
          <TabsContent value="income" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FinancialMetric
                label="Revenue (TTM)"
                value={formatCurrency(fundamentals.revenue)}
                sublabel={`Growth: ${formatPercent(fundamentals.revenueGrowthYoY)}`}
                isPositive={fundamentals.revenueGrowthYoY > 0}
              />
              <FinancialMetric
                label="Gross Profit"
                value={formatCurrency(fundamentals.grossProfit)}
                sublabel={`Margin: ${fundamentals.grossMargin.toFixed(1)}%`}
                isPositive={fundamentals.grossMargin > 40}
              />
              <FinancialMetric
                label="Operating Income"
                value={formatCurrency(fundamentals.operatingIncome)}
                sublabel={`Margin: ${fundamentals.operatingMargin.toFixed(1)}%`}
                isPositive={fundamentals.operatingMargin > 15}
              />
              <FinancialMetric
                label="Net Income"
                value={formatCurrency(fundamentals.netIncome)}
                sublabel={`Margin: ${fundamentals.netMargin.toFixed(1)}%`}
                isPositive={fundamentals.netMargin > 10}
              />
            </div>
          </TabsContent>

          {/* Balance Sheet Tab */}
          <TabsContent value="balance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FinancialMetric
                label="Total Assets"
                value={formatCurrency(fundamentals.totalAssets)}
              />
              <FinancialMetric
                label="Total Equity"
                value={formatCurrency(fundamentals.totalEquity)}
              />
              <FinancialMetric
                label="Cash & Equivalents"
                value={formatCurrency(fundamentals.cash)}
                sublabel={`${((fundamentals.cash / fundamentals.totalAssets) * 100).toFixed(1)}% of assets`}
                isPositive={fundamentals.cash > fundamentals.debt}
              />
              <FinancialMetric
                label="Total Debt"
                value={formatCurrency(fundamentals.debt)}
                sublabel={`D/E: ${fundamentals.debtToEquity.toFixed(2)}`}
                isPositive={fundamentals.debtToEquity < 1}
              />
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Liquidity & Leverage</h4>
              <div className="grid grid-cols-2 gap-4">
                <MetricCard
                  label="Current Ratio"
                  value={fundamentals.currentRatio.toFixed(2)}
                  icon={
                    fundamentals.currentRatio > 1.5 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />
                    ) : (
                      <Warning className="h-4 w-4 text-yellow-500" weight="fill" />
                    )
                  }
                  description={
                    fundamentals.currentRatio > 1.5
                      ? 'Healthy liquidity'
                      : 'Monitor liquidity'
                  }
                />
                <MetricCard
                  label="Debt/Equity"
                  value={fundamentals.debtToEquity.toFixed(2)}
                  icon={
                    fundamentals.debtToEquity < 1 ? (
                      <CheckCircle className="h-4 w-4 text-green-500" weight="fill" />
                    ) : (
                      <Warning className="h-4 w-4 text-yellow-500" weight="fill" />
                    )
                  }
                  description={
                    fundamentals.debtToEquity < 1
                      ? 'Conservative leverage'
                      : 'Elevated debt'
                  }
                />
              </div>
            </div>
          </TabsContent>

          {/* Cash Flow Tab */}
          <TabsContent value="cashflow" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FinancialMetric
                label="Operating Cash Flow"
                value={formatCurrency(fundamentals.operatingCashFlow)}
                isPositive={fundamentals.operatingCashFlow > 0}
              />
              <FinancialMetric
                label="Free Cash Flow"
                value={formatCurrency(fundamentals.freeCashFlow)}
                sublabel={`Per Share: $${fundamentals.freeCashFlowPerShare.toFixed(2)}`}
                isPositive={fundamentals.freeCashFlow > 0}
              />
              <FinancialMetric
                label="FCF Yield"
                value={`${fundamentals.freeCashFlowYield.toFixed(2)}%`}
                description="Free cash flow as % of market cap"
                isPositive={fundamentals.freeCashFlowYield > 5}
              />
              <FinancialMetric
                label="FCF Conversion"
                value={`${fundamentals.operatingCashFlow > 0 ? ((fundamentals.freeCashFlow / fundamentals.operatingCashFlow) * 100).toFixed(1) : '0.0'}%`}
                description="FCF / Operating CF"
                isPositive={
                  fundamentals.freeCashFlow / fundamentals.operatingCashFlow > 0.7
                }
              />
            </div>

            <div>
              <h4 className="text-sm font-medium mb-3">Returns</h4>
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  label="ROE"
                  value={`${fundamentals.returnOnEquity.toFixed(1)}%`}
                  description="Return on Equity"
                />
                <MetricCard
                  label="ROA"
                  value={`${fundamentals.returnOnAssets.toFixed(1)}%`}
                  description="Return on Assets"
                />
                <MetricCard
                  label="ROIC"
                  value={`${fundamentals.returnOnInvestedCapital.toFixed(1)}%`}
                  description="Return on Invested Capital"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}

// Helper Components

function MetricCard({
  label,
  value,
  icon,
  description,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  description?: string
}) {
  return (
    <div className="border rounded-lg p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <div className="text-lg font-semibold">{value}</div>
      {description && (
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      )}
    </div>
  )
}

function GrowthMetric({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0
  return (
    <div className="border rounded-lg p-3">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div
        className={`text-lg font-semibold flex items-center gap-1 ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}
      >
        {isPositive ? (
          <TrendUp className="h-4 w-4" weight="bold" />
        ) : (
          <TrendDown className="h-4 w-4" weight="bold" />
        )}
        {formatPercent(value)}
      </div>
    </div>
  )
}

function ProfitabilityBar({ label, value }: { label: string; value: number }) {
  const normalizedValue = Math.min(100, Math.max(0, value))
  const color =
    value > 20 ? 'bg-green-500' : value > 10 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value.toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${normalizedValue}%` }}
        />
      </div>
    </div>
  )
}

function FinancialMetric({
  label,
  value,
  sublabel,
  description,
  isPositive,
}: {
  label: string
  value: string
  sublabel?: string
  description?: string
  isPositive?: boolean
}) {
  return (
    <div className="border rounded-lg p-4">
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
      {sublabel && (
        <div
          className={`text-sm mt-1 ${
            isPositive === undefined
              ? 'text-muted-foreground'
              : isPositive
              ? 'text-green-600'
              : 'text-red-600'
          }`}
        >
          {sublabel}
        </div>
      )}
      {description && (
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      )}
    </div>
  )
}
