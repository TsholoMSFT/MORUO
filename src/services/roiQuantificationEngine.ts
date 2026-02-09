/**
 * ROI Quantification Engine - Business Value Tool V2.0
 * 
 * Core calculation engine providing transparent, defensible ROI calculations
 * with full audit trail of formulas, assumptions, and data sources.
 * 
 * FORMULA SOURCES:
 * - Forrester Total Economic Impact (TEI) Methodology
 * - McKinsey Digital Value Framework
 * - Gartner IT Investment Benchmarks
 */

import {
  ReturnCategoryType,
  ReturnCategoryConfig,
  ReturnCategoryInputs,
  ReturnCalculationResult,
  CalculationStep,
  RevenueImpactInputs,
  MarginUpliftInputs,
  ProductivityGainInputs,
  CostReductionInputs,
  RiskAvoidanceInputs,
  TimeToMarketInputs,
  InvestmentSummary,
  ScenarioType,
  ScenarioConfig,
  ScenarioResult,
  MonteCarloResult,
} from '../types/businessValue';

// ============================================================================
// RETURN CATEGORY CONFIGURATIONS
// ============================================================================

export const RETURN_CATEGORY_CONFIGS: Record<ReturnCategoryType, ReturnCategoryConfig> = {
  revenue_impact: {
    id: 'revenue_impact',
    label: 'Top-Line Revenue Impact',
    description: 'Direct increase in revenue from new sales, upsells, or market expansion enabled by the solution.',
    requiredInputs: ['annualRevenue', 'expectedImpactPercent', 'timeToFullImpact', 'confidenceLevel'],
    formula: 'Revenue Impact = Annual Revenue × Expected Impact % × Realization Factor × Confidence Adjustment',
    formulaExplanation: 'Calculates incremental revenue by applying the expected percentage increase to current revenue, adjusted for time-to-value and confidence level.',
    typicalRange: { min: 1, max: 15, unit: '% of revenue' },
    applicableIndustries: ['technology', 'retail', 'financial_services', 'manufacturing'],
  },
  margin_uplift: {
    id: 'margin_uplift',
    label: 'Gross Margin Uplift / Cost-to-Serve Reduction',
    description: 'Improvement in profit margin through better pricing, reduced cost-to-serve, or operational efficiency.',
    requiredInputs: ['annualRevenue', 'currentMarginPercent', 'expectedMarginPercent', 'affectedRevenuePercent'],
    formula: 'Margin Uplift = Revenue × Affected % × (New Margin % - Current Margin %)',
    formulaExplanation: 'Calculates the incremental profit from improving margins on affected revenue streams.',
    typicalRange: { min: 0.5, max: 5, unit: 'margin points' },
    applicableIndustries: ['retail', 'manufacturing', 'healthcare', 'financial_services'],
  },
  productivity_gain: {
    id: 'productivity_gain',
    label: 'Productivity Gain → Commercial Impact',
    description: 'Time savings translated to commercial value through either capacity release or direct output increase.',
    requiredInputs: ['employeesAffected', 'averageHourlyCost', 'currentHoursPerWeek', 'expectedHoursSaved', 'productivityCaptureRate'],
    formula: 'Productivity Value = Employees × Hours Saved/Week × 52 × Hourly Cost × Capture Rate',
    formulaExplanation: 'Converts time savings to dollar value, with a capture rate acknowledging not all saved time translates to commercial value (typically 75%).',
    typicalRange: { min: 10, max: 40, unit: '% time savings' },
    applicableIndustries: ['all'],
  },
  cost_reduction: {
    id: 'cost_reduction',
    label: 'Direct Cost Reduction',
    description: 'Hard cost savings from reduced spend on infrastructure, licenses, contractors, or other operating expenses.',
    requiredInputs: ['currentAnnualCost', 'expectedReductionPercent', 'realizationTimeMonths', 'sustainabilityFactor'],
    formula: 'Cost Savings = Current Annual Cost × Reduction % × Sustainability Factor',
    formulaExplanation: 'Calculates hard dollar savings with adjustment for sustainability of savings over time.',
    typicalRange: { min: 10, max: 40, unit: '% cost reduction' },
    applicableIndustries: ['all'],
  },
  risk_avoidance: {
    id: 'risk_avoidance',
    label: 'Risk Avoidance / Mitigation',
    description: 'Value from reducing probability or impact of adverse events including security breaches, compliance penalties, or operational failures.',
    requiredInputs: ['annualRiskExposure', 'probabilityOfOccurrence', 'expectedRiskReduction'],
    formula: 'Risk Value = Annual Risk Exposure × Probability × Risk Reduction %',
    formulaExplanation: 'Expected value calculation of risk reduction based on exposure, likelihood, and mitigation effectiveness.',
    typicalRange: { min: 20, max: 60, unit: '% risk reduction' },
    applicableIndustries: ['financial_services', 'healthcare', 'technology', 'government'],
  },
  time_to_market: {
    id: 'time_to_market',
    label: 'Time to Market Acceleration',
    description: 'Value from reaching market faster, capturing revenue earlier, and gaining competitive advantage.',
    requiredInputs: ['monthsAccelerated', 'monthlyRevenueOpportunity', 'marketWindowMonths', 'competitiveAdvantageMultiplier'],
    formula: 'TTM Value = Months Accelerated × Monthly Revenue × Competitive Multiplier',
    formulaExplanation: 'Calculates the value of earlier market entry including competitive advantage premium.',
    typicalRange: { min: 1, max: 6, unit: 'months accelerated' },
    applicableIndustries: ['technology', 'retail', 'manufacturing'],
  },
};

