/**
 * Business Value Tool V2.0 - Type Definitions
 * 
 * Comprehensive types for ROI quantification, benchmarking, and scenario modeling.
 */

// ============================================================================
// INVESTMENT TYPES
// ============================================================================

export interface InvestmentBreakdown {
  licensing: number;
  azureConsumption: number;
  developmentEffort: number;
  implementationServices: number;
  partnerServices: number;
  esfEsofCoInvestment: number;
  changeManagement: number;
  training: number;
  contingency: number;
  other: number;
  otherDescription?: string;
}

export interface InvestmentSummary {
  breakdown: InvestmentBreakdown;
  totalInvestment: number;
  netInvestment: number; // After co-investment deductions
  annualizedCost: number; // For multi-year analysis
  costBreakdownPercentages: Record<keyof InvestmentBreakdown, number>;
}

// ============================================================================
// RETURN CATEGORY TYPES
// ============================================================================

export type ReturnCategoryType = 
  | 'revenue_impact'
  | 'margin_uplift'
  | 'productivity_gain'
  | 'cost_reduction'
  | 'risk_avoidance'
  | 'time_to_market';

export interface ReturnCategoryConfig {
  id: ReturnCategoryType;
  label: string;
  description: string;
  requiredInputs: string[];
  formula: string;
  formulaExplanation: string;
  typicalRange: { min: number; max: number; unit: string };
  applicableIndustries: string[];
}

export interface RevenueImpactInputs {
  annualRevenue: number;
  expectedImpactPercent: number;
  timeToFullImpact: number; // months
  confidenceLevel: 'conservative' | 'realistic' | 'optimistic';
}

export interface MarginUpliftInputs {
  annualRevenue: number;
  currentMarginPercent: number;
  expectedMarginPercent: number;
  affectedRevenuePercent: number;
}

export interface ProductivityGainInputs {
  employeesAffected: number;
  averageHourlyCost: number;
  currentHoursPerWeek: number;
  expectedHoursSaved: number;
  productivityCaptureRate: number; // 0-1, typically 0.75
}

export interface CostReductionInputs {
  currentAnnualCost: number;
  expectedReductionPercent: number;
  realizationTimeMonths: number;
  sustainabilityFactor: number; // 0-1, how likely savings persist
}

export interface RiskAvoidanceInputs {
  annualRiskExposure: number;
  probabilityOfOccurrence: number;
  expectedRiskReduction: number;
  compliancePenaltyAvoided?: number;
}

export interface TimeToMarketInputs {
  monthsAccelerated: number;
  monthlyRevenueOpportunity: number;
  marketWindowMonths: number;
  competitiveAdvantageMultiplier: number;
}

export type ReturnCategoryInputs = 
  | { type: 'revenue_impact'; inputs: RevenueImpactInputs }
  | { type: 'margin_uplift'; inputs: MarginUpliftInputs }
  | { type: 'productivity_gain'; inputs: ProductivityGainInputs }
  | { type: 'cost_reduction'; inputs: CostReductionInputs }
  | { type: 'risk_avoidance'; inputs: RiskAvoidanceInputs }
  | { type: 'time_to_market'; inputs: TimeToMarketInputs };

// ============================================================================
// RETURN CALCULATION RESULTS
// ============================================================================

export interface ReturnCalculationResult {
  categoryType: ReturnCategoryType;
  categoryLabel: string;
  annualReturn: number;
  threeYearReturn: number;
  formulaUsed: string;
  calculationSteps: CalculationStep[];
  assumptions: string[];
  confidenceLevel: number; // 0-100
  dataQuality: 'high' | 'medium' | 'low';
}

export interface CalculationStep {
  stepNumber: number;
  description: string;
  formula: string;
  inputs: Record<string, number | string>;
  result: number;
  unit: string;
}

// ============================================================================
// BENCHMARK TYPES
// ============================================================================

export interface IndustryBenchmark {
  id: string;
  industry: string;
  metric: string;
  value: number;
  unit: string;
  percentile: number; // 25, 50, 75
  source: string;
  sourceYear: number;
  sampleSize?: number;
  jurisdiction?: string;
  notes?: string;
}

export interface CompanyBenchmark {
  id: string;
  metricName: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  thresholdROI?: number;
  targetPaybackMonths?: number;
  targetIRR?: number;
  notes?: string;
}

export interface BenchmarkComparison {
  metric: string;
  yourValue: number;
  industryAverage: number;
  industryTop25: number;
  companyTarget?: number;
  gap: number;
  gapPercent: number;
  status: 'above' | 'at' | 'below';
}

// ============================================================================
// SCENARIO MODELING TYPES
// ============================================================================

export type ScenarioType = 'conservative' | 'realistic' | 'optimistic';

export interface ScenarioConfig {
  type: ScenarioType;
  label: string;
  multiplier: number;
  percentile: number; // Statistical percentile (25, 50, 75)
  confidenceLevel: number; // Probability of achieving or exceeding
  color: string;
  description: string;
  dataSource?: string;
  userOverride?: boolean;
}

export interface ScenarioResult {
  scenario: ScenarioType;
  totalReturn: number;
  roi: number;
  paybackMonths: number;
  npv: number;
  irr: number;
  confidenceInterval: { lower: number; upper: number };
}

