import { TrendUp, TrendDown } from '@phosphor-icons/react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string | number
  trend?: number
  className?: string
  size?: 'default' | 'large'
}

export function MetricCard({ label, value, trend, className, size = 'default' }: MetricCardProps) {
  const isPositive = trend !== undefined && trend >= 0
  const showTrend = trend !== undefined

  return (
    <Card className={cn('p-6 transition-all hover:shadow-lg', className)}>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <div className="flex items-end justify-between gap-4">
          <p
            className={cn(
              'font-mono font-medium tabular-nums',
              size === 'large' ? 'text-3xl' : 'text-2xl'
            )}
          >
            {value}
          </p>
          {showTrend && (
            <div
              className={cn(
                'flex items-center gap-1 text-sm font-medium',
                isPositive ? 'text-chart-3' : 'text-destructive'
              )}
            >
              {isPositive ? <TrendUp size={18} weight="bold" /> : <TrendDown size={18} weight="bold" />}
              <span>{Math.abs(trend).toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
