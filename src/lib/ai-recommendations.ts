import type {
  Analysis,
  Priority,
  StrategicFactors,
  ScenarioResults,
  ProjectBasics,
  MarketContext,
} from './types'
import { industryBenchmarks } from './benchmarks'
import { getAIRecommendation, checkAIHealth } from './ai-client'

// Cache AI availability to avoid repeated checks
let aiAvailable: boolean | null = null

async function isAIAvailable(): Promise<boolean> {
  if (aiAvailable === null) {
    aiAvailable = await checkAIHealth()
  }
  return aiAvailable
}

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
    // Check if AI backend is available
    if (await isAIAvailable()) {
      const aiResponse = await getAIRecommendation({
        projectBasics: {
          customerName: projectBasics.customerName || 'Unknown',
          projectName: projectBasics.name,
          solutionArea: projectBasics.solutionArea,
          industry: projectBasics.industry,
          investmentAmount: projectBasics.investmentAmount,
          timelineMonths: projectBasics.timelineMonths,
        },
        results: {
          conservative: {
            roi: results.conservative.roi,
            npv: results.conservative.npv,
            paybackMonths: results.conservative.paybackMonths,
          },
          realistic: {
            roi: results.realistic.roi,
            npv: results.realistic.npv,
            paybackMonths: results.realistic.paybackMonths,
          },
          optimistic: {
            roi: results.optimistic.roi,
            npv: results.optimistic.npv,
            paybackMonths: results.optimistic.paybackMonths,
          },
        },
        strategicFactors: {
          competitiveAdvantage: strategicFactors.competitiveDifferentiation,
          innovationPotential: strategicFactors.innovationEnablement,
          strategicAlignment: strategicFactors.customerExperience,
          riskTolerance: strategicFactors.riskMitigation,
          marketTiming: strategicFactors.employeeProductivity,
        },
        marketContext: marketContext ? {
          stockData: marketContext.stockData ? {
            price: marketContext.stockData.price,
            change: marketContext.stockData.change,
            changePercent: marketContext.stockData.changePercent,
          } : undefined,
          earningsInsights: marketContext.earningsInsights ? {
            sentiment: marketContext.earningsInsights.overallSentiment,
            themes: marketContext.earningsInsights.strategicThemes,
          } : undefined,
        } : undefined,
      })

      // Map AI response to expected format
      return {
        decision: aiResponse.decision === 'proceed' ? 'go' : aiResponse.decision === 'reject' ? 'no-go' : 'conditional',
        priority: aiResponse.priority as Priority,
        reasoning: aiResponse.reasoning,
        nextSteps: aiResponse.nextSteps,
        successMetrics: aiResponse.successMetrics,
        risks: aiResponse.risks,
      }
    }
    
    // Fallback to rule-based if AI not available
    throw new Error('AI service not available - using rule-based recommendations')
  } catch (error) {
    console.warn('AI recommendation failed, using fallback:', error)
    // Rule-based recommendation logic
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