// ============================================================================
// SCENARIO CONFIGURATIONS (Benchmark-Driven)
// ============================================================================

export const DEFAULT_SCENARIO_CONFIGS: ScenarioConfig[] = [
  {
    type: 'conservative',
    label: 'Conservative',
    multiplier: 0.60,
    percentile: 25,
    confidenceLevel: 75,
    color: '#64748b', // slate
    description: '25th percentile outcome - 75% confidence of achieving or exceeding this result',
    dataSource: 'Based on Forrester TEI meta-analysis of 500+ technology implementations',
  },
  {
    type: 'realistic',
    label: 'Realistic',
    multiplier: 1.00,
    percentile: 50,
    confidenceLevel: 50,
    color: '#3b82f6', // blue
    description: '50th percentile (median) outcome - expected most likely result',
    dataSource: 'Based on Gartner IT Investment Benchmark Database 2025',
  },
  {
    type: 'optimistic',
    label: 'Optimistic',
    multiplier: 1.50,
    percentile: 75,
    confidenceLevel: 25,
    color: '#10b981', // emerald
    description: '75th percentile outcome - stretch goal achievable with strong execution',
    dataSource: 'Based on McKinsey Digital Transformation top-quartile performers',
  },
];

// ============================================================================
// INDUSTRY RISK FACTORS
// ============================================================================

export const INDUSTRY_RISK_FACTORS: Record<string, { factor: number; rationale: string }> = {
  technology: { factor: 0.85, rationale: 'Higher execution risk due to rapid change and competitive pressure' },
  financial_services: { factor: 0.90, rationale: 'Strong governance but regulatory compliance overhead' },
  healthcare: { factor: 0.88, rationale: 'Clinical validation requirements and compliance complexity' },
  manufacturing: { factor: 0.92, rationale: 'Tangible outcomes and established process improvement methodologies' },
  retail: { factor: 0.87, rationale: 'Market volatility and consumer behavior unpredictability' },
  government: { factor: 0.82, rationale: 'Procurement complexity and change management challenges' },
  education: { factor: 0.85, rationale: 'Budget constraints and stakeholder alignment challenges' },
  other: { factor: 0.88, rationale: 'Cross-industry average risk factor' },
};

// ============================================================================
// BENEFIT REALIZATION CURVE
// ============================================================================

export const BENEFIT_REALIZATION_CURVE: { month: number; realization: number }[] = [
  { month: 1, realization: 0.10 },
  { month: 2, realization: 0.15 },
  { month: 3, realization: 0.25 },
  { month: 4, realization: 0.35 },
  { month: 5, realization: 0.45 },
  { month: 6, realization: 0.55 },
  { month: 7, realization: 0.65 },
  { month: 8, realization: 0.75 },
  { month: 9, realization: 0.82 },
  { month: 10, realization: 0.88 },
  { month: 11, realization: 0.94 },
  { month: 12, realization: 1.00 },
];