export interface MonteCarloResult {
  iterations: number;
  mean: number;
  median: number;
  standardDeviation: number;
  percentiles: {
    p10: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
  };
  histogram: Array<{ bucket: number; count: number }>;
  probabilityOfPositiveROI: number;
}

// ============================================================================
// STRATEGIC FACTORS TYPES
// ============================================================================

export interface StrategicFactor {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-100, how much this factor contributes to strategic score
  score: number; // 1-5, user rating
  weightedScore: number; // weight × score
  impactDescription: string;
}

export interface StrategicScoreResult {
  totalScore: number; // 0-100
  maxPossibleScore: number;
  scorePercentage: number;
  factors: StrategicFactor[];
  qualitativeAssessment: string;
  recommendations: string[];
}

// ============================================================================
// OUTCOME/KPI TYPES
// ============================================================================

export interface OutcomeKPI {
  id: string;
  name: string;
  category: 'financial' | 'operational' | 'strategic' | 'customer' | 'employee' | 'other';
  isCustom: boolean;
  description: string;
  weight: number; // 0-100
  targetValue?: number;
  targetUnit?: string;
  notes: string; // Mandatory when isCustom
  linkedReturnCategory?: ReturnCategoryType;
}

export const PREDEFINED_OUTCOMES: Omit<OutcomeKPI, 'weight' | 'notes'>[] = [
  { id: 'revenue_growth', name: 'Revenue Growth', category: 'financial', isCustom: false, description: 'Increase in top-line revenue', linkedReturnCategory: 'revenue_impact' },
  { id: 'cost_savings', name: 'Cost Savings', category: 'financial', isCustom: false, description: 'Reduction in operational costs', linkedReturnCategory: 'cost_reduction' },
  { id: 'margin_improvement', name: 'Margin Improvement', category: 'financial', isCustom: false, description: 'Increase in gross/net margin', linkedReturnCategory: 'margin_uplift' },
  { id: 'productivity_increase', name: 'Productivity Increase', category: 'operational', isCustom: false, description: 'Output per employee improvement', linkedReturnCategory: 'productivity_gain' },
  { id: 'time_reduction', name: 'Process Time Reduction', category: 'operational', isCustom: false, description: 'Faster task completion', linkedReturnCategory: 'productivity_gain' },
  { id: 'quality_improvement', name: 'Quality Improvement', category: 'operational', isCustom: false, description: 'Error reduction, defect decrease' },
  { id: 'customer_satisfaction', name: 'Customer Satisfaction', category: 'customer', isCustom: false, description: 'NPS, CSAT improvements' },
  { id: 'customer_retention', name: 'Customer Retention', category: 'customer', isCustom: false, description: 'Reduced churn, increased loyalty' },
  { id: 'employee_satisfaction', name: 'Employee Satisfaction', category: 'employee', isCustom: false, description: 'eNPS, engagement improvements' },
  { id: 'time_to_market', name: 'Time to Market', category: 'strategic', isCustom: false, description: 'Faster product/feature delivery', linkedReturnCategory: 'time_to_market' },
  { id: 'competitive_advantage', name: 'Competitive Advantage', category: 'strategic', isCustom: false, description: 'Market differentiation' },
  { id: 'risk_reduction', name: 'Risk Reduction', category: 'strategic', isCustom: false, description: 'Compliance, security, operational risk', linkedReturnCategory: 'risk_avoidance' },
  { id: 'scalability', name: 'Scalability', category: 'strategic', isCustom: false, description: 'Ability to grow without proportional cost' },
  { id: 'innovation_enablement', name: 'Innovation Enablement', category: 'strategic', isCustom: false, description: 'Platform for future innovation' },
];

// ============================================================================
// FULL BUSINESS VALUE ASSESSMENT
// ============================================================================

export interface BusinessValueAssessment {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Metadata
  customerName: string;
  projectName: string;
  preparedBy: string;
  analysisVersion: string;
  
  // Investment
  investment: InvestmentSummary;
  
  // Returns (multiple categories)
  returnCategories: ReturnCategoryInputs[];
  returnResults: ReturnCalculationResult[];
  totalAnnualReturn: number;
  totalThreeYearReturn: number;
  
  // Scenarios
  scenarioConfigs: ScenarioConfig[];
  scenarioResults: ScenarioResult[];
  monteCarloResult?: MonteCarloResult;
  
  // Benchmarks
  industryBenchmarks: IndustryBenchmark[];
  companyBenchmarks: CompanyBenchmark[];
  benchmarkComparisons: BenchmarkComparison[];
  
  // Strategic Factors
  strategicFactors: StrategicFactor[];
  strategicScore: StrategicScoreResult;
  
  // Outcomes
  selectedOutcomes: OutcomeKPI[];
  
  // Calculated Metrics
  roi: number;
  paybackMonths: number;
  npv: number;
  irr: number;
  
  // Transparency
  allAssumptions: string[];
  dataSources: string[];
  calculationLog: CalculationStep[];
}

// ============================================================================
// REPORT TYPES
// ============================================================================

export type ReportMode = 'internal' | 'external';

export interface ReportConfig {
  mode: ReportMode;
  includeFormulas: boolean;
  includeAssumptions: boolean;
  includeMethodology: boolean;
  includeBenchmarkSources: boolean;
  includeMonteCarloDetails: boolean;
  executiveSummaryOnly: boolean;
  companyLogo?: string;
  customFooter?: string;
}
