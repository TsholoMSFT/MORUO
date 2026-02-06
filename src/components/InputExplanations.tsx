/**
 * Input Explanations Component
 * 
 * Provides contextual help and explanations for all data input fields
 * in the MORUO analyzer. Shows users how each input affects calculations.
 */

import React, { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface InputExplanation {
  id: string;
  label: string;
  purpose: string;
  usedIn: string[];
  impact: string;
  example?: string;
  tips?: string[];
}

export interface InputExplanationsProps {
  fieldId: string;
  showInline?: boolean;
  compact?: boolean;
}

// ============================================================================
// COMPREHENSIVE INPUT EXPLANATIONS
// ============================================================================

export const INPUT_EXPLANATIONS: Record<string, InputExplanation> = {
  // Investment & Financial Inputs
  investmentAmount: {
    id: 'investmentAmount',
    label: 'Investment Amount ($)',
    purpose: 'The total upfront cost to implement the solution, including software licenses, professional services, hardware, and internal resource costs.',
    usedIn: [
      'ROI Calculation: ROI = (Total Benefits - Investment) / Investment × 100',
      'Payback Period: Number of months until cumulative benefits exceed the initial investment',
      'Net Present Value (NPV): Initial investment is subtracted from discounted future cash flows',
      'Internal Rate of Return (IRR): The discount rate at which NPV equals zero',
    ],
    impact: 'Higher investment requires greater benefits to achieve positive ROI. A $100,000 investment needs $100,000+ in benefits just to break even.',
    example: 'For a $100,000 investment generating $150,000 in 3-year benefits: ROI = ($150K - $100K) / $100K × 100 = 50%',
    tips: [
      'Include all costs: licenses, implementation, training, change management',
      'Account for internal staff time at fully-loaded cost rates',
      'Consider contingency buffer (typically 10-20%) for unforeseen costs',
    ],
  },

  timeline: {
    id: 'timeline',
    label: 'Timeline (Months)',
    purpose: 'The expected duration from project kickoff to full deployment and adoption. This affects when benefits begin to materialize.',
    usedIn: [
      'Benefit Realization Curve: Determines what percentage of annual benefit is captured in Year 1',
      'Payback Calculation: Longer implementations delay when ROI clock starts',
      'Risk Assessment: Extended timelines increase execution and market risk',
      'NPV Calculation: Benefits are discounted based on when they occur',
    ],
    impact: 'A 12-month implementation realizes ~65% of Year 1 benefits, while a 3-month implementation captures ~90%. Every month of delay reduces total 3-year value.',
    example: '3-month deploy: 90% Year 1 benefit | 6-month deploy: 80% | 12-month deploy: 65%',
    tips: [
      'Be realistic - most enterprise projects take longer than planned',
      'Include training and adoption time, not just technical deployment',
      'Consider phased rollouts to capture early value',
    ],
  },

  // Solution Area Inputs
  solutionAreas: {
    id: 'solutionAreas',
    label: 'Solution Areas',
    purpose: 'Categorizes the initiative to apply appropriate industry benchmarks, risk factors, and typical value drivers for that technology domain.',
    usedIn: [
      'Benchmark Selection: Each area has different typical ROI ranges based on industry data',
      'Risk Factor Application: Security projects carry different risks than AI initiatives',
      'Value Driver Identification: AI → Productivity gains, Security → Risk reduction, Cloud → Cost optimization',
      'Comparison Analysis: Performance compared against relevant peer implementations',
    ],
    impact: 'Solution area determines which industry benchmarks are applied. AI Business Solutions typically show 200-400% ROI, while Security investments often justify based on risk avoidance.',
    example: 'AI Business Solutions: Avg. 250% ROI, 14-month payback | Security: Avg. $3.5M breach cost avoided',
    tips: [
      'Select all areas that apply for multi-faceted initiatives',
      'Primary area should represent the main value driver',
      'Use "Other" for initiatives that span multiple categories',
    ],
  },

  // Revenue & Cost Inputs
  annualRevenue: {
    id: 'annualRevenue',
    label: 'Annual Revenue ($)',
    purpose: 'Company or business unit annual revenue, used to calculate potential revenue impact as a percentage of the top line.',
    usedIn: [
      'Revenue Impact Calculation: Expected revenue increase = Annual Revenue × Industry Impact %',
      'Time to Market Value: Months accelerated × (Annual Revenue / 12) × Capture Rate',
      'Relative Sizing: Larger revenue bases yield larger absolute dollar benefits',
    ],
    impact: 'For a company with $10M revenue, a 5% improvement = $500K/year. For $100M revenue, same 5% = $5M/year.',
    example: '$10M revenue × 5% AI-driven increase = $500,000 annual benefit',
    tips: [
      'Use the revenue of the affected business unit, not whole company if initiative is targeted',
      'Consider addressable revenue vs. total revenue',
      'For B2B, consider customer lifetime value impacts too',
    ],
  },

  annualOperatingCosts: {
    id: 'annualOperatingCosts',
    label: 'Annual Operating Costs ($)',
    purpose: 'Current annual costs for the processes or operations being improved. Used to calculate cost reduction benefits.',
    usedIn: [
      'Cost Reduction Calculation: Savings = Operating Costs × Expected Reduction %',
      'Efficiency Metrics: Cost per transaction, cost per employee impact',
      'Baseline Comparison: Current state vs. future state cost modeling',
    ],
    impact: 'Industry benchmarks suggest 20-35% cost reduction is achievable for process automation. $5M OpEx with 25% reduction = $1.25M annual savings.',
    example: '$5M operating costs × 25% reduction = $1.25M annual savings',
    tips: [
      'Include labor, technology, infrastructure, and overhead costs',
      'Consider fully-loaded employee costs (salary + benefits + overhead)',
      'Document current state costs carefully for accurate comparison',
    ],
  },

  // Productivity Inputs
  employeeCount: {
    id: 'employeeCount',
    label: 'Number of Employees Affected',
    purpose: 'The count of employees whose work will be impacted by the solution. Used to calculate aggregate time savings.',
    usedIn: [
      'Productivity Calculation: Total Hours Saved = Employees × Hours Saved Per Person × 12 months',
      'Dollar Value: Hours Saved × Hourly Cost = Annual Productivity Benefit',
      'Scale Assessment: Larger affected populations yield higher absolute returns',
    ],
    impact: '100 employees saving 5 hours/week at $50/hr = $1.3M annual productivity value.',
    example: '100 employees × 5 hrs/week × 52 weeks × $50/hr = $1,300,000/year',
    tips: [
      'Count all impacted roles, not just primary users',
      'Consider indirect beneficiaries (managers reviewing less, customers served faster)',
      'Distinguish between time freed for higher-value work vs. headcount reduction',
    ],
  },

  currentProcessTime: {
    id: 'currentProcessTime',
    label: 'Current Process Time (Hours)',
    purpose: 'Time currently spent on the process or task being improved. Establishes the baseline for measuring time savings.',
    usedIn: [
      'Time Savings Calculation: Current Time - Expected Time = Hours Saved',
      'Efficiency Ratio: Improvement % = (Current - New) / Current × 100',
      'Capacity Analysis: Time freed enables additional work capacity',
    ],
    impact: 'Reducing a 10-hour process to 2 hours = 80% efficiency gain, 8 hours recaptured per cycle.',
    example: '10 hours current → 2 hours future = 8 hours saved (80% improvement)',
    tips: [
      'Measure actual time, not theoretical or scheduled time',
      'Include wait times, handoffs, and rework in current state',
      'Document measurement methodology for credibility',
    ],
  },

  expectedProcessTime: {
    id: 'expectedProcessTime',
    label: 'Expected Process Time (Hours)',
    purpose: 'Projected time after solution implementation. Should be realistic based on vendor claims, pilots, or industry benchmarks.',
    usedIn: [
      'Improvement Calculation: Subtracted from current time to determine savings',
      'Scenario Modeling: Conservative/Realistic/Optimistic use different expected times',
      'Benefits Tracking: Actual vs. expected comparison post-implementation',
    ],
    impact: 'Overly aggressive estimates lead to missed ROI targets. Industry average improvements are 30-60% for automation projects.',
    example: 'Industry benchmark: 40-60% time reduction for AI-assisted processes',
    tips: [
      'Use conservative estimates for business case approval',
      'Reference vendor case studies with similar customers',
      'Consider learning curve in first 3-6 months',
    ],
  },

  averageHourlyCost: {
    id: 'averageHourlyCost',
    label: 'Average Hourly Cost ($)',
    purpose: 'Fully-loaded hourly cost of affected employees. Used to convert time savings into dollar value.',
    usedIn: [
      'Value Conversion: Hours Saved × Hourly Cost = Dollar Benefit',
      'Comparison: Allows comparing time savings to direct cost investments',
      'Sensitivity Analysis: Higher hourly costs amplify productivity benefits',
    ],
    impact: 'At $50/hr, 1000 hours saved = $50K. At $150/hr (consultants), same hours = $150K value.',
    example: 'Standard calculation: Base Salary / 2080 hours × 1.4 (benefits/overhead) = Loaded Rate',
    tips: [
      'Use fully-loaded cost (salary + benefits + overhead), typically 1.3-1.5× base salary',
      'Adjust for role mix if multiple job levels are affected',
      'Consider opportunity cost - what high-value work could they do instead?',
    ],
  },

  // Industry & Context Inputs
  industry: {
    id: 'industry',
    label: 'Industry',
    purpose: 'Company industry sector, used to apply appropriate benchmarks, risk factors, and typical outcomes for that vertical.',
    usedIn: [
      'Benchmark Application: Industry-specific ROI ranges, payback periods, success rates',
      'Risk Factor: Each industry has different execution risk (regulatory, technical, etc.)',
      'Comparison Sets: Performance compared against industry peer group',
    ],
    impact: 'Manufacturing typically shows 340% avg ROI with 10-month payback. Technology shows 250% ROI with 14-month payback. Healthcare: 280% ROI, 18-month payback.',
    example: 'Financial Services: Higher compliance overhead but stronger governance = 90% risk factor',
    tips: [
      'Select the industry that best represents your compliance and operational context',
      'Sub-industries may have different profiles (Fintech vs. Traditional Banking)',
      'Consider regulatory environment impact on implementation',
    ],
  },

  companySize: {
    id: 'companySize',
    label: 'Company Size',
    purpose: 'Organization size category, which affects execution capacity, resource availability, and typical implementation patterns.',
    usedIn: [
      'Size Factor Application: Larger organizations typically have better execution success rates',
      'Scaling Considerations: Enterprise has more complex stakeholder management',
      'Resource Assumptions: SMBs may have limited internal IT capacity',
    ],
    impact: 'Enterprise (1000+): 100% factor. Mid-market: 95%. SMB: 90%. Startup: 80% (higher execution risk).',
    example: 'Enterprise projects have more resources but slower decision cycles; startups move fast but have less cushion',
    tips: [
      'Consider affected business unit size, not just total company',
      'Factor in organizational complexity and change readiness',
      'Smaller orgs may benefit from faster decision-making offsetting resource constraints',
    ],
  },

  // Internal Benchmarks
  historicalROI: {
    id: 'historicalROI',
    label: 'Historical ROI (%)',
    purpose: 'Average ROI achieved on similar past projects within your organization. Used to calibrate projections to your actual experience.',
    usedIn: [
      'Projection Blending: Internal data weighted 40%, industry benchmark 60%',
      'Credibility Enhancement: Shows projections grounded in your track record',
      'Scenario Adjustment: Adjusts scenarios based on your execution capability',
    ],
    impact: 'If your historical ROI is 180% vs. industry 250%, projections will be more conservative, reflecting your actual capability.',
    example: 'Company with 150% historical ROI vs. 250% industry → Blended projection ~210%',
    tips: [
      'Use comparable project types only (similar technology, scope, complexity)',
      'Ensure consistent ROI calculation methodology across projects',
      'Document why past results may differ from this project',
    ],
  },

  successRate: {
    id: 'successRate',
    label: 'Project Success Rate (%)',
    purpose: 'Percentage of similar projects that met or exceeded their ROI targets. Used to risk-adjust projections.',
    usedIn: [
      'Risk Adjustment: Lower success rates reduce expected value',
      'Confidence Intervals: Affects probability ranges in scenario analysis',
      'Governance Insight: Indicates organizational execution capability',
    ],
    impact: '80% success rate means 20% chance of not achieving projected benefits. This should be factored into expected value.',
    example: '$1M expected benefit × 80% success rate = $800K risk-adjusted expected value',
    tips: [
      'Be honest about past failures - they improve future planning',
      'Consider what drove past failures and if those factors are addressed',
      'Use this to justify additional change management investment if needed',
    ],
  },
};

// ============================================================================
// HELPER COMPONENT: Tooltip-style explanation
// ============================================================================

export const InputTooltip: React.FC<{ fieldId: string }> = ({ fieldId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const explanation = INPUT_EXPLANATIONS[fieldId];

  if (!explanation) return null;

  return (
    <div className="relative inline-block ml-1">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-500 hover:text-blue-700 text-sm"
        aria-label={`Learn more about ${explanation.label}`}
      >
        ⓘ
      </button>
      {isOpen && (
        <div className="absolute z-50 w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-lg left-0 top-6">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold text-gray-900">{explanation.label}</h4>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
          </div>
          <p className="text-sm text-gray-600 mb-2">{explanation.purpose}</p>
          <div className="text-xs text-gray-500 space-y-1 border-t pt-2">
            <p className="font-medium text-gray-700">Used in calculations:</p>
            <ul className="list-disc list-inside">
              {explanation.usedIn.slice(0, 2).map((use, i) => (
                <li key={i}>{use}</li>
              ))}
            </ul>
          </div>
          {explanation.example && (
            <div className="mt-2 text-xs bg-blue-50 p-2 rounded">
              <span className="font-medium">Example:</span> {explanation.example}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT: Full explanation panel
// ============================================================================

export const InputExplanationPanel: React.FC<InputExplanationsProps> = ({
  fieldId,
  showInline = false,
  compact = false,
}) => {
  const explanation = INPUT_EXPLANATIONS[fieldId];

  if (!explanation) {
    return null;
  }

  if (compact) {
    return (
      <p className="text-xs text-gray-500 mt-1">
        {explanation.purpose.slice(0, 100)}...
        <InputTooltip fieldId={fieldId} />
      </p>
    );
  }

  return (
    <div className={`bg-gray-50 rounded-lg p-4 ${showInline ? 'mt-2' : 'mt-4'}`}>
      <h4 className="font-semibold text-gray-900 mb-2">{explanation.label}</h4>
      
      <div className="space-y-3 text-sm">
        <div>
          <span className="font-medium text-gray-700">Purpose:</span>
          <p className="text-gray-600">{explanation.purpose}</p>
        </div>

        <div>
          <span className="font-medium text-gray-700">How it's used in calculations:</span>
          <ul className="list-disc list-inside text-gray-600 mt-1">
            {explanation.usedIn.map((use, index) => (
              <li key={index}>{use}</li>
            ))}
          </ul>
        </div>

        <div>
          <span className="font-medium text-gray-700">Impact:</span>
          <p className="text-gray-600">{explanation.impact}</p>
        </div>

        {explanation.example && (
          <div className="bg-blue-50 p-3 rounded">
            <span className="font-medium text-blue-800">Example:</span>
            <p className="text-blue-700">{explanation.example}</p>
          </div>
        )}

        {explanation.tips && (
          <div className="bg-green-50 p-3 rounded">
            <span className="font-medium text-green-800">Tips:</span>
            <ul className="list-disc list-inside text-green-700 mt-1">
              {explanation.tips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// HELPER: Get inline help text for a field
// ============================================================================

export function getFieldHelpText(fieldId: string): string {
  const explanation = INPUT_EXPLANATIONS[fieldId];
  if (!explanation) return '';
  return explanation.purpose;
}

export function getFieldExample(fieldId: string): string | undefined {
  return INPUT_EXPLANATIONS[fieldId]?.example;
}

export function getFieldTips(fieldId: string): string[] {
  return INPUT_EXPLANATIONS[fieldId]?.tips || [];
}

export default InputExplanationPanel;
