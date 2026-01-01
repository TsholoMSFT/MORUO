import { Card } from '@/components/ui/card'
import type { ScenarioResults } from '@/lib/types'
import { formatCurrency, formatPercent } from '@/lib/calculations'
import { cn } from '@/lib/utils'

interface ScenarioComparisonProps {
  results: ScenarioResults
}

export function ScenarioComparison({ results }: ScenarioComparisonProps) {
  const scenarios = [
    { key: 'conservative' as const, label: 'Conservative', color: 'border-l-orange-400' },
    { key: 'realistic' as const, label: 'Realistic', color: 'border-l-accent' },
    { key: 'optimistic' as const, label: 'Optimistic', color: 'border-l-green-500' },
  ]

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {scenarios.map((scenario) => {
        const data = results[scenario.key]
        return (
          <Card
            key={scenario.key}
            className={cn('border-l-4 p-6', scenario.color)}
          >
            <h3 className="mb-4 font-heading text-lg font-semibold">{scenario.label}</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">ROI</p>
                <p className="mt-1 font-mono text-2xl font-medium">{formatPercent(data.roi)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">NPV</p>
                <p className="mt-1 font-mono text-xl">{formatCurrency(data.npv)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Payback Period
                </p>
                <p className="mt-1 font-mono text-xl">{data.paybackMonths.toFixed(1)} months</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Net Benefit
                </p>
                <p className="mt-1 font-mono text-xl">{formatCurrency(data.netBenefit)}</p>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