// ============================================================================
// CALCULATION FUNCTIONS
// ============================================================================

/**
 * Calculate Revenue Impact
 */
export function calculateRevenueImpact(inputs: RevenueImpactInputs): ReturnCalculationResult {
  const steps: CalculationStep[] = [];
  
  // Step 1: Base revenue impact
  const baseImpact = inputs.annualRevenue * (inputs.expectedImpactPercent / 100);
  steps.push({
    stepNumber: 1,
    description: 'Calculate base annual revenue impact',
    formula: 'Base Impact = Annual Revenue × Expected Impact %',
    inputs: { annualRevenue: inputs.annualRevenue, expectedImpactPercent: inputs.expectedImpactPercent },
    result: baseImpact,
    unit: '$',
  });
  
  // Step 2: Apply confidence adjustment
  const confidenceMultipliers = { conservative: 0.7, realistic: 1.0, optimistic: 1.3 };
  const confidenceMultiplier = confidenceMultipliers[inputs.confidenceLevel];
  const adjustedImpact = baseImpact * confidenceMultiplier;
  steps.push({
    stepNumber: 2,
    description: `Apply ${inputs.confidenceLevel} confidence adjustment`,
    formula: 'Adjusted Impact = Base Impact × Confidence Multiplier',
    inputs: { baseImpact, confidenceMultiplier },
    result: adjustedImpact,
    unit: '$',
  });
  
  // Step 3: Calculate Year 1 with realization curve
  const monthsActive = Math.max(0, 12 - inputs.timeToFullImpact);
  const year1Realization = monthsActive / 12;
  const year1Return = adjustedImpact * year1Realization;
  steps.push({
    stepNumber: 3,
    description: 'Calculate Year 1 return (adjusted for implementation time)',
    formula: 'Year 1 = Adjusted Impact × (12 - Implementation Months) / 12',
    inputs: { adjustedImpact, timeToFullImpact: inputs.timeToFullImpact, year1Realization },
    result: year1Return,
    unit: '$',
  });
  
  // Step 4: Calculate 3-year return
  const threeYearReturn = year1Return + adjustedImpact + adjustedImpact;
  steps.push({
    stepNumber: 4,
    description: 'Calculate 3-year total return',
    formula: '3-Year Return = Year 1 + Year 2 (full) + Year 3 (full)',
    inputs: { year1Return, year2: adjustedImpact, year3: adjustedImpact },
    result: threeYearReturn,
    unit: '$',
  });
  
  return {
    categoryType: 'revenue_impact',
    categoryLabel: RETURN_CATEGORY_CONFIGS.revenue_impact.label,
    annualReturn: adjustedImpact,
    threeYearReturn,
    formulaUsed: RETURN_CATEGORY_CONFIGS.revenue_impact.formula,
    calculationSteps: steps,
    assumptions: [
      `Expected revenue impact of ${inputs.expectedImpactPercent}% based on solution capabilities`,
      `${inputs.timeToFullImpact} months to full implementation`,
      `${inputs.confidenceLevel} confidence level applied (${confidenceMultiplier}x multiplier)`,
      'Years 2 and 3 assume full annual benefit',
    ],
    confidenceLevel: inputs.confidenceLevel === 'optimistic' ? 25 : inputs.confidenceLevel === 'realistic' ? 50 : 75,
    dataQuality: 'medium',
  };
}

/**
 * Calculate Margin Uplift
 */
