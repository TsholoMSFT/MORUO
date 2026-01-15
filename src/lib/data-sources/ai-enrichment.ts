/**
 * AI Enrichment for Financial Data
 * Uses AI to generate insights, explanations, and trend analysis
 */

import type { 
  CompanyFinancials, 
  TechSentiment, 
  PackageStats, 
  ArxivPaper,
  TechTrendAnalysis 
} from './types'

export interface AIEnrichmentOptions {
  /** API endpoint for AI service */
  endpoint?: string
  /** Include technical analysis */
  includeTechnicalAnalysis?: boolean
  /** Include competitive insights */
  includeCompetitiveInsights?: boolean
  /** Industry context for comparison */
  industryContext?: string
}

interface AIInsight {
  summary: string
  strengths: string[]
  weaknesses: string[]
  opportunities: string[]
  risks: string[]
  recommendation?: string
}

/**
 * Generate AI-powered insights for financial data
 * Falls back to rule-based analysis if AI endpoint not available
 */
export async function enrichFinancialsWithAI(
  financials: CompanyFinancials,
  options: AIEnrichmentOptions = {}
): Promise<{
  financials: CompanyFinancials
  insights: AIInsight
  explanations: Record<string, string>
}> {
  const insights = generateRuleBasedInsights(financials)
  const explanations = generateMetricExplanations(financials)

  // Try AI endpoint if configured
  if (options.endpoint) {
    try {
      const aiInsights = await fetchAIInsights(financials, options)
      return {
        financials,
        insights: aiInsights,
        explanations,
      }
    } catch (error) {
      console.warn('AI enrichment failed, using rule-based analysis:', error)
    }
  }

  return {
    financials,
    insights,
    explanations,
  }
}

/**
 * Generate explanations for each metric
 */
function generateMetricExplanations(
  financials: CompanyFinancials
): Record<string, string> {
  return {
    revenue: `Total revenue of ${formatCurrency(financials.revenue)}. ${
      financials.revenueGrowthYoY 
        ? `Growing at ${financials.revenueGrowthYoY.toFixed(1)}% year-over-year.` 
        : ''
    }`,
    
    netMargin: financials.netMargin 
      ? `Net profit margin of ${financials.netMargin.toFixed(1)}%. ${
          financials.netMargin > 20 ? 'Strong profitability.' :
          financials.netMargin > 10 ? 'Healthy profitability.' :
          financials.netMargin > 0 ? 'Modest profitability.' : 'Operating at a loss.'
        }`
      : 'Net margin data not available.',
    
    peRatio: financials.peRatio
      ? `P/E ratio of ${financials.peRatio.toFixed(1)}. ${
          financials.peRatio > 30 ? 'Trading at growth premium.' :
          financials.peRatio > 15 ? 'Fairly valued.' :
          financials.peRatio > 0 ? 'Value territory.' : 'Negative earnings.'
        }`
      : 'P/E ratio not available.',
    
    returnOnEquity: financials.returnOnEquity
      ? `ROE of ${financials.returnOnEquity.toFixed(1)}%. ${
          financials.returnOnEquity > 20 ? 'Excellent capital efficiency.' :
          financials.returnOnEquity > 10 ? 'Good capital efficiency.' :
          'Below average capital efficiency.'
        }`
      : 'ROE not available.',
    
    debtToEquity: financials.debtToEquity
      ? `Debt-to-Equity ratio of ${financials.debtToEquity.toFixed(2)}. ${
          financials.debtToEquity < 0.5 ? 'Conservative leverage.' :
          financials.debtToEquity < 1 ? 'Moderate leverage.' :
          financials.debtToEquity < 2 ? 'Significant leverage.' : 'High leverage.'
        }`
      : 'Leverage data not available.',
    
    currentRatio: financials.currentRatio
      ? `Current ratio of ${financials.currentRatio.toFixed(2)}. ${
          financials.currentRatio > 2 ? 'Strong liquidity position.' :
          financials.currentRatio > 1 ? 'Adequate liquidity.' :
          'Potential liquidity concerns.'
        }`
      : 'Liquidity data not available.',
    
    employeeCount: financials.employeeCount
      ? `${financials.employeeCount.toLocaleString()} employees. ${
          financials.revenue && financials.employeeCount
            ? `Revenue per employee: ${formatCurrency(financials.revenue / financials.employeeCount)}.`
            : ''
        }`
      : 'Employee count not available.',
  }
}

