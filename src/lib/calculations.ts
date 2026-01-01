import type {
  BaselineMetrics,
  ImpactProjections,
  CalculatedMetrics,
  ScenarioResults,
  Scenario,
} from './types'

const DISCOUNT_RATE = 0.1

export function calculateScenarioMetrics(
  baseline: BaselineMetrics,
  projections: ImpactProjections,
  investmentAmount: number,
  timelineMonths: number,
  scenario: Scenario
): CalculatedMetrics {
  const multipliers: Record<Scenario, number> = {
    conservative: 0.7,
    realistic: 1.0,
    optimistic: 1.3,
  }

  const multiplier = multipliers[scenario]
  const timelineYears = timelineMonths / 12

  const currentRevenue = baseline.currentRevenue || 0
  const currentCosts = baseline.currentCosts || 0

  const revenueImpact =
    currentRevenue * (projections.revenueGrowthRate / 100) * multiplier * timelineYears
  const costSavings =
    currentCosts * (projections.costReduction / 100) * multiplier * timelineYears
  const efficiencyBenefit =
    currentCosts * (projections.efficiencyGain / 100) * multiplier * timelineYears

  const totalBenefits = revenueImpact + costSavings + efficiencyBenefit
  const netBenefit = totalBenefits - investmentAmount

  const roi = investmentAmount > 0 ? (netBenefit / investmentAmount) * 100 : 0

  const annualBenefit = totalBenefits / timelineYears
  let npv = -investmentAmount
  for (let year = 1; year <= timelineYears; year++) {
    npv += annualBenefit / Math.pow(1 + DISCOUNT_RATE, year)
  }

  const paybackMonths =
    annualBenefit > 0 ? (investmentAmount / (annualBenefit / 12)) : 999

  return {
    roi: Math.round(roi * 10) / 10,
    npv: Math.round(npv),
    paybackMonths: Math.round(paybackMonths * 10) / 10,
    revenueImpact: Math.round(revenueImpact),
    costSavings: Math.round(costSavings + efficiencyBenefit),
    netBenefit: Math.round(netBenefit),
  }
}

export function calculateAllScenarios(
  baseline: BaselineMetrics,
  projections: ImpactProjections,
  investmentAmount: number,
  timelineMonths: number
): ScenarioResults {
  return {
    conservative: calculateScenarioMetrics(
      baseline,
      projections,
      investmentAmount,
      timelineMonths,
      'conservative'
    ),
    realistic: calculateScenarioMetrics(
      baseline,
      projections,
      investmentAmount,
      timelineMonths,
      'realistic'
    ),
    optimistic: calculateScenarioMetrics(
      baseline,
      projections,
      investmentAmount,
      timelineMonths,
      'optimistic'
    ),
  }
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}