export function calculateMarginUplift(inputs: MarginUpliftInputs): ReturnCalculationResult {
  const steps: CalculationStep[] = [];
  
  // Step 1: Calculate affected revenue
  const affectedRevenue = inputs.annualRevenue * (inputs.affectedRevenuePercent / 100);
  steps.push({
    stepNumber: 1,
    description: 'Calculate affected revenue portion',
    formula: 'Affected Revenue = Annual Revenue × Affected %',
    inputs: { annualRevenue: inputs.annualRevenue, affectedRevenuePercent: inputs.affectedRevenuePercent },
    result: affectedRevenue,
    unit: '$',
  });
  
  // Step 2: Calculate margin improvement
  const marginImprovement = inputs.expectedMarginPercent - inputs.currentMarginPercent;
  steps.push({
    stepNumber: 2,
    description: 'Calculate margin point improvement',
    formula: 'Margin Improvement = Expected Margin % - Current Margin %',
    inputs: { expectedMarginPercent: inputs.expectedMarginPercent, currentMarginPercent: inputs.currentMarginPercent },
    result: marginImprovement,
    unit: 'percentage points',
  });
  
  // Step 3: Calculate annual margin uplift
  const annualUplift = affectedRevenue * (marginImprovement / 100);
  steps.push({
    stepNumber: 3,
    description: 'Calculate annual margin uplift value',
    formula: 'Annual Uplift = Affected Revenue × Margin Improvement %',
    inputs: { affectedRevenue, marginImprovement },
    result: annualUplift,
    unit: '$',
  });
  
  // Step 4: 3-year calculation (with ramp)
  const year1 = annualUplift * 0.75; // 75% Year 1 as ramp-up
  const threeYearReturn = year1 + annualUplift + annualUplift;
  steps.push({
    stepNumber: 4,
    description: 'Calculate 3-year return (Year 1 at 75% ramp)',
    formula: '3-Year = (Year 1 × 0.75) + Year 2 + Year 3',
    inputs: { year1, year2: annualUplift, year3: annualUplift },
    result: threeYearReturn,
    unit: '$',
  });
  
  return {
    categoryType: 'margin_uplift',
    categoryLabel: RETURN_CATEGORY_CONFIGS.margin_uplift.label,
    annualReturn: annualUplift,
    threeYearReturn,
    formulaUsed: RETURN_CATEGORY_CONFIGS.margin_uplift.formula,
    calculationSteps: steps,
    assumptions: [
      `${inputs.affectedRevenuePercent}% of revenue affected by margin improvement`,
      `Margin improvement from ${inputs.currentMarginPercent}% to ${inputs.expectedMarginPercent}%`,
      'Year 1 assumes 75% realization due to implementation ramp',
      'Years 2-3 assume full annual benefit sustained',
    ],
    confidenceLevel: 50,
    dataQuality: 'medium',
  };
}

/**
 * Calculate Productivity Gain
 */
export function calculateProductivityGain(inputs: ProductivityGainInputs): ReturnCalculationResult {
  const steps: CalculationStep[] = [];
  
  // Step 1: Calculate total hours saved per year
  const annualHoursSaved = inputs.employeesAffected * inputs.expectedHoursSaved * 52;
  steps.push({
    stepNumber: 1,
    description: 'Calculate total annual hours saved',
    formula: 'Annual Hours = Employees × Hours Saved/Week × 52 weeks',
    inputs: { 
      employeesAffected: inputs.employeesAffected, 
      expectedHoursSaved: inputs.expectedHoursSaved,
      weeksPerYear: 52 
    },
    result: annualHoursSaved,
    unit: 'hours',
  });
  
  // Step 2: Calculate gross value of time
  const grossValue = annualHoursSaved * inputs.averageHourlyCost;
  steps.push({
    stepNumber: 2,
    description: 'Calculate gross value of time saved',
    formula: 'Gross Value = Annual Hours × Hourly Cost',
    inputs: { annualHoursSaved, averageHourlyCost: inputs.averageHourlyCost },
    result: grossValue,
    unit: '$',
  });
  
  // Step 3: Apply productivity capture rate
  const capturedValue = grossValue * inputs.productivityCaptureRate;
  steps.push({
    stepNumber: 3,
    description: 'Apply productivity capture rate (not all saved time creates value)',
    formula: 'Captured Value = Gross Value × Capture Rate',
    inputs: { grossValue, productivityCaptureRate: inputs.productivityCaptureRate },
    result: capturedValue,
    unit: '$',
  });
  
  // Step 4: 3-year return
  const year1 = capturedValue * 0.65; // Adoption ramp
  const threeYearReturn = year1 + capturedValue + capturedValue;
  steps.push({
    stepNumber: 4,
    description: 'Calculate 3-year return (Year 1 at 65% adoption)',
    formula: '3-Year = (Year 1 × 0.65) + Year 2 + Year 3',
    inputs: { year1, year2: capturedValue, year3: capturedValue },
    result: threeYearReturn,
    unit: '$',
  });
  
  return {
    categoryType: 'productivity_gain',
    categoryLabel: RETURN_CATEGORY_CONFIGS.productivity_gain.label,
    annualReturn: capturedValue,
    threeYearReturn,
    formulaUsed: RETURN_CATEGORY_CONFIGS.productivity_gain.formula,
    calculationSteps: steps,
    assumptions: [
      `${inputs.employeesAffected} employees affected by productivity improvement`,
      `${inputs.expectedHoursSaved} hours saved per employee per week`,
      `Fully-loaded hourly cost of $${inputs.averageHourlyCost}`,
      `${(inputs.productivityCaptureRate * 100).toFixed(0)}% of saved time translates to commercial value`,
      'Year 1 assumes 65% adoption/realization ramp',
    ],
    confidenceLevel: 60,
    dataQuality: 'high',
  };
}

