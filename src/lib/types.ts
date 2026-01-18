// Note: MonteCarloResults and NarrativeCache are imported dynamically to avoid circular deps
// Use `import type { MonteCarloResults } from './monte-carlo'` where needed

export type Industry = 'banking' | 'technology' | 'retail' | 'manufacturing' | 'general'

export type Priority = 'critical' | 'high' | 'medium' | 'low'

export type Scenario = 'conservative' | 'realistic' | 'optimistic'

export type OrganizationLevel = 'subsidiary' | 'region' | 'global'

export type SolutionArea = 
  | 'AI Business Solutions'
  | 'Cloud & AI Platforms'
  | 'Security'
  | 'Other'

export type DealType = 
  | 'new-business'
  | 'renewal'
  | 'upsell-cross-sell'
  | 'competitive'
  | 'azure-macc'

export interface DealTypeInfo {
  id: DealType
  name: string
  shortName: string
  description: string
  characteristics: {
    pricingApproach: string
    proposalEmphasis: string[]
    keyMetrics: string[]
    riskFactors: string[]
  }
  defaultProjections: Partial<ImpactProjections>
  defaultStrategicWeights: Partial<StrategicFactors>
}

export const DEAL_TYPE_INFO: Record<DealType, DealTypeInfo> = {
  'new-business': {
    id: 'new-business',
    name: 'New Business (Acquisition)',
    shortName: 'New Business',
    description: 'Selling to a new customer or new solution area with no prior Microsoft contract',
    characteristics: {
      pricingApproach: 'Strong value proposition with introductory discounts, ramped pricing, or bundles to reduce risk',
      proposalEmphasis: [
        'Business value assessments and TCO analyses',
        'Case studies and proof points',
        'Success metrics projections',
        'ROI justification for new spend',
      ],
      keyMetrics: [
        'Expected ROI over contract term',
        'Time to value realization',
        'Total Cost of Ownership comparison',
        'Projected efficiency gains',
      ],
      riskFactors: [
        'Customer adoption uncertainty',
        'Implementation complexity',
        'Change management challenges',
        'Competitive alternatives',
      ],
    },
    defaultProjections: {
      revenueGrowthRate: 15,
      costReduction: 20,
      efficiencyGain: 25,
      timeToMarketImprovement: 20,
    },
    defaultStrategicWeights: {
      competitiveDifferentiation: 4,
      innovationEnablement: 4,
      customerExperience: 3,
    },
  },
  'renewal': {
    id: 'renewal',
    name: 'Renewal',
    shortName: 'Renewal',
    description: 'Extending an existing contract at expiry, focusing on retention and growth',
    characteristics: {
      pricingApproach: 'Continuity with added value, price predictability, possible concessions to prevent churn',
      proposalEmphasis: [
        'Outcome-based reporting of past performance',
        'Usage statistics and ROI achieved',
        'Future roadmap and enhancements',
        'Customer success highlights',
      ],
      keyMetrics: [
        'Value realized in current term',
        'Adoption/usage rates',
        'Spend recapture percentage (>=100%)',
        'Customer satisfaction scores',
      ],
      riskFactors: [
        'Competitive displacement',
        'Budget constraints',
        'Stakeholder changes',
        'Underutilization of existing licenses',
      ],
    },
    defaultProjections: {
      revenueGrowthRate: 8,
      costReduction: 12,
      efficiencyGain: 15,
      timeToMarketImprovement: 10,
    },
    defaultStrategicWeights: {
      riskMitigation: 4,
      customerExperience: 4,
      employeeProductivity: 4,
    },
  },
  'upsell-cross-sell': {
    id: 'upsell-cross-sell',
    name: 'Upsell / Cross-Sell (Expansion)',
    shortName: 'Expansion',
    description: 'Selling more to an existing customer - additional quantity or new products',
    characteristics: {
      pricingApproach: 'Leverages existing relationship with co-termed, prorated pricing and bundle deals',
      proposalEmphasis: [
        'Current usage and success data',
        'Incremental value from expansion',
        'Seamless integration with existing solutions',
        'QBR-style targeted messaging',
      ],
      keyMetrics: [
        'Current license utilization rate',
        'Incremental ROI from expansion',
        'Cloud consumption growth',
        'Seat adoption rates',
      ],
      riskFactors: [
        'Budget availability',
        'Integration complexity',
        'User adoption for new features',
        'Competing priorities',
      ],
    },
    defaultProjections: {
      revenueGrowthRate: 12,
      costReduction: 15,
      efficiencyGain: 20,
      timeToMarketImprovement: 15,
    },
    defaultStrategicWeights: {
      employeeProductivity: 4,
      innovationEnablement: 4,
      customerExperience: 3,
    },
  },
  'competitive': {
    id: 'competitive',
    name: 'Competitive (Compete) Deal',
    shortName: 'Compete',
    description: 'Deal where a competitor is in play or incumbent - requires displacing a rival',
    characteristics: {
      pricingApproach: 'Aggressive pricing with maximum discounts, migration funding, and extended terms',
      proposalEmphasis: [
        'Feature and cost comparisons vs. competitor',
        'Switch case studies and success stories',
        'TCO analysis showing long-term benefits',
        'Tailored pilot results',
      ],
      keyMetrics: [
        'Competitive TCO comparison',
        'Migration cost and timeline',
        'Feature parity analysis',
        'Long-term value advantage',
      ],
      riskFactors: [
        'Competitor counter-offers',
        'Migration risks',
        'Customer relationship with incumbent',
        'Switching costs',
      ],
    },
    defaultProjections: {
      revenueGrowthRate: 18,
      costReduction: 25,
      efficiencyGain: 30,
      timeToMarketImprovement: 20,
    },
    defaultStrategicWeights: {
      competitiveDifferentiation: 5,
      riskMitigation: 4,
      customerExperience: 4,
    },
  },
  'azure-macc': {
    id: 'azure-macc',
    name: 'Azure MACC (Consumption Commitment)',
    shortName: 'MACC',
    description: 'Multi-year commitment to Azure consumption with strategic partnership benefits',
    characteristics: {
      pricingApproach: 'Significant upfront value including Azure credits, partner funding, and locked-in discounts',
      proposalEmphasis: [
        'Cloud journey roadmap and consumption plan',
        'Consumption tracking and milestones',
        'Value realization reports',
        'Strategic partnership benefits',
      ],
      keyMetrics: [
        'Committed spend vs. actual consumption',
        'Workload migration progress',
        'Cloud modernization achievements',
        'Cost savings from cloud transition',
      ],
      riskFactors: [
        'Consumption shortfall risk',
        'Workload migration delays',
        'Technical complexity',
        'Organizational readiness',
      ],
    },
    defaultProjections: {
      revenueGrowthRate: 10,
      costReduction: 20,
      efficiencyGain: 25,
      timeToMarketImprovement: 30,
    },
    defaultStrategicWeights: {
      innovationEnablement: 5,
      competitiveDifferentiation: 4,
      employeeProductivity: 3,
    },
  },
}

