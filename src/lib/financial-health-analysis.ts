import type {
  FundamentalData,
  BusinessImpactAssessment,
  Analysis,
  BaselineMetrics,
} from './types'
import { calculateFinancialHealthScore } from './fundamentals-api'

/**
 * Assess the business impact potential based on customer's financial fundamentals
 * and the proposed use case
 */
export async function assessBusinessImpact(
  analysis: Analysis,
  fundamentals: FundamentalData | null
): Promise<BusinessImpactAssessment | null> {
  if (!fundamentals) {
    console.warn('No fundamental data available for impact assessment')
    return null
  }

  const financialHealthScore = calculateFinancialHealthScore(fundamentals)
  
  // Calculate component scores
  const liquidityScore = calculateLiquidityScore(fundamentals)
  const profitabilityScore = calculateProfitabilityScore(fundamentals)
  const growthScore = calculateGrowthScore(fundamentals)
  
  // Assess impact potential
  const revenueImpactPotential = assessRevenueImpact(analysis, fundamentals)
  const costSavingsRelevance = assessCostSavings(analysis, fundamentals)
  const cashFlowImprovement = assessCashFlowImpact(analysis, fundamentals)
  
  // Determine investment capacity
  const investmentCapacity = assessInvestmentCapacity(
    fundamentals,
    analysis.projectBasics.investmentAmount
  )
  const recommendedRange = calculateRecommendedInvestmentRange(fundamentals)
  
  // Calculate strategic alignment
  const alignmentScore = calculateStrategicAlignment(analysis, fundamentals)
  const alignmentRationale = generateAlignmentRationale(analysis, fundamentals, alignmentScore)
  
  // Generate insights
  const insights = generateInsights(analysis, fundamentals)
  
  // Identify risks
  const risks = identifyRisks(analysis, fundamentals)
  
  return {
    useCaseId: analysis.id,
    customerName: analysis.projectBasics.customerName,
    ticker: fundamentals.ticker,
    isPrivateCompany: fundamentals.dataSource !== 'company',
    
    financialHealthScore,
    liquidityScore,
    profitabilityScore,
    growthScore,
    
    revenueImpactPotential,
    costSavingsRelevance,
    cashFlowImprovement,
    
    investmentCapacity,
    recommendedInvestmentRange: recommendedRange,
    
    alignmentScore,
    alignmentRationale,
    
    insights,
    risks,
  }
}

function calculateLiquidityScore(fundamentals: FundamentalData): number {
  let score = 0
  
  // Current ratio (40 points)
  if (fundamentals.currentRatio > 2) score += 40
  else if (fundamentals.currentRatio > 1.5) score += 30
  else if (fundamentals.currentRatio > 1) score += 20
  else score += 10
  
  // Free cash flow yield (30 points)
  if (fundamentals.freeCashFlowYield > 5) score += 30
  else if (fundamentals.freeCashFlowYield > 3) score += 20
  else if (fundamentals.freeCashFlowYield > 0) score += 10
  
  // Cash to debt (30 points)
  const cashToDebt = fundamentals.debt > 0 ? fundamentals.cash / fundamentals.debt : 1
  if (cashToDebt > 0.5) score += 30
  else if (cashToDebt > 0.3) score += 20
  else if (cashToDebt > 0.1) score += 10
  
  return Math.min(100, score)
}

function calculateProfitabilityScore(fundamentals: FundamentalData): number {
  let score = 0
  
  // Net margin (35 points)
  if (fundamentals.netMargin > 20) score += 35
  else if (fundamentals.netMargin > 10) score += 25
  else if (fundamentals.netMargin > 5) score += 15
  else if (fundamentals.netMargin > 0) score += 5
  
  // ROE (35 points)
  if (fundamentals.returnOnEquity > 20) score += 35
  else if (fundamentals.returnOnEquity > 15) score += 25
  else if (fundamentals.returnOnEquity > 10) score += 15
  else if (fundamentals.returnOnEquity > 5) score += 5
  
  // Operating margin (30 points)
  if (fundamentals.operatingMargin > 20) score += 30
  else if (fundamentals.operatingMargin > 15) score += 20
  else if (fundamentals.operatingMargin > 10) score += 10
  else if (fundamentals.operatingMargin > 0) score += 5
  
  return Math.min(100, score)
}