/**
 * Calculate Cost Reduction
 */
export function calculateCostReduction(inputs: CostReductionInputs): ReturnCalculationResult {
  const steps: CalculationStep[] = [];
  
  // Step 1: Calculate gross annual savings
  const grossSavings = inputs.currentAnnualCost * (inputs.expectedReductionPercent / 100);
  steps.push({
    stepNumber: 1,
    description: 'Calculate gross annual savings',
    formula: 'Gross Savings = Current Annual Cost × Reduction %',
    inputs: { currentAnnualCost: inputs.currentAnnualCost, expectedReductionPercent: inputs.expectedReductionPercent },
    result: grossSavings,
    unit: '$',
  });
  
  // Step 2: Apply sustainability factor
  const sustainableSavings = grossSavings * inputs.sustainabilityFactor;
  steps.push({
    stepNumber: 2,
    description: 'Apply sustainability factor (likelihood savings persist)',
    formula: 'Sustainable Savings = Gross Savings × Sustainability Factor',
    inputs: { grossSavings, sustainabilityFactor: inputs.sustainabilityFactor },
    result: sustainableSavings,
    unit: '$',
  });
  
  // Step 3: Year 1 with realization timing
  const realizationFactor = Math.max(0, (12 - inputs.realizationTimeMonths) / 12);
  const year1 = sustainableSavings * realizationFactor;
  steps.push({
    stepNumber: 3,
    description: 'Calculate Year 1 savings (adjusted for realization time)',
    formula: 'Year 1 = Sustainable Savings × (12 - Realization Months) / 12',
    inputs: { sustainableSavings, realizationTimeMonths: inputs.realizationTimeMonths, realizationFactor },
    result: year1,
    unit: '$',
  });
  
  // Step 4: 3-year return
  const threeYearReturn = year1 + sustainableSavings + sustainableSavings;
  steps.push({
    stepNumber: 4,
    description: 'Calculate 3-year total savings',
    formula: '3-Year = Year 1 + Year 2 + Year 3',
    inputs: { year1, year2: sustainableSavings, year3: sustainableSavings },
    result: threeYearReturn,
    unit: '$',
  });
  
  return {
    categoryType: 'cost_reduction',
    categoryLabel: RETURN_CATEGORY_CONFIGS.cost_reduction.label,
    annualReturn: sustainableSavings,
    threeYearReturn,
    formulaUsed: RETURN_CATEGORY_CONFIGS.cost_reduction.formula,
    calculationSteps: steps,
    assumptions: [
      `Current annual cost base of $${inputs.currentAnnualCost.toLocaleString()}`,
      `Expected reduction of ${inputs.expectedReductionPercent}%`,
      `${inputs.realizationTimeMonths} months to full savings realization`,
      `${(inputs.sustainabilityFactor * 100).toFixed(0)}% confidence savings will persist`,
    ],
    confidenceLevel: 70,
    dataQuality: 'high',
  };
}

/**
 * Calculate Risk Avoidance
 */