export interface ProjectBasics {
  name: string
  customerName: string
  subsidiary: string
  region: string
  description: string
  industry: Industry
  dealType: DealType
  solutionArea: SolutionArea
  solutionAreas?: SolutionArea[]
  /** Customer-stated outcomes/benefits they are targeting (used to guide projections and narrative) */
  customerOutcomes?: string[]
  /** Optional free-text context to help tailor customer-facing narratives */
  customerOutcomesNotes?: string
  investmentAmount: number
  timelineMonths: number
  // MACC-specific fields
  maccCommitmentAmount?: number
  maccTermYears?: number
  // Competitive deal fields
  competitorName?: string
  incumbentSolution?: string
  // Renewal fields
  previousContractValue?: number
  previousTermYears?: number
}

export interface BaselineMetrics {
  currentRevenue?: number
  currentCosts?: number
  employeeCount?: number
  currentAssets?: number
  currentCashFlow?: number
}

export interface ImpactProjections {
  revenueGrowthRate: number
  costReduction: number
  efficiencyGain: number
  timeToMarketImprovement: number
}

export interface StrategicFactors {
  competitiveDifferentiation: number
  riskMitigation: number
  customerExperience: number
  employeeProductivity: number
  regulatoryCompliance: number
  innovationEnablement: number
}