function calculateGrowthScore(fundamentals: FundamentalData): number {
  let score = 0
  
  // Revenue growth (50 points)
  if (fundamentals.revenueGrowthYoY > 20) score += 50
  else if (fundamentals.revenueGrowthYoY > 15) score += 40
  else if (fundamentals.revenueGrowthYoY > 10) score += 30
  else if (fundamentals.revenueGrowthYoY > 5) score += 20
  else if (fundamentals.revenueGrowthYoY > 0) score += 10
  
  // EPS growth (50 points)
  if (fundamentals.epsGrowthYoY > 20) score += 50
  else if (fundamentals.epsGrowthYoY > 15) score += 40
  else if (fundamentals.epsGrowthYoY > 10) score += 30
  else if (fundamentals.epsGrowthYoY > 5) score += 20
  else if (fundamentals.epsGrowthYoY > 0) score += 10
  
  return Math.min(100, score)
}

function assessRevenueImpact(
  analysis: Analysis,
  fundamentals: FundamentalData
): 'high' | 'medium' | 'low' {
  const projectedRevenueImpact = analysis.results.realistic.revenueImpact
  const percentOfRevenue = (projectedRevenueImpact / fundamentals.revenue) * 100
  
  // High if use case could drive >5% revenue growth
  if (percentOfRevenue > 5) return 'high'
  if (percentOfRevenue > 2) return 'medium'
  return 'low'
}

function assessCostSavings(
  analysis: Analysis,
  fundamentals: FundamentalData
): 'high' | 'medium' | 'low' {
  const projectedCostSavings = analysis.results.realistic.costSavings
  const operatingExpenses = fundamentals.revenue * (1 - fundamentals.operatingMargin / 100)
  const percentOfOpex = operatingExpenses > 0 
    ? (projectedCostSavings / operatingExpenses) * 100 
    : 0
  
  // High if cost savings >3% of operating expenses
  if (percentOfOpex > 3) return 'high'
  if (percentOfOpex > 1) return 'medium'
  return 'low'
}

function assessCashFlowImpact(
  analysis: Analysis,
  fundamentals: FundamentalData
): 'high' | 'medium' | 'low' {
  const netBenefit = analysis.results.realistic.netBenefit
  const percentOfFCF = fundamentals.freeCashFlow > 0 
    ? (netBenefit / fundamentals.freeCashFlow) * 100 
    : 0
  
  // High if impact >10% of current FCF
  if (percentOfFCF > 10) return 'high'
  if (percentOfFCF > 5) return 'medium'
  return 'low'
}

function assessInvestmentCapacity(
  fundamentals: FundamentalData,
  investmentAmount: number
): 'strong' | 'moderate' | 'limited' {
  const availableCash = fundamentals.cash
  const annualFCF = fundamentals.freeCashFlow
  
  // Can cover investment with cash on hand
  if (availableCash > investmentAmount * 2) return 'strong'
  
  // Can cover with annual FCF
  if (annualFCF > investmentAmount) return 'strong'
  if (annualFCF > investmentAmount * 0.5) return 'moderate'
  
  return 'limited'
}

function calculateRecommendedInvestmentRange(
  fundamentals: FundamentalData
): { min: number; max: number } {
  // Recommend 1-5% of annual revenue or 10-30% of annual FCF
  const revenueBasedMin = fundamentals.revenue * 0.01
  const revenueBasedMax = fundamentals.revenue * 0.05
  
  const fcfBasedMin = fundamentals.freeCashFlow * 0.1
  const fcfBasedMax = fundamentals.freeCashFlow * 0.3
  
  return {
    min: Math.max(revenueBasedMin, fcfBasedMin),
    max: Math.min(revenueBasedMax, fcfBasedMax),
  }
}

function calculateStrategicAlignment(
  analysis: Analysis,
  fundamentals: FundamentalData
): number {
  let score = 0
  
  // Growth companies benefit more from revenue-generating initiatives
  if (fundamentals.revenueGrowthYoY > 10 && analysis.results.realistic.revenueImpact > 0) {
    score += 25
  }
  
  // Low-margin companies benefit from cost reduction
  if (fundamentals.netMargin < 10 && analysis.results.realistic.costSavings > 0) {
    score += 25
  }
  
  // Cash-constrained companies need quick payback
  if (fundamentals.currentRatio < 1.5 && analysis.results.realistic.paybackMonths < 18) {
    score += 25
  }
  
  // Technology companies align with tech investments
  if (analysis.projectBasics.industry === 'technology') {
    score += 15
  }
  
  // Strategic factors alignment
  const avgStrategicScore =
    Object.values(analysis.strategicFactors).reduce((a, b) => a + b, 0) /
    Object.values(analysis.strategicFactors).length
  score += (avgStrategicScore / 10) * 10
  
  return Math.min(100, score)
}