export function calculateRiskAvoidance(inputs: RiskAvoidanceInputs): ReturnCalculationResult {
  const steps: CalculationStep[] = [];
  
  // Step 1: Calculate expected annual loss
  const expectedAnnualLoss = inputs.annualRiskExposure * inputs.probabilityOfOccurrence;
  steps.push({
    stepNumber: 1,
    description: 'Calculate expected annual loss (risk exposure × probability)',
    formula: 'Expected Loss = Annual Risk Exposure × Probability of Occurrence',
    inputs: { annualRiskExposure: inputs.annualRiskExposure, probabilityOfOccurrence: inputs.probabilityOfOccurrence },
    result: expectedAnnualLoss,
    unit: '$',
  });
  
  // Step 2: Calculate risk reduction value
  const riskReductionValue = expectedAnnualLoss * inputs.expectedRiskReduction;
  steps.push({
    stepNumber: 2,
    description: 'Calculate value of risk reduction',
    formula: 'Risk Value = Expected Loss × Risk Reduction %',
    inputs: { expectedAnnualLoss, expectedRiskReduction: inputs.expectedRiskReduction },
    result: riskReductionValue,
    unit: '$',
  });
  
  // Step 3: Add compliance penalty avoided if applicable
  const complianceValue = inputs.compliancePenaltyAvoided || 0;
  const totalRiskValue = riskReductionValue + complianceValue;
  steps.push({
    stepNumber: 3,
    description: 'Add compliance penalty avoidance value',
    formula: 'Total Risk Value = Risk Reduction Value + Compliance Penalty Avoided',
    inputs: { riskReductionValue, compliancePenaltyAvoided: complianceValue },
    result: totalRiskValue,
    unit: '$',
  });
  
  // Step 4: 3-year return
  const threeYearReturn = totalRiskValue * 3;
  steps.push({
    stepNumber: 4,
    description: 'Calculate 3-year risk avoidance value',
    formula: '3-Year = Annual Risk Value × 3',
    inputs: { totalRiskValue, years: 3 },
    result: threeYearReturn,
    unit: '$',
  });
  
  return {
    categoryType: 'risk_avoidance',
    categoryLabel: RETURN_CATEGORY_CONFIGS.risk_avoidance.label,
    annualReturn: totalRiskValue,
    threeYearReturn,
    formulaUsed: RETURN_CATEGORY_CONFIGS.risk_avoidance.formula,
    calculationSteps: steps,
    assumptions: [
      `Annual risk exposure of $${inputs.annualRiskExposure.toLocaleString()}`,
      `${(inputs.probabilityOfOccurrence * 100).toFixed(1)}% probability of occurrence`,
      `Expected ${(inputs.expectedRiskReduction * 100).toFixed(0)}% risk reduction`,
      complianceValue > 0 ? `Compliance penalty avoidance of $${complianceValue.toLocaleString()}` : 'No compliance penalty component',
      'Risk value assumes consistent exposure over 3-year period',
    ],
    confidenceLevel: 40,
    dataQuality: 'low',
  };
}

/**
 * Calculate Time to Market
 */
