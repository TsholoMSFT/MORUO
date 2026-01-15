/**
 * Monte Carlo Simulation Engine
 * Client-side probabilistic financial modeling for ROI, NPV, and payback analysis
 */

import type { BaselineMetrics, ImpactProjections, ScenarioResults, Analysis } from './types'

// Configuration for Monte Carlo simulation
export interface MonteCarloConfig {
  iterations: number
  variancePercent: number
  distributionType: 'normal' | 'triangular' | 'uniform'
  confidenceLevels: number[]
}

export interface SimulationIteration {
  roi: number
  npv: number
  paybackMonths: number
  netBenefit: number
}

export interface ConfidenceInterval {
  p10: number
  p25: number
  p50: number
  p75: number
  p90: number
  mean: number
  stdDev: number
  min: number
  max: number
}

export interface HistogramBucket {
  min: number
  max: number
  rangeStart: number
  rangeEnd: number
  count: number
  frequency: number
}

export interface MonteCarloResults {
  config: MonteCarloConfig
  iterations: number
  executionTimeMs: number
  roi: ConfidenceInterval
  npv: ConfidenceInterval
  paybackMonths: ConfidenceInterval
  netBenefit: ConfidenceInterval
  roiDistribution: HistogramBucket[]
  npvDistribution: HistogramBucket[]
  paybackDistribution: HistogramBucket[]
  // Alias for compatibility
  roiHistogram: HistogramBucket[]
  npvHistogram: HistogramBucket[]
  paybackHistogram: HistogramBucket[]
  probabilityOfPositiveROI: number
  probabilityOfPositiveNPV: number
  probabilityOfPaybackWithinTimeline: number
  probabilityOfExceedingThreshold: number
  targetProbabilities: {
    roiAbove50: number
    roiAbove100: number
    paybackUnder12Months: number
    paybackUnder18Months: number
  }
  sampleData: SimulationIteration[]
}

const DISCOUNT_RATE = 0.1

function randomNormal(mean: number, stdDev: number): number {
  const u1 = Math.random()
  const u2 = Math.random()
  const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return mean + z0 * stdDev
}

function randomTriangular(min: number, mode: number, max: number): number {
  const u = Math.random()
  const fc = (mode - min) / (max - min)
  if (u < fc) {
    return min + Math.sqrt(u * (max - min) * (mode - min))
  }
  return max - Math.sqrt((1 - u) * (max - min) * (max - mode))
}

function randomUniform(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function randomValue(
  baseValue: number,
  variancePercent: number,
  distributionType: MonteCarloConfig['distributionType']
): number {
  const variance = baseValue * (variancePercent / 100)
  const min = Math.max(0, baseValue - variance)
  const max = baseValue + variance
  switch (distributionType) {
    case 'normal':
      return Math.max(0, randomNormal(baseValue, variance / 3))
    case 'triangular':
      return randomTriangular(min, baseValue, max)
    case 'uniform':
      return randomUniform(min, max)
    default:
      return baseValue
  }
}

function calculateIterationMetrics(
  baseline: BaselineMetrics,
  projections: ImpactProjections,
  investmentAmount: number,
  timelineMonths: number,
  variancePercent: number,
  distributionType: MonteCarloConfig['distributionType']
): SimulationIteration {
  const timelineYears = timelineMonths / 12
  const currentRevenue = baseline.currentRevenue || 0
  const currentCosts = baseline.currentCosts || 0

  const revenueGrowth = randomValue(projections.revenueGrowthRate, variancePercent, distributionType)
  const costReduction = randomValue(projections.costReduction, variancePercent, distributionType)
  const efficiencyGain = randomValue(projections.efficiencyGain, variancePercent, distributionType)
  const actualInvestment = randomValue(investmentAmount, variancePercent / 2, distributionType)

  const revenueImpact = currentRevenue * (revenueGrowth / 100) * timelineYears
  const costSavings = currentCosts * (costReduction / 100) * timelineYears
  const efficiencyBenefit = currentCosts * (efficiencyGain / 100) * timelineYears

  const totalBenefits = revenueImpact + costSavings + efficiencyBenefit
  const netBenefit = totalBenefits - actualInvestment
  const roi = actualInvestment > 0 ? (netBenefit / actualInvestment) * 100 : 0

  const annualBenefit = totalBenefits / timelineYears
  let npv = -actualInvestment
  for (let year = 1; year <= timelineYears; year++) {
    npv += annualBenefit / Math.pow(1 + DISCOUNT_RATE, year)
  }

  const paybackMonths = annualBenefit > 0 ? actualInvestment / (annualBenefit / 12) : 999

  return { roi, npv, paybackMonths: Math.min(paybackMonths, 999), netBenefit }
}

function percentile(sortedArray: number[], p: number): number {
  const index = (p / 100) * (sortedArray.length - 1)
  const lower = Math.floor(index)
  const upper = Math.ceil(index)
  const weight = index - lower
  if (upper >= sortedArray.length) return sortedArray[sortedArray.length - 1]
  if (lower < 0) return sortedArray[0]
  return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight
}

function standardDeviation(values: number[], mean: number): number {
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length)
}

function createHistogram(values: number[], bucketCount = 20): HistogramBucket[] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const bucketSize = (max - min) / bucketCount
  const buckets: HistogramBucket[] = []
  for (let i = 0; i < bucketCount; i++) {
    const rangeStart = min + i * bucketSize
    const rangeEnd = min + (i + 1) * bucketSize
    const count = values.filter(v => v >= rangeStart && (i === bucketCount - 1 ? v <= rangeEnd : v < rangeEnd)).length
    buckets.push({ 
      min: rangeStart, 
      max: rangeEnd, 
      rangeStart, 
      rangeEnd, 
      count, 
      frequency: (count / values.length) * 100 
    })
  }
  return buckets
}