function generateAlignmentRationale(
  analysis: Analysis,
  fundamentals: FundamentalData,
  alignmentScore: number
): string {
  const reasons: string[] = []
  
  if (alignmentScore > 75) {
    reasons.push(
      `Strong alignment with ${analysis.projectBasics.customerName}'s financial profile`
    )
  } else if (alignmentScore > 50) {
    reasons.push(`Moderate alignment with current business priorities`)
  } else {
    reasons.push(`Limited strategic fit based on current financial position`)
  }
  
  if (fundamentals.revenueGrowthYoY > 15) {
    reasons.push(
      `High growth trajectory (${fundamentals.revenueGrowthYoY.toFixed(1)}% YoY) supports investment`
    )
  }
  
  if (fundamentals.freeCashFlowYield > 5) {
    reasons.push(`Strong cash generation provides investment flexibility`)
  }
  
  if (fundamentals.debtToEquity > 2) {
    reasons.push(`High leverage may constrain investment capacity`)
  }
  
  return reasons.join('. ')
}

function generateInsights(
  analysis: Analysis,
  fundamentals: FundamentalData
): BusinessImpactAssessment['insights'] {
  const insights: BusinessImpactAssessment['insights'] = []
  
  // Revenue impact insight
  const revenueImpactPercent =
    (analysis.results.realistic.revenueImpact / fundamentals.revenue) * 100
  if (revenueImpactPercent > 3) {
    insights.push({
      title: 'Significant Revenue Opportunity',
      description: `This initiative could drive ${revenueImpactPercent.toFixed(1)}% incremental revenue growth`,
      impact: 'positive',
      metric: `+$${(analysis.results.realistic.revenueImpact / 1e6).toFixed(1)}M`,
    })
  }
  
  // Margin improvement insight
  const costSavingsImpact =
    (analysis.results.realistic.costSavings / fundamentals.revenue) * 100
  if (costSavingsImpact > 1) {
    insights.push({
      title: 'Margin Expansion Potential',
      description: `Cost savings could improve net margin by ${costSavingsImpact.toFixed(1)} percentage points`,
      impact: 'positive',
      metric: `+${costSavingsImpact.toFixed(1)}pp`,
    })
  }
  
  // Cash flow insight
  if (fundamentals.freeCashFlow > 0) {
    const fcfImprovement =
      (analysis.results.realistic.netBenefit / fundamentals.freeCashFlow) * 100
    if (fcfImprovement > 10) {
      insights.push({
        title: 'Material Cash Flow Enhancement',
        description: `Expected to boost annual free cash flow by ${fcfImprovement.toFixed(0)}%`,
        impact: 'positive',
        metric: `+${fcfImprovement.toFixed(0)}%`,
      })
    }
  }
  
  // ROI vs cost of capital
  if (analysis.results.realistic.roi > 30) {
    insights.push({
      title: 'Exceptional Return Potential',
      description: `${analysis.results.realistic.roi.toFixed(0)}% ROI significantly exceeds typical cost of capital`,
      impact: 'positive',
      metric: `${analysis.results.realistic.roi.toFixed(0)}% ROI`,
    })
  }
  
  // Valuation impact
  if (fundamentals.peRatio && analysis.results.realistic.netBenefit > 0) {
    const impliedValueCreation =
      analysis.results.realistic.netBenefit * fundamentals.peRatio
    insights.push({
      title: 'Shareholder Value Creation',
      description: `Could create $${(impliedValueCreation / 1e6).toFixed(0)}M in shareholder value at current valuation multiples`,
      impact: 'positive',
      metric: `$${(impliedValueCreation / 1e6).toFixed(0)}M`,
    })
  }
  
  return insights
}

function identifyRisks(
  analysis: Analysis,
  fundamentals: FundamentalData
): BusinessImpactAssessment['risks'] {
  const risks: BusinessImpactAssessment['risks'] = []
  
  // Liquidity risk
  if (fundamentals.currentRatio < 1.2) {
    risks.push({
      category: 'Liquidity',
      description: `Low current ratio (${fundamentals.currentRatio.toFixed(2)}) may limit investment capacity`,
      severity: 'high',
    })
  }
  
  // Leverage risk
  if (fundamentals.debtToEquity > 2) {
    risks.push({
      category: 'Financial Leverage',
      description: `High debt-to-equity ratio (${fundamentals.debtToEquity.toFixed(2)}) increases financial risk`,
      severity: 'medium',
    })
  }
  
  // Growth deceleration
  if (fundamentals.revenueGrowthYoY < 0) {
    risks.push({
      category: 'Revenue Decline',
      description: `Negative revenue growth may pressure investment decisions`,
      severity: 'high',
    })
  }
  
  // Profitability pressure
  if (fundamentals.netMargin < 5) {
    risks.push({
      category: 'Profitability',
      description: `Low net margin (${fundamentals.netMargin.toFixed(1)}%) reduces financial flexibility`,
      severity: 'medium',
    })
  }
  
  // Payback period vs cash position
  if (
    analysis.results.realistic.paybackMonths > 24 &&
    fundamentals.currentRatio < 2
  ) {
    risks.push({
      category: 'Investment Horizon',
      description: `Long payback period with constrained liquidity increases execution risk`,
      severity: 'high',
    })
  }
  
  return risks
}

