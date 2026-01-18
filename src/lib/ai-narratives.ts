/**
 * AI Narrative Generation
 * Generate audience-specific business case narratives
 */

import { sendChatMessage } from './ai-client'
import type { Analysis, DealType } from './types'
import { DEAL_TYPE_INFO } from './types'
import type { MonteCarloResults } from './monte-carlo'
import { formatCurrency, formatPercent } from './calculations'
import { formatCustomerOutcomes } from './customer-outcomes'

export type NarrativeAudience = 'customer' | 'internal' | 'executive'

export interface GeneratedNarrative {
  audience: NarrativeAudience
  title: string
  summary: string
  valueProposition: string
  keyBenefits: string[]
  financialHighlights: string
  riskStatement: string
  callToAction: string
  generatedAt: number
}

export interface NarrativeCache {
  customer?: GeneratedNarrative
  internal?: GeneratedNarrative
  executive?: GeneratedNarrative
}

/**
 * Get deal-type specific instructions for narrative generation
 */
function getDealTypeInstructions(dealType: DealType, audience: NarrativeAudience): string {
  const dealTypeGuidance: Record<DealType, Record<NarrativeAudience, string>> = {
    'new-business': {
      customer: `This is a NEW BUSINESS deal - focus on transformative value and reduced risk of trying something new. 
Emphasize: proof points, case studies references, strong ROI justification, and low-risk onboarding.`,
      internal: `This is a NEW BUSINESS acquisition - focus on land-and-expand potential.
Emphasize: customer acquisition cost justification, logo value, expansion potential, competitive positioning.`,
      executive: `NEW LOGO ACQUISITION - highlight strategic value of winning this customer.
Key points: Market expansion, competitive win, platform land opportunity.`
    },
    'renewal': {
      customer: `This is a RENEWAL - focus on value already delivered and continued partnership benefits.
Emphasize: achievements during current term, risk of switching, roadmap alignment, relationship continuity.`,
      internal: `This is a RENEWAL deal - protect existing revenue and expand.
Emphasize: retention priority, churn risk if lost, upsell opportunities, customer health metrics.`,
      executive: `RENEWAL PROTECTION - this is existing revenue at risk.
Key points: Retention rate impact, customer lifetime value, competitive threats.`
    },
    'upsell-cross-sell': {
      customer: `This is an EXPANSION opportunity - focus on incremental value and integration benefits.
Emphasize: synergies with existing investments, reduced complexity, accelerated time-to-value.`,
      internal: `This is UPSELL/CROSS-SELL - expand wallet share with existing customer.
Emphasize: expansion revenue, lower CAC than new business, reference potential, solution breadth.`,
      executive: `EXPANSION REVENUE - growing an existing account.
Key points: Wallet share growth, lower cost to close, account health indicator.`
    },
    'competitive': {
      customer: `This is a COMPETITIVE displacement - focus on clear differentiation and migration support.
Emphasize: capability gaps in current solution, migration assistance, long-term platform advantages.`,
      internal: `This is a COMPETITIVE takeout - displacing incumbent competitor.
Emphasize: competitive intelligence, win strategy, migration support requirements, pricing strategy.`,
      executive: `COMPETITIVE WIN - taking share from competitor.
Key points: Market share impact, competitive intelligence value, strategic win importance.`
    },
    'azure-macc': {
      customer: `This is an AZURE MACC commitment - focus on cloud transformation value and consumption optimization.
Emphasize: Azure platform benefits, consumption efficiency, hybrid flexibility, innovation acceleration.`,
      internal: `This is AZURE MACC - focus on consumption growth and commitment value.
Emphasize: ACR growth, consumption trajectory, workload migration, Copilot/AI adoption potential.`,
      executive: `AZURE MACC DEAL - cloud commitment driving consumption.
Key points: ACR trajectory, consumption growth rate, strategic workload migrations.`
    }
  }

  return dealTypeGuidance[dealType][audience]
}