function calculateConfidenceInterval(values: number[]): ConfidenceInterval {
  const sorted = [...values].sort((a, b) => a - b)
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  return {
    p10: percentile(sorted, 10),
    p25: percentile(sorted, 25),
    p50: percentile(sorted, 50),
    p75: percentile(sorted, 75),
    p90: percentile(sorted, 90),
    mean,
    stdDev: standardDeviation(values, mean),
    min: sorted[0],
    max: sorted[sorted.length - 1],
  }
}

export function runMonteCarloSimulation(
  baseline: BaselineMetrics,
  projections: ImpactProjections,
  investmentAmount: number,
  timelineMonths: number,
  config: Partial<MonteCarloConfig> = {}
): MonteCarloResults {
  const startTime = performance.now()
  const fullConfig: MonteCarloConfig = {
    iterations: config.iterations ?? 10000,
    variancePercent: config.variancePercent ?? 20,
    distributionType: config.distributionType ?? 'triangular',
    confidenceLevels: config.confidenceLevels ?? [10, 50, 90],
  }

  const iterations: SimulationIteration[] = []
  for (let i = 0; i < fullConfig.iterations; i++) {
    iterations.push(
      calculateIterationMetrics(baseline, projections, investmentAmount, timelineMonths, fullConfig.variancePercent, fullConfig.distributionType)
    )
  }

  const roiValues = iterations.map(it => it.roi)
  const npvValues = iterations.map(it => it.npv)
  const paybackValues = iterations.map(it => it.paybackMonths)
  const netBenefitValues = iterations.map(it => it.netBenefit)

  const roiDistribution = createHistogram(roiValues)
  const npvDistribution = createHistogram(npvValues)
  const paybackDistribution = createHistogram(paybackValues.filter(v => v < 100))
  
  const positiveROICount = roiValues.filter(v => v > 0).length
  const roiAbove50Count = roiValues.filter(v => v > 50).length

  return {
    config: fullConfig,
    iterations: fullConfig.iterations,
    executionTimeMs: performance.now() - startTime,
    roi: calculateConfidenceInterval(roiValues),
    npv: calculateConfidenceInterval(npvValues),
    paybackMonths: calculateConfidenceInterval(paybackValues),
    netBenefit: calculateConfidenceInterval(netBenefitValues),
    roiDistribution,
    npvDistribution,
    paybackDistribution,
    // Aliases for compatibility
    roiHistogram: roiDistribution,
    npvHistogram: npvDistribution,
    paybackHistogram: paybackDistribution,
    probabilityOfPositiveROI: (positiveROICount / fullConfig.iterations) * 100,
    probabilityOfPositiveNPV: (npvValues.filter(v => v > 0).length / fullConfig.iterations) * 100,
    probabilityOfPaybackWithinTimeline: (paybackValues.filter(v => v <= timelineMonths).length / fullConfig.iterations) * 100,
    probabilityOfExceedingThreshold: (roiAbove50Count / fullConfig.iterations) * 100,
    targetProbabilities: {
      roiAbove50: (roiAbove50Count / fullConfig.iterations) * 100,
      roiAbove100: (roiValues.filter(v => v > 100).length / fullConfig.iterations) * 100,
      paybackUnder12Months: (paybackValues.filter(v => v <= 12).length / fullConfig.iterations) * 100,
      paybackUnder18Months: (paybackValues.filter(v => v <= 18).length / fullConfig.iterations) * 100,
    },
    sampleData: iterations.slice(0, 1000),
  }
}

export const DEFAULT_MONTE_CARLO_CONFIG: MonteCarloConfig = {
  iterations: 10000,
  variancePercent: 20,
  distributionType: 'triangular',
  confidenceLevels: [10, 50, 90],
}

export const PREVIEW_MONTE_CARLO_CONFIG: MonteCarloConfig = {
  iterations: 1000,
  variancePercent: 20,
  distributionType: 'triangular',
  confidenceLevels: [10, 50, 90],
}

/**
 * Convenience wrapper that runs Monte Carlo simulation from an Analysis object
 */
export function runMonteCarloFromAnalysis(
  analysis: Analysis,
  config: Partial<MonteCarloConfig> = {}
): MonteCarloResults {
  return runMonteCarloSimulation(
    analysis.baselineMetrics,
    analysis.impactProjections,
    analysis.projectBasics.investmentAmount,
    analysis.projectBasics.timelineMonths,
    config
  )
}

/**
 * Alternative wrapper that takes ScenarioResults directly for simpler scenarios
 * Generates simulated variance around the realistic scenario values
 */
export function runMonteCarloFromScenarios(
  _scenarioResults: ScenarioResults,
  timelineMonths: number,
  config: Partial<MonteCarloConfig> = {}
): MonteCarloResults {
  // For this wrapper, we create synthetic baseline/projections from the scenario results
  // This is a simplified version that uses the realistic scenario as the base
  const realistic = _scenarioResults.realistic
  const investment = realistic.revenueImpact / (realistic.roi / 100 + 1) // Reverse calculate investment
  
  const syntheticBaseline: BaselineMetrics = {
    currentRevenue: realistic.revenueImpact / 0.1, // Assume 10% revenue impact
    currentCosts: realistic.costSavings / 0.1, // Assume 10% cost reduction
  }
  
  const syntheticProjections: ImpactProjections = {
    revenueGrowthRate: 10,
    costReduction: 10,
    efficiencyGain: 10,
    timeToMarketImprovement: 10,
  }
  
  return runMonteCarloSimulation(
    syntheticBaseline,
    syntheticProjections,
    investment,
    timelineMonths,
    config
  )
}