export interface CalculatedMetrics {
  roi: number
  npv: number
  paybackMonths: number
  revenueImpact: number
  costSavings: number
  netBenefit: number
}

export interface ScenarioResults {
  conservative: CalculatedMetrics
  realistic: CalculatedMetrics
  optimistic: CalculatedMetrics
}

export interface StockData {
  ticker: string
  price: number
  change: number
  changePercent: number
  marketCap: number
  peRatio: number | null
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  volume: number
  lastUpdated: string
  companyName: string
}

export interface EarningsMention {
  category: string
  count: number
  quotes: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
}

export interface EarningsInsights {
  transcriptDate: string
  quarter: string
  year: number
  overallSentiment: 'positive' | 'neutral' | 'negative'
  technologyMentions: EarningsMention[]
  investmentCommitments: {
    amount: number | null
    category: string
    quote: string
  }[]
  strategicThemes: string[]
  riskFactors: string[]
}

export interface FundamentalData {
  ticker: string
  companyName: string
  lastUpdated: string
  dataSource: 'company' | 'industry-etf' | 'hardcoded' // Track data source
  
  // Income Statement Metrics
  revenue: number
  revenueGrowthYoY: number
  grossProfit: number
  grossMargin: number
  operatingIncome: number
  operatingMargin: number
  netIncome: number
  netMargin: number
  eps: number
  epsGrowthYoY: number
  
  // Balance Sheet Metrics
  totalAssets: number
  totalLiabilities: number
  totalEquity: number
  cash: number
  debt: number
  debtToEquity: number
  currentRatio: number
  
  // Cash Flow Metrics
  operatingCashFlow: number
  freeCashFlow: number
  freeCashFlowPerShare: number
  freeCashFlowYield: number
  
  // Valuation Metrics
  marketCap: number
  enterpriseValue: number
  peRatio: number | null
  priceToBook: number
  priceToSales: number
  evToEbitda: number | null
  
  // Profitability Metrics
  returnOnEquity: number
  returnOnAssets: number
  returnOnInvestedCapital: number
}

export interface BusinessImpactAssessment {
  useCaseId: string
  customerName: string
  ticker?: string
  isPrivateCompany: boolean
  
  // Financial Health Indicators (0-100 scores)
  financialHealthScore: number
  liquidityScore: number
  profitabilityScore: number
  growthScore: number
  
  // Impact Analysis
  revenueImpactPotential: 'high' | 'medium' | 'low'
  costSavingsRelevance: 'high' | 'medium' | 'low'
  cashFlowImprovement: 'high' | 'medium' | 'low'
  
  // Investment Capacity Assessment
  investmentCapacity: 'strong' | 'moderate' | 'limited'
  recommendedInvestmentRange: {
    min: number
    max: number
  }
  
  // Strategic Alignment
  alignmentScore: number // 0-100
  alignmentRationale: string
  
  // Key Insights
  insights: {
    title: string
    description: string
    impact: 'positive' | 'neutral' | 'negative'
    metric?: string
  }[]
  
  // Risk Factors
  risks: {
    category: string
    description: string
    severity: 'high' | 'medium' | 'low'
  }[]
}

export interface MarketContext {
  stockData?: StockData
  fundamentals?: FundamentalData
  earningsInsights?: EarningsInsights
  industryIndex?: {
    name: string
    value: number
    change: number
    changePercent: number
  }
  isPrivateCompany?: boolean
  usingIndustryFallback?: boolean
}

export interface Analysis {
  id: string
  createdAt: number
  updatedAt: number
  projectBasics: ProjectBasics
  baselineMetrics: BaselineMetrics
  impactProjections: ImpactProjections
  strategicFactors: StrategicFactors
  results: ScenarioResults
  recommendation: {
    decision: 'go' | 'no-go' | 'conditional'
    priority: Priority
    reasoning: string
    nextSteps: string[]
    successMetrics: string[]
    risks: string[]
  }
  marketContext?: MarketContext
  ticker?: string
  // These use 'any' to avoid circular imports - cast to proper types when using
  // MonteCarloResults from './monte-carlo', NarrativeCache from './ai-narratives'
  monteCarloResults?: unknown
  narratives?: unknown
}