function buildPrompt(
  analysis: Analysis,
  audience: NarrativeAudience,
  monteCarloResults?: MonteCarloResults
): string {
  const { projectBasics, results, recommendation } = analysis
  const realistic = results.realistic
  const dealType = projectBasics.dealType || 'new-business'
  const dealInfo = DEAL_TYPE_INFO[dealType]

  const customerOutcomes = formatCustomerOutcomes(projectBasics.customerOutcomes)
  const outcomesNotes = (projectBasics.customerOutcomesNotes || '').trim()
  const outcomesSection =
    customerOutcomes.length > 0 || outcomesNotes.length > 0
      ? `

Customer-Stated Outcomes (Benefits):
${customerOutcomes.length > 0 ? `- ${customerOutcomes.join('\n- ')}` : '- (not specified)'}
${outcomesNotes ? `\nOutcomes Notes: ${outcomesNotes}` : ''}
`
      : ''

  const mcSection = monteCarloResults
    ? `

Monte Carlo Analysis (${monteCarloResults.iterations.toLocaleString()} simulations):
- ROI: ${monteCarloResults.roi.p10.toFixed(1)}% (P10) to ${monteCarloResults.roi.p90.toFixed(1)}% (P90), median ${monteCarloResults.roi.p50.toFixed(1)}%
- Probability of positive ROI: ${monteCarloResults.probabilityOfPositiveROI.toFixed(0)}%
- Probability of payback within ${projectBasics.timelineMonths} months: ${monteCarloResults.probabilityOfPaybackWithinTimeline.toFixed(0)}%`
    : ''

  const dealTypeSection = `
Deal Type: ${dealInfo.name}
Deal Context: ${dealInfo.description}
Pricing Approach: ${dealInfo.characteristics.pricingApproach}
Key Proposal Points: ${dealInfo.characteristics.proposalEmphasis.join('; ')}
Key Success Metrics: ${dealInfo.characteristics.keyMetrics.join('; ')}
Risk Factors to Address: ${dealInfo.characteristics.riskFactors.join('; ')}`

  const dealTypeInstructions = getDealTypeInstructions(dealType, audience)

  const baseContext = `
Use Case: ${projectBasics.name}
Customer: ${projectBasics.customerName}
Industry: ${projectBasics.industry}
Solution Area: ${projectBasics.solutionAreas?.join(', ') || projectBasics.solutionArea}
Investment: ${formatCurrency(projectBasics.investmentAmount)}
Timeline: ${projectBasics.timelineMonths} months
${dealTypeSection}
${outcomesSection}

Financial Projections (Realistic Scenario):
- ROI: ${formatPercent(realistic.roi)}
- NPV: ${formatCurrency(realistic.npv)}
- Payback Period: ${realistic.paybackMonths.toFixed(1)} months
- Net Benefit: ${formatCurrency(realistic.netBenefit)}
${mcSection}

Recommendation: ${recommendation.decision.toUpperCase()} (${recommendation.priority} priority)
Reasoning: ${recommendation.reasoning}

Key Risks: ${recommendation.risks.join('; ')}
Success Metrics: ${recommendation.successMetrics.join('; ')}
`

  const audienceInstructions: Record<NarrativeAudience, string> = {
    customer: `You are writing for an EXTERNAL CUSTOMER audience. 
Focus on:
- Business value and outcomes they will achieve
- Use the customer-stated outcomes (benefits) as the primary storyline when provided
- Competitive advantages and market positioning
- Risk mitigation and confidence (use Monte Carlo probabilities if available)
- Clear ROI and payback messaging
- Professional but persuasive tone
- Avoid internal jargon or Microsoft-specific terminology

Generate a compelling business case narrative that helps the customer justify this investment internally.`,

    internal: `You are writing for an INTERNAL MICROSOFT audience (account teams, managers).
Focus on:
- Deal qualification and prioritization rationale
- Customer engagement strategy
  - Anchor the narrative in the customer-stated outcomes and translate them into measurable success criteria
- Resource requirements and timeline
- Risk factors and mitigation strategies
- Success metrics and tracking approach
- Cross-sell/upsell opportunities
- Competitive positioning

Generate a practical planning document that helps the team execute this opportunity.`,

    executive: `You are writing for EXECUTIVE leadership (VP+, C-suite).
Focus on:
- Strategic value and market impact
  - Tie strategic value to customer-stated outcomes (benefits) when provided
- Portfolio-level contribution
- Key financial metrics with confidence ranges
- Decision recommendation (go/no-go/conditional)
- Top 3 risks and mitigations
- Resource/investment ask

Be extremely concise. Executives have 2 minutes to review. Use bullet points where appropriate.`,
  }

  return `${audienceInstructions[audience]}

DEAL TYPE CONTEXT:
${dealTypeInstructions}

${baseContext}

Generate a narrative with the following sections (return as JSON):
{
  "title": "A compelling title for this business case",
  "summary": "2-3 sentence executive summary",
  "valueProposition": "The core value proposition in 1-2 sentences",
  "keyBenefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
  "financialHighlights": "Key financial metrics and what they mean",
  "riskStatement": "Balanced risk statement with mitigation",
  "callToAction": "Clear next step or recommendation"
}`
}

export async function generateNarrative(
  analysis: Analysis,
  audience: NarrativeAudience,
  monteCarloResults?: MonteCarloResults
): Promise<GeneratedNarrative> {
  const prompt = buildPrompt(analysis, audience, monteCarloResults)

  const response = await sendChatMessage(
    [
      {
        role: 'system',
        content:
          'You are a senior business analyst creating compelling, professional business case narratives. Always respond with valid JSON matching the requested structure.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.6, maxTokens: 1500 }
  )

  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim())

    return {
      audience,
      title: parsed.title || `${analysis.projectBasics.name} Business Case`,
      summary: parsed.summary || '',
      valueProposition: parsed.valueProposition || '',
      keyBenefits: parsed.keyBenefits || [],
      financialHighlights: parsed.financialHighlights || '',
      riskStatement: parsed.riskStatement || '',
      callToAction: parsed.callToAction || '',
      generatedAt: Date.now(),
    }
  } catch {
    // Fallback if JSON parsing fails
    return {
      audience,
      title: `${analysis.projectBasics.name} Business Case`,
      summary: response.slice(0, 500),
      valueProposition: '',
      keyBenefits: [],
      financialHighlights: '',
      riskStatement: '',
      callToAction: '',
      generatedAt: Date.now(),
    }
  }
}

export async function generateAllNarratives(
  analysis: Analysis,
  monteCarloResults?: MonteCarloResults
): Promise<NarrativeCache> {
  const [customer, internal, executive] = await Promise.all([
    generateNarrative(analysis, 'customer', monteCarloResults),
    generateNarrative(analysis, 'internal', monteCarloResults),
    generateNarrative(analysis, 'executive', monteCarloResults),
  ])

  return { customer, internal, executive }
}