export function calculateTimeToMarket(inputs: TimeToMarketInputs): ReturnCalculationResult {
  const steps: CalculationStep[] = [];
  
  // Step 1: Calculate base revenue acceleration
  const baseAcceleration = inputs.monthsAccelerated * inputs.monthlyRevenueOpportunity;
  steps.push({
    stepNumber: 1,
    description: 'Calculate base revenue from acceleration',
    formula: 'Base Value = Months Accelerated × Monthly Revenue Opportunity',
    inputs: { monthsAccelerated: inputs.monthsAccelerated, monthlyRevenueOpportunity: inputs.monthlyRevenueOpportunity },
    result: baseAcceleration,
    unit: '$',
  });
  
  // Step 2: Apply market window constraint
  const marketWindowFactor = Math.min(1, inputs.monthsAccelerated / inputs.marketWindowMonths);
  const windowAdjusted = baseAcceleration * (1 + marketWindowFactor * 0.5);
  steps.push({
    stepNumber: 2,
    description: 'Adjust for market window (earlier = more valuable)',
    formula: 'Window Adjusted = Base × (1 + (Months / Window) × 0.5)',
    inputs: { baseAcceleration, marketWindowFactor, windowMonths: inputs.marketWindowMonths },
    result: windowAdjusted,
    unit: '$',
  });
  
  // Step 3: Apply competitive advantage multiplier
  const competitiveValue = windowAdjusted * inputs.competitiveAdvantageMultiplier;
  steps.push({
    stepNumber: 3,
    description: 'Apply competitive advantage multiplier',
    formula: 'Competitive Value = Window Adjusted × Competitive Multiplier',
    inputs: { windowAdjusted, competitiveAdvantageMultiplier: inputs.competitiveAdvantageMultiplier },
    result: competitiveValue,
    unit: '$',
  });
  
  // This is typically a one-time value, not recurring
  const threeYearReturn = competitiveValue;
  steps.push({
    stepNumber: 4,
    description: 'Time-to-market value is captured once (acceleration benefit)',
    formula: '3-Year = Competitive Value (one-time capture)',
    inputs: { competitiveValue },
    result: threeYearReturn,
    unit: '$',
  });
  
  return {
    categoryType: 'time_to_market',
    categoryLabel: RETURN_CATEGORY_CONFIGS.time_to_market.label,
    annualReturn: competitiveValue / 3, // Annualized
    threeYearReturn,
    formulaUsed: RETURN_CATEGORY_CONFIGS.time_to_market.formula,
    calculationSteps: steps,
    assumptions: [
      `${inputs.monthsAccelerated} months of market acceleration`,
      `Monthly revenue opportunity of $${inputs.monthlyRevenueOpportunity.toLocaleString()}`,
      `${inputs.marketWindowMonths}-month market window before competition catches up`,
      `Competitive advantage multiplier of ${inputs.competitiveAdvantageMultiplier}x`,
      'Value is captured as one-time acceleration benefit',
    ],
    confidenceLevel: 35,
    dataQuality: 'low',
  };
}

// ============================================================================
// MAIN CALCULATION DISPATCHER
// ============================================================================

export function calculateReturn(category: ReturnCategoryInputs): ReturnCalculationResult {
  switch (category.type) {
    case 'revenue_impact':
      return calculateRevenueImpact(category.inputs);
    case 'margin_uplift':
      return calculateMarginUplift(category.inputs);
    case 'productivity_gain':
      return calculateProductivityGain(category.inputs);
    case 'cost_reduction':
      return calculateCostReduction(category.inputs);
    case 'risk_avoidance':
      return calculateRiskAvoidance(category.inputs);
    case 'time_to_market':
      return calculateTimeToMarket(category.inputs);
    default:
      throw new Error(`Unknown return category: ${(category as any).type}`);
  }
}

// ============================================================================
// ROI & FINANCIAL METRICS
// ============================================================================

export interface FinancialMetrics {
  roi: number;
  roiPercentage: string;
  paybackMonths: number;
  npv: number;
  irr: number;
  totalInvestment: number;
  totalReturn: number;
  netBenefit: number;
}

export function calculateFinancialMetrics(
  investment: InvestmentSummary,
  returnResults: ReturnCalculationResult[],
  discountRate: number = 0.10
): FinancialMetrics {
  const totalInvestment = investment.totalInvestment;
  const totalReturn = returnResults.reduce((sum, r) => sum + r.threeYearReturn, 0);
  const netBenefit = totalReturn - totalInvestment;
  
  // ROI
  const roi = totalInvestment > 0 ? ((totalReturn - totalInvestment) / totalInvestment) * 100 : 0;
  
  // Payback (simplified - assumes even monthly benefit)
  const monthlyBenefit = totalReturn / 36;
  const paybackMonths = monthlyBenefit > 0 ? Math.ceil(totalInvestment / monthlyBenefit) : 999;
  
  // NPV
  const annualBenefit = totalReturn / 3;
  const npv = -totalInvestment + 
    annualBenefit / (1 + discountRate) +
    annualBenefit / Math.pow(1 + discountRate, 2) +
    annualBenefit / Math.pow(1 + discountRate, 3);
  
  // IRR (Newton-Raphson approximation)
  const irr = calculateIRR(totalInvestment, [annualBenefit, annualBenefit, annualBenefit]);
  
  return {
    roi,
    roiPercentage: `${roi.toFixed(0)}%`,
    paybackMonths: Math.min(paybackMonths, 36),
    npv,
    irr: irr * 100,
    totalInvestment,
    totalReturn,
    netBenefit,
  };
}