/**
 * Generate rule-based insights when AI not available
 */
function generateRuleBasedInsights(financials: CompanyFinancials): AIInsight {
  const strengths: string[] = []
  const weaknesses: string[] = []
  const opportunities: string[] = []
  const risks: string[] = []

  // Analyze profitability
  if (financials.netMargin) {
    if (financials.netMargin > 20) {
      strengths.push('Strong profit margins indicate pricing power and operational efficiency')
    } else if (financials.netMargin < 5) {
      weaknesses.push('Thin profit margins leave little room for error')
    }
  }

  // Analyze growth
  if (financials.revenueGrowthYoY) {
    if (financials.revenueGrowthYoY > 20) {
      strengths.push('Strong revenue growth trajectory')
      opportunities.push('Potential for market share expansion')
    } else if (financials.revenueGrowthYoY < 0) {
      weaknesses.push('Declining revenue signals market challenges')
      risks.push('Continued revenue decline could impact sustainability')
    }
  }

  // Analyze efficiency
  if (financials.returnOnEquity) {
    if (financials.returnOnEquity > 20) {
      strengths.push('High return on equity demonstrates efficient capital allocation')
    } else if (financials.returnOnEquity < 5) {
      weaknesses.push('Low return on equity suggests inefficient capital use')
    }
  }

  // Analyze leverage
  if (financials.debtToEquity) {
    if (financials.debtToEquity > 2) {
      risks.push('High debt levels increase financial risk')
      weaknesses.push('Elevated leverage limits financial flexibility')
    } else if (financials.debtToEquity < 0.3) {
      strengths.push('Conservative debt levels provide financial stability')
      opportunities.push('Capacity to leverage for growth investments')
    }
  }

  // Analyze liquidity
  if (financials.currentRatio) {
    if (financials.currentRatio > 2) {
      strengths.push('Strong liquidity provides operational buffer')
    } else if (financials.currentRatio < 1) {
      risks.push('Low liquidity may cause short-term funding challenges')
    }
  }

  // Analyze cash flow
  if (financials.freeCashFlow && financials.netIncome) {
    if (financials.freeCashFlow > financials.netIncome) {
      strengths.push('Free cash flow exceeds net income, indicating quality earnings')
    }
  }

  // Generate summary
  const overallHealth = calculateOverallHealth(financials)
  const summary = generateSummary(financials, overallHealth)

  return {
    summary,
    strengths: strengths.length > 0 ? strengths : ['Stable business fundamentals'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No significant weaknesses identified'],
    opportunities,
    risks,
    recommendation: generateRecommendation(overallHealth),
  }
}

function calculateOverallHealth(financials: CompanyFinancials): 'strong' | 'moderate' | 'weak' {
  let score = 0
  let factors = 0

  if (financials.netMargin) {
    factors++
    if (financials.netMargin > 15) score += 2
    else if (financials.netMargin > 5) score += 1
  }

  if (financials.returnOnEquity) {
    factors++
    if (financials.returnOnEquity > 15) score += 2
    else if (financials.returnOnEquity > 8) score += 1
  }

  if (financials.debtToEquity) {
    factors++
    if (financials.debtToEquity < 0.5) score += 2
    else if (financials.debtToEquity < 1) score += 1
  }

  if (financials.revenueGrowthYoY) {
    factors++
    if (financials.revenueGrowthYoY > 10) score += 2
    else if (financials.revenueGrowthYoY > 0) score += 1
  }

  const avg = factors > 0 ? score / factors : 0

  if (avg >= 1.5) return 'strong'
  if (avg >= 0.75) return 'moderate'
  return 'weak'
}

function generateSummary(financials: CompanyFinancials, health: string): string {
  const company = financials.companyName || financials.ticker

  switch (health) {
    case 'strong':
      return `${company} demonstrates strong financial fundamentals with healthy profitability, efficient capital allocation, and manageable debt levels. The company appears well-positioned for continued growth.`
    case 'moderate':
      return `${company} shows mixed financial performance. While some metrics are solid, there are areas that warrant attention. The company has reasonable fundamentals but may face challenges in certain aspects.`
    case 'weak':
      return `${company} faces financial challenges that require careful consideration. Key metrics suggest areas of concern that should be monitored closely before making significant investment decisions.`
    default:
      return `${company} has limited financial data available for comprehensive analysis.`
  }
}

function generateRecommendation(health: string): string {
  switch (health) {
    case 'strong':
      return 'Consider for growth-oriented investments with appropriate position sizing.'
    case 'moderate':
      return 'Conduct deeper due diligence on areas of concern before investing.'
    case 'weak':
      return 'Exercise caution; address risk factors before proceeding with investment.'
    default:
      return 'Gather additional data for informed decision-making.'
  }
}

function formatCurrency(value: number | null): string {
  if (value === null) return 'N/A'
  
  if (Math.abs(value) >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`
  }
  if (Math.abs(value) >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`
  }
  if (Math.abs(value) >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`
  }
  if (Math.abs(value) >= 1e3) {
    return `$${(value / 1e3).toFixed(2)}K`
  }
  return `$${value.toFixed(2)}`
}

/**
 * Fetch AI insights from endpoint
 */
async function fetchAIInsights(
  financials: CompanyFinancials,
  options: AIEnrichmentOptions
): Promise<AIInsight> {
  const response = await fetch(options.endpoint!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      financials,
      industry: options.industryContext,
      includeTechnical: options.includeTechnicalAnalysis,
      includeCompetitive: options.includeCompetitiveInsights,
    }),
  })

  if (!response.ok) {
    throw new Error(`AI endpoint error: ${response.status}`)
  }

  return response.json()
}

/**
 * Generate technology trend analysis
 */
export async function generateTechTrendAnalysis(
  techSentiments: TechSentiment[],
  packageStats: PackageStats[],
  papers: ArxivPaper[]
): Promise<TechTrendAnalysis> {
  // Aggregate sentiment
  const avgSentimentScore = techSentiments.reduce((sum, s) => {
    const score = s.sentiment === 'positive' ? 1 : s.sentiment === 'negative' ? -1 : 0
    return sum + score * (s.confidence || 1)
  }, 0) / (techSentiments.length || 1)

  const overallSentiment: 'bullish' | 'bearish' | 'neutral' = 
    avgSentimentScore > 0.3 ? 'bullish' : 
    avgSentimentScore < -0.3 ? 'bearish' : 'neutral'

  // Calculate adoption trend
  const risingPackages = packageStats.filter(p => p.trend === 'rising').length
  const totalPackages = packageStats.length
  const adoptionTrend = totalPackages > 0 
    ? risingPackages / totalPackages 
    : 0.5

  // Research momentum
  const recentPapers = papers.filter(p => {
    const pubDate = new Date(p.publishedDate)
    const threeMonthsAgo = new Date()
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
    return pubDate > threeMonthsAgo
  })

  const researchMomentum = papers.length > 0 
    ? recentPapers.length / papers.length 
    : 0

  // Generate insights
  const insights: string[] = []

  if (overallSentiment === 'bullish') {
    insights.push('Strong positive sentiment across developer communities')
  } else if (overallSentiment === 'bearish') {
    insights.push('Declining interest in developer communities')
  }

  if (adoptionTrend > 0.6) {
    insights.push('Growing package adoption indicates healthy ecosystem growth')
  } else if (adoptionTrend < 0.3) {
    insights.push('Package adoption declining, may indicate technology shift')
  }

  if (researchMomentum > 0.4) {
    insights.push('Active research activity suggests continued innovation')
  }

  // Identify risks
  const risks: string[] = []
  if (overallSentiment === 'bearish') {
    risks.push('Declining developer interest may impact talent availability')
  }
  if (adoptionTrend < 0.3) {
    risks.push('Low adoption trend suggests potential technology obsolescence')
  }

  return {
    technology: techSentiments[0]?.query || 'Unknown',
    overallSentiment,
    sentimentScore: avgSentimentScore,
    adoptionTrend,
    researchActivity: researchMomentum,
    insights,
    risks,
    sources: techSentiments.map(s => s.source),
    generatedAt: new Date().toISOString(),
  }
}
