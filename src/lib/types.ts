export type Industry = 'banking' | 'technology' | 'retail' | 'manufacturing' | 'general'

export type Priority = 'critical' | 'high' | 'medium' | 'low'

export type Scenario = 'conservative' | 'realistic' | 'optimistic'

export type OrganizationLevel = 'subsidiary' | 'region' | 'global'

export type SolutionArea = 
  | 'AI Business Solutions'
  | 'Cloud & AI Platforms'
  | 'Security'
  | 'Other'

export interface ProjectBasics {
  name: string
  customerName: string
  subsidiary: string
  region: string
  description: string
  industry: Industry
  solutionArea: SolutionArea
  solutionAreas?: SolutionArea[]
  investmentAmount: number
  timelineMonths: number
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
}
