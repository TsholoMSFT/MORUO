import axios from 'axios'
import type { EarningsInsights, EarningsMention } from './types'

// Using Alpha Vantage for earnings data (free tier)
const ALPHA_VANTAGE_KEY = import.meta.env.VITE_ALPHA_VANTAGE_KEY || 'demo'

/**
 * Fetch earnings transcript and analyze with AI
 * Note: Alpha Vantage free tier doesn't include transcripts, so we'll fetch earnings data
 * and use Spark LLM to analyze any available text data
 */
export async function fetchEarningsData(ticker: string): Promise<any | null> {
  try {
    // Alpha Vantage provides earnings data but not full transcripts in free tier
    // We'll fetch earnings dates and then use that to guide analysis
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'EARNINGS',
        symbol: ticker,
        apikey: ALPHA_VANTAGE_KEY,
      },
      timeout: 5000,
    })

    return response.data
  } catch (error) {
    console.error('Error fetching earnings data:', error)
    return null
  }
}

/**
 * Analyze text (earnings call transcript, press release, or financial report) using Spark LLM
 */
export async function analyzeEarningsText(
  text: string,
  companyName: string,
  quarter: string,
  year: number
): Promise<EarningsInsights | null> {
  try {
    if (!window.spark?.llm) {
      console.error('Spark LLM not available')
      return null
    }

    const prompt = `You are a financial analyst AI. Analyze this earnings-related text for ${companyName} (${quarter} ${year}) and extract structured insights about technology investments and strategic direction.

Text to analyze:
"""
${text}
"""

Provide your analysis in the following JSON format:
{
  "overallSentiment": "positive|neutral|negative",
  "technologyMentions": [
    {
      "category": "AI/ML|Cloud|Cybersecurity|Digital Transformation|Other",
      "count": number,
      "quotes": ["relevant quote 1", "relevant quote 2"],
      "sentiment": "positive|neutral|negative"
    }
  ],
  "investmentCommitments": [
    {
      "amount": number or null,
      "category": "Technology|Infrastructure|R&D|Other",
      "quote": "direct quote mentioning the commitment"
    }
  ],
  "strategicThemes": ["theme1", "theme2", "theme3"],
  "riskFactors": ["risk1", "risk2"]
}

Focus on:
1. Technology initiatives mentioned (AI, cloud, security, automation, etc.)
2. Investment amounts and commitments
3. Strategic priorities and themes
4. Technology-related risks or challenges
5. Overall sentiment toward technology investments

Return ONLY valid JSON, no additional text.`

    const response = await window.spark.llm(prompt, 'gpt-4o', true)
    
    // Parse the LLM response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('Could not parse LLM response as JSON')
      return null
    }

    const analysis = JSON.parse(jsonMatch[0])
    
    return {
      transcriptDate: new Date().toISOString().split('T')[0],
      quarter,
      year,
      overallSentiment: analysis.overallSentiment || 'neutral',
      technologyMentions: analysis.technologyMentions || [],
      investmentCommitments: analysis.investmentCommitments || [],
      strategicThemes: analysis.strategicThemes || [],
      riskFactors: analysis.riskFactors || [],
    }
  } catch (error) {
    console.error('Error analyzing earnings text:', error)
    return null
  }
}

/**
 * Generate mock earnings insights for demonstration
 * In production, this would fetch real transcript data from SEC EDGAR or commercial APIs
 */
export function generateMockEarningsInsights(
  companyName: string,
  quarter: string,
  year: number
): EarningsInsights {
  const techCategories = ['AI/ML', 'Cloud Infrastructure', 'Cybersecurity', 'Digital Transformation']
  const randomCategory = techCategories[Math.floor(Math.random() * techCategories.length)]
  
  return {
    transcriptDate: new Date().toISOString().split('T')[0],
    quarter,
    year,
    overallSentiment: 'positive',
    technologyMentions: [
      {
        category: randomCategory,
        count: 8,
        quotes: [
          `We're accelerating our ${randomCategory.toLowerCase()} investments to drive operational efficiency`,
          `Our technology transformation is yielding strong results across the organization`,
        ],
        sentiment: 'positive',
      },
      {
        category: 'Digital Transformation',
        count: 5,
        quotes: [
          'Digital initiatives contributed to a 15% improvement in customer satisfaction',
        ],
        sentiment: 'positive',
      },
    ],
    investmentCommitments: [
      {
        amount: 50000000,
        category: 'Technology',
        quote: 'We are committing $50 million to technology infrastructure over the next fiscal year',
      },
    ],
    strategicThemes: [
      'Operational excellence through automation',
      'Customer experience enhancement',
      'Data-driven decision making',
      'Competitive differentiation',
    ],
    riskFactors: [
      'Cybersecurity threats in increasingly digital environment',
      'Rapid pace of technology change requiring continuous investment',
    ],
  }
}

/**
 * Calculate sentiment score from insights (-1 to 1)
 */
export function calculateSentimentScore(insights: EarningsInsights): number {
  const sentimentMap = { positive: 1, neutral: 0, negative: -1 }
  let totalScore = sentimentMap[insights.overallSentiment]
  let count = 1

  insights.technologyMentions.forEach((mention) => {
    totalScore += sentimentMap[mention.sentiment] * mention.count
    count += mention.count
  })

  return totalScore / count
}

/**
 * Extract key technology themes with counts
 */
export function extractTechThemes(insights: EarningsInsights): Record<string, number> {
  const themes: Record<string, number> = {}
  
  insights.technologyMentions.forEach((mention) => {
    themes[mention.category] = (themes[mention.category] || 0) + mention.count
  })
  
  return themes
}
