import { ArrowUp, ArrowDown, CheckCircle, TrendUp, TrendDown, Warning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/calculations'

interface BenchmarkComparisonProps {
  label: string
  value: number
  benchmark: number
  unit: string
  inverse?: boolean
  description?: string
}

export function BenchmarkComparison({
  label,
  value,
  benchmark,
  unit,
  inverse = false,
  description,
}: BenchmarkComparisonProps) {
  const performancePct = inverse
    ? ((benchmark - value) / benchmark) * 100
    : ((value - benchmark) / benchmark) * 100

  const difference = inverse ? benchmark - value : value - benchmark
  const pctDifference = (difference / benchmark) * 100

  let status: 'exceeds' | 'slightly-above' | 'meets' | 'slightly-below' | 'below'
  let statusColor: string
  let bgColor: string
  let StatusIcon: typeof CheckCircle
  let statusText: string

  if (pctDifference >= 10) {
    status = 'exceeds'
    statusColor = 'text-emerald-700'
    bgColor = 'bg-emerald-50 border-emerald-200'
    StatusIcon = CheckCircle
    statusText = 'Exceeds Benchmark'
  } else if (pctDifference >= 3) {
    status = 'slightly-above'
    statusColor = 'text-green-600'
    bgColor = 'bg-green-50 border-green-200'
    StatusIcon = TrendUp
    statusText = 'Slightly Above Benchmark'
  } else if (pctDifference >= -3) {
    status = 'meets'
    statusColor = 'text-lime-600'
    bgColor = 'bg-lime-50 border-lime-200'
    StatusIcon = Warning
    statusText = 'Meets Benchmark'
  } else if (pctDifference >= -10) {
    status = 'slightly-below'
    statusColor = 'text-orange-600'
    bgColor = 'bg-orange-50 border-orange-200'
    StatusIcon = TrendDown
    statusText = 'Slightly Below Benchmark'
  } else {
    status = 'below'
    statusColor = 'text-red-600'
    bgColor = 'bg-red-50 border-red-200'
    StatusIcon = inverse ? ArrowUp : ArrowDown
    statusText = 'Below Benchmark'
  }

  const isCurrency = unit === '' && value >= 1000
  const formatValue = (val: number) => {
    if (isCurrency) {
      return formatCurrency(val)
    }
    return val >= 1000 ? val.toLocaleString('en-US', { maximumFractionDigits: 0 }) : val.toFixed(1)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div>
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-mono text-3xl font-semibold">
            {formatValue(value)}
          </span>
          {unit && <span className="text-lg text-muted-foreground">{unit}</span>}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          vs. benchmark: {formatValue(benchmark)}{unit}
        </p>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        )}
      </div>

      <div className={cn('flex items-center justify-center rounded-lg border p-4', bgColor)}>
        <div className="text-center">
          <StatusIcon className={cn('mx-auto mb-2', statusColor)} size={32} weight="fill" />
          <p className={cn('mb-1 font-semibold', statusColor)}>{statusText}</p>
          <p className={cn('text-sm font-medium', statusColor)}>
            {performancePct > 0 ? '+' : ''}
            {performancePct.toFixed(1)}% vs target
          </p>
        </div>
      </div>
    </div>
  )
}
