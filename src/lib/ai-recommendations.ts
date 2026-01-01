import type {
  Analysis,
  Priority,
  StrategicFactors,
  ScenarioResults,
  ProjectBasics,
  MarketContext,
} from './types'
import { industryBenchmarks } from './benchmarks'

export async function generateRecommendation(
  projectBasics: ProjectBasics,
  results: ScenarioResults,
  strategicFactors: StrategicFactors,
  marketContext?: MarketContext
): Promise<Analysis['recommendation']> {
  const realisticROI = results.realistic.roi
  const realisticNPV = results.realistic.npv
  const payback = results.realistic.paybackMonths

  const strategicScore =
    (strategicFactors.competitiveDifferentiation +
      strategicFactors.riskMitigation +
      strategicFactors.customerExperience +
      strategicFactors.employeeProductivity +
      strategicFactors.regulatoryCompliance +
      strategicFactors.innovationEnablement) /
    6

  const benchmark = industryBenchmarks[projectBasics.industry]

  // Build market context section if available
  let marketContextText = ''
  if (marketContext?.stockData) {
    const stock = marketContext.stockData
    marketContextText = `
Market Context:
- Stock Performance: ${stock.ticker} at $${stock.price.toFixed(2)} (${stock.changePercent >= 0 ? '+' : ''}${stock.changePercent.toFixed(2)}%)
- Market Cap: $${(stock.marketCap / 1e9).toFixed(2)}B
- P/E Ratio: ${stock.peRatio !== null ? stock.peRatio.toFixed(2) : 'N/A'}
- 52-Week Range: $${stock.fiftyTwoWeekLow.toFixed(2)} - $${stock.fiftyTwoWeekHigh.toFixed(2)}
`
  }
  
  if (marketContext?.earningsInsights) {
    const earnings = marketContext.earningsInsights
    const techMentionCount = earnings.technologyMentions.reduce((sum, m) => sum + m.count, 0)
    marketContextText += `
Earnings Insights (${earnings.quarter} ${earnings.year}):
- Overall Sentiment: ${earnings.overallSentiment}
- Technology Mentions: ${techMentionCount} (${earnings.technologyMentions.map(m => m.category).join(', ')})
- Strategic Themes: ${earnings.strategicThemes.slice(0, 3).join(', ')}
- Investment Commitments: ${earnings.investmentCommitments.length} mentioned
`
  }

  const promptText = `You are M.O.R.U.O, a business value evaluator. Based on the following analysis, provide a recommendation.

Project: ${projectBasics.name}
Industry: ${benchmark.name}
Investment: $${projectBasics.investmentAmount.toLocaleString()}
Timeline: ${projectBasics.timelineMonths} months

Financial Results (Realistic Scenario):
- ROI: ${realisticROI}%
- NPV: $${realisticNPV.toLocaleString()}
- Payback Period: ${payback} months
- Net Benefit: $${results.realistic.netBenefit.toLocaleString()}

Strategic Factors (scored 1-5):
- Competitive Differentiation: ${strategicFactors.competitiveDifferentiation}
- Risk Mitigation: ${strategicFactors.riskMitigation}
- Customer Experience: ${strategicFactors.customerExperience}
- Employee Productivity: ${strategicFactors.employeeProductivity}
- Regulatory Compliance: ${strategicFactors.regulatoryCompliance}
- Innovation Enablement: ${strategicFactors.innovationEnablement}
- Average Strategic Score: ${strategicScore.toFixed(1)}
${marketContextText}
${marketContextText ? 'Consider how the market context (stock performance and earnings sentiment) validates or challenges this investment decision. Strong positive market sentiment and technology focus in earnings calls support the investment case.' : ''}

Provide a recommendation with the following structure:
1. Decision: "go", "no-go", or "conditional" (conditional if ROI is marginal but strategic value is high)
2. Priority: "critical", "high", "medium", or "low"
3. Reasoning: 2-3 sentences explaining the decision based on financial and strategic factors${marketContextText ? ' and market context' : ''}
4. Next Steps: 3-4 specific action items (as array of strings)
5. Success Metrics: 3-4 KPIs to track (as array of strings)
6. Risks: 2-3 key implementation risks (as array of strings)

Return your response as valid JSON with properties: decision, priority, reasoning, nextSteps (array), successMetrics (array), risks (array).`

  try {
    const response = await window.spark.llm(promptText, 'gpt-4o', true)
    const parsed = JSON.parse(response)
    
    return {
      decision: parsed.decision || 'conditional',
      priority: parsed.priority || 'medium',
      reasoning: parsed.reasoning || 'Analysis complete. Review financial metrics and strategic alignment.',
      nextSteps: parsed.nextSteps || ['Review with stakeholders', 'Develop implementation plan', 'Identify resources'],
      successMetrics: parsed.successMetrics || ['ROI tracking', 'Adoption rate', 'Cost savings realized'],
      risks: parsed.risks || ['Implementation complexity', 'Change management', 'Budget overruns'],
    }
  } catch (error) {
    let decision: 'go' | 'no-go' | 'conditional' = 'conditional'
    let priority: Priority = 'medium'

    if (realisticROI > 50 && strategicScore >= 3.5) {
      decision = 'go'
      priority = 'high'
    } else if (realisticROI < 20 && strategicScore < 3) {
      decision = 'no-go'
      priority = 'low'
    }

    return {
      decision,
      priority,
      reasoning: `Based on ${realisticROI.toFixed(1)}% ROI and strategic score of ${strategicScore.toFixed(1)}/5, this initiative shows ${decision === 'go' ? 'strong' : decision === 'no-go' ? 'insufficient' : 'moderate'} business value potential.`,
      nextSteps: [
        'Conduct stakeholder review session',
        'Develop detailed implementation roadmap',
        'Identify required resources and budget',
        'Define success metrics and tracking mechanisms',
      ],
      successMetrics: [
        `Achieve ${realisticROI.toFixed(0)}% ROI within ${projectBasics.timelineMonths} months`,
        'Track cost savings and revenue impact monthly',
        'Monitor user adoption and satisfaction scores',
        'Measure efficiency improvements against baseline',
      ],
      risks: [
        'Implementation complexity may extend timeline',
        'Change management resistance from stakeholders',
        'Technology integration challenges',
      ],
    }
  }
}