function calculateIRR(investment: number, cashFlows: number[]): number {
  let irr = 0.1; // Initial guess
  const maxIterations = 100;
  const tolerance = 0.0001;
  
  for (let i = 0; i < maxIterations; i++) {
    let npv = -investment;
    let derivative = 0;
    
    for (let t = 0; t < cashFlows.length; t++) {
      const discountFactor = Math.pow(1 + irr, t + 1);
      npv += cashFlows[t] / discountFactor;
      derivative -= (t + 1) * cashFlows[t] / Math.pow(1 + irr, t + 2);
    }
    
    if (Math.abs(npv) < tolerance) break;
    
    irr = irr - npv / derivative;
    
    // Bound IRR to reasonable range
    irr = Math.max(-0.99, Math.min(irr, 10));
  }
  
  return irr;
}

// ============================================================================
// SCENARIO CALCULATIONS
// ============================================================================

export function calculateScenarios(
  baseMetrics: FinancialMetrics,
  scenarios: ScenarioConfig[] = DEFAULT_SCENARIO_CONFIGS
): ScenarioResult[] {
  return scenarios.map(scenario => {
    const adjustedReturn = baseMetrics.totalReturn * scenario.multiplier;
    const adjustedNet = adjustedReturn - baseMetrics.totalInvestment;
    const adjustedROI = baseMetrics.totalInvestment > 0 
      ? ((adjustedReturn - baseMetrics.totalInvestment) / baseMetrics.totalInvestment) * 100 
      : 0;
    
    const monthlyBenefit = adjustedReturn / 36;
    const payback = monthlyBenefit > 0 ? Math.ceil(baseMetrics.totalInvestment / monthlyBenefit) : 999;
    
    const annualBenefit = adjustedReturn / 3;
    const npv = -baseMetrics.totalInvestment + 
      annualBenefit / 1.1 + annualBenefit / 1.21 + annualBenefit / 1.331;
    
    const irr = calculateIRR(baseMetrics.totalInvestment, [annualBenefit, annualBenefit, annualBenefit]);
    
    return {
      scenario: scenario.type,
      totalReturn: adjustedReturn,
      roi: adjustedROI,
      paybackMonths: Math.min(payback, 36),
      npv,
      irr: irr * 100,
      confidenceInterval: {
        lower: adjustedReturn * 0.85,
        upper: adjustedReturn * 1.15,
      },
    };
  });
}

// ============================================================================
// MONTE CARLO SIMULATION
// ============================================================================

export function runMonteCarloSimulation(
  baseReturn: number,
  investment: number,
  iterations: number = 10000,
  volatility: number = 0.25
): MonteCarloResult {
  const results: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    
    // Apply volatility
    const simulatedReturn = baseReturn * (1 + z * volatility);
    const simulatedROI = ((simulatedReturn - investment) / investment) * 100;
    results.push(simulatedROI);
  }
  
  results.sort((a, b) => a - b);
  
  const mean = results.reduce((a, b) => a + b, 0) / iterations;
  const variance = results.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / iterations;
  const standardDeviation = Math.sqrt(variance);
  
  // Create histogram
  const min = results[0];
  const max = results[results.length - 1];
  const bucketCount = 20;
  const bucketSize = (max - min) / bucketCount;
  const histogram: Array<{ bucket: number; count: number }> = [];
  
  for (let i = 0; i < bucketCount; i++) {
    const bucketStart = min + i * bucketSize;
    const count = results.filter(r => r >= bucketStart && r < bucketStart + bucketSize).length;
    histogram.push({ bucket: bucketStart + bucketSize / 2, count });
  }
  
  return {
    iterations,
    mean,
    median: results[Math.floor(iterations / 2)],
    standardDeviation,
    percentiles: {
      p10: results[Math.floor(iterations * 0.1)],
      p25: results[Math.floor(iterations * 0.25)],
      p50: results[Math.floor(iterations * 0.5)],
      p75: results[Math.floor(iterations * 0.75)],
      p90: results[Math.floor(iterations * 0.9)],
    },
    histogram,
    probabilityOfPositiveROI: results.filter(r => r > 0).length / iterations,
  };
}