/**
 * Generate executive summary of business impact
 */
export function generateImpactSummary(assessment: BusinessImpactAssessment): string {
  const health =
    assessment.financialHealthScore > 70
      ? 'strong'
      : assessment.financialHealthScore > 50
      ? 'moderate'
      : 'weak'
  
  return `${assessment.customerName} demonstrates ${health} financial health (score: ${assessment.financialHealthScore}/100) with ${assessment.investmentCapacity} investment capacity. This initiative shows ${assessment.revenueImpactPotential} revenue impact potential and ${assessment.costSavingsRelevance} cost savings relevance, with a strategic alignment score of ${assessment.alignmentScore}/100. ${assessment.insights.length} key opportunities identified, ${assessment.risks.filter((r) => r.severity === 'high').length} high-severity risks require mitigation.`
}

/**
 * Compare company fundamentals to industry benchmarks
 */
export function compareToPeers(
  companyFundamentals: FundamentalData,
  industryBenchmarks: FundamentalData
): {
  betterThanAverage: string[]
  worseThanAverage: string[]
  summary: string
} {
  const better: string[] = []
  const worse: string[] = []
  
  // Profitability comparison
  if (companyFundamentals.netMargin > industryBenchmarks.netMargin) {
    better.push(`Net margin ${companyFundamentals.netMargin.toFixed(1)}% vs ${industryBenchmarks.netMargin.toFixed(1)}% industry avg`)
  } else if (companyFundamentals.netMargin < industryBenchmarks.netMargin * 0.8) {
    worse.push(`Net margin ${companyFundamentals.netMargin.toFixed(1)}% below ${industryBenchmarks.netMargin.toFixed(1)}% industry avg`)
  }
  
  // Growth comparison
  if (companyFundamentals.revenueGrowthYoY > industryBenchmarks.revenueGrowthYoY) {
    better.push(`Revenue growth ${companyFundamentals.revenueGrowthYoY.toFixed(1)}% vs ${industryBenchmarks.revenueGrowthYoY.toFixed(1)}% industry avg`)
  } else if (companyFundamentals.revenueGrowthYoY < industryBenchmarks.revenueGrowthYoY * 0.8) {
    worse.push(`Revenue growth ${companyFundamentals.revenueGrowthYoY.toFixed(1)}% trails ${industryBenchmarks.revenueGrowthYoY.toFixed(1)}% industry avg`)
  }
  
  // Leverage comparison
  if (companyFundamentals.debtToEquity < industryBenchmarks.debtToEquity) {
    better.push(`Lower debt-to-equity ${companyFundamentals.debtToEquity.toFixed(2)} vs ${industryBenchmarks.debtToEquity.toFixed(2)} industry avg`)
  } else if (companyFundamentals.debtToEquity > industryBenchmarks.debtToEquity * 1.2) {
    worse.push(`Higher debt-to-equity ${companyFundamentals.debtToEquity.toFixed(2)} vs ${industryBenchmarks.debtToEquity.toFixed(2)} industry avg`)
  }
  
  // ROE comparison
  if (companyFundamentals.returnOnEquity > industryBenchmarks.returnOnEquity) {
    better.push(`ROE ${companyFundamentals.returnOnEquity.toFixed(1)}% vs ${industryBenchmarks.returnOnEquity.toFixed(1)}% industry avg`)
  } else if (companyFundamentals.returnOnEquity < industryBenchmarks.returnOnEquity * 0.8) {
    worse.push(`ROE ${companyFundamentals.returnOnEquity.toFixed(1)}% below ${industryBenchmarks.returnOnEquity.toFixed(1)}% industry avg`)
  }
  
  const summary = better.length > worse.length
    ? `Outperforming industry benchmarks in ${better.length} of ${better.length + worse.length} key metrics`
    : worse.length > better.length
    ? `Underperforming industry benchmarks in ${worse.length} of ${better.length + worse.length} key metrics`
    : `Mixed performance relative to industry benchmarks`
  
  return {
    betterThanAverage: better,
    worseThanAverage: worse,
    summary,
  }
}
