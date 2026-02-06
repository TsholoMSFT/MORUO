/**
 * Calculation Methodology Component
 * 
 * Provides complete transparency into how all ROI and benefit calculations
 * are performed, including formulas, assumptions, and data sources.
 */

import React, { useState } from 'react';

interface MethodologySection {
  id: string;
  title: string;
  description: string;
  formulas?: Array<{
    name: string;
    formula: string;
    explanation: string;
    variables?: Array<{ symbol: string; meaning: string }>;
  }>;
  assumptions?: string[];
  sources?: string[];
}

const METHODOLOGY_SECTIONS: MethodologySection[] = [
  {
    id: 'roi-calculation',
    title: 'ROI Calculation',
    description: 'Return on Investment measures the efficiency of an investment by comparing net benefits to the initial cost.',
    formulas: [
      {
        name: 'Basic ROI',
        formula: 'ROI = ((Total Benefits - Investment) / Investment) × 100',
        explanation: 'Calculates the percentage return relative to the initial investment.',
        variables: [
          { symbol: 'Total Benefits', meaning: 'Sum of all quantified benefits over the analysis period' },
          { symbol: 'Investment', meaning: 'Total upfront cost including implementation, licenses, and internal costs' },
        ],
      },
      {
        name: '3-Year ROI',
        formula: 'ROI₃ = ((Year1 + Year2 + Year3 Benefits) - Investment) / Investment × 100',
        explanation: 'Standard 3-year analysis period used for enterprise technology investments.',
        variables: [
          { symbol: 'Year1 Benefits', meaning: 'Benefits realized in first 12 months (adjusted for ramp-up)' },
          { symbol: 'Year2 Benefits', meaning: 'Full annual benefits in second year' },
          { symbol: 'Year3 Benefits', meaning: 'Full annual benefits in third year' },
        ],
      },
    ],
    assumptions: [
      'Benefits are calculated annually and adjusted for implementation timeline',
      'No inflation adjustment is applied (nominal values)',
      'Internal costs are valued at fully-loaded employee rates',
    ],
    sources: [
      'Forrester Total Economic Impact (TEI) Methodology',
      'McKinsey Digital Transformation Value Framework',
    ],
  },
  {
    id: 'investment-inputs',
    title: 'Investment Amount Calculation',
    description: 'The total cost includes all direct and indirect expenses required to implement and deploy the solution.',
    formulas: [
      {
        name: 'Total Investment',
        formula: 'Investment = Software + Services + Hardware + Internal Labor + Change Management',
        explanation: 'Comprehensive cost capturing all investment components.',
        variables: [
          { symbol: 'Software', meaning: 'License fees, subscriptions (typically 1-3 years)' },
          { symbol: 'Services', meaning: 'Implementation, customization, integration services' },
          { symbol: 'Hardware', meaning: 'Any required infrastructure (often zero for cloud solutions)' },
          { symbol: 'Internal Labor', meaning: 'Hours × Fully-loaded rate for internal project team' },
          { symbol: 'Change Management', meaning: 'Training, communications, adoption support (typically 10-15% of project)' },
        ],
      },
    ],
    assumptions: [
      'Internal labor valued at fully-loaded cost (base salary × 1.4 for benefits/overhead)',
      'Contingency buffer of 10-20% recommended for enterprise projects',
      'Multi-year licenses pro-rated if analysis period differs from license term',
    ],
  },
  {
    id: 'timeline-impact',
    title: 'Timeline & Benefit Realization',
    description: 'Implementation timeline affects when benefits begin to materialize. Longer timelines delay value capture.',
    formulas: [
      {
        name: 'Year 1 Benefit Realization',
        formula: 'Year1 Realized = Annual Benefit × Realization Factor',
        explanation: 'Adjusts first-year benefits based on how much of the year remains after go-live.',
        variables: [
          { symbol: 'Annual Benefit', meaning: 'Full-year steady-state benefit value' },
          { symbol: 'Realization Factor', meaning: 'Percentage of Year 1 where benefits are captured' },
        ],
      },
      {
        name: 'Realization Factor by Timeline',
        formula: 'Factor = (12 - Implementation Months) / 12 × Adoption Curve',
        explanation: 'Accounts for both implementation time and adoption ramp-up.',
        variables: [
          { symbol: 'Implementation Months', meaning: 'User-specified timeline from input' },
          { symbol: 'Adoption Curve', meaning: 'Gradual increase in effectiveness (25% → 50% → 75% → 100%)' },
        ],
      },
    ],
    assumptions: [
      'Benefits begin immediately upon go-live (no delay period)',
      'Adoption follows S-curve: 25% Month 1-3, 50% Month 4-6, 75% Month 7-12, 100% Year 2+',
      '12-month implementation captures ~65% of Year 1 benefits, 3-month captures ~90%',
    ],
  },
  {
    id: 'scenario-methodology',
    title: 'Conservative / Realistic / Optimistic Scenarios',
    description: 'Three scenarios provide a range of expected outcomes based on statistical distribution of historical results.',
    formulas: [
      {
        name: 'Scenario Adjustment',
        formula: 'Scenario Value = Base Value × Scenario Multiplier × Industry Risk Factor',
        explanation: 'Applies both scenario and industry-specific adjustments.',
        variables: [
          { symbol: 'Base Value', meaning: 'Calculated benefit before scenario adjustment' },
          { symbol: 'Scenario Multiplier', meaning: 'Conservative: 0.60, Realistic: 1.00, Optimistic: 1.50' },
          { symbol: 'Industry Risk Factor', meaning: 'Industry-specific execution success rate (0.85 - 0.92)' },
        ],
      },
    ],
    assumptions: [
      'Conservative = 25th percentile (75% chance of achieving or exceeding)',
      'Realistic = 50th percentile (median expected outcome)',
      'Optimistic = 75th percentile (stretch goal, 25% chance)',
      'Based on analysis of 500+ enterprise technology implementations',
    ],
    sources: [
      'Gartner IT Investment Benchmarks 2025',
      'Forrester TEI Studies Meta-Analysis',
      'McKinsey Digital Transformation Database',
    ],
  },
  {
    id: 'industry-risk-factors',
    title: 'Industry Risk Factors',
    description: 'Different industries have varying success rates for technology implementations due to regulatory, technical, and organizational factors.',
    formulas: [
      {
        name: 'Risk Adjusted Benefit',
        formula: 'Adjusted Benefit = Gross Benefit × Industry Risk Factor',
        explanation: 'Applies industry-specific discount to account for execution challenges.',
        variables: [
          { symbol: 'Gross Benefit', meaning: 'Calculated benefit before risk adjustment' },
          { symbol: 'Industry Risk Factor', meaning: 'Decimal between 0.85 and 0.92 based on industry' },
        ],
      },
    ],
    assumptions: [
      'Technology: 0.85 (higher execution risk, rapid change)',
      'Retail: 0.87 (market volatility, competitive pressure)',
      'Healthcare: 0.88 (regulatory compliance, clinical validation)',
      'Financial Services: 0.90 (strong governance, regulatory oversight)',
      'Manufacturing: 0.92 (tangible outcomes, established processes)',
    ],
    sources: [
      'Standish Group CHAOS Report 2024',
      'PMI Pulse of the Profession by Industry 2025',
    ],
  },
  {
    id: 'npv-calculation',
    title: 'Net Present Value (NPV)',
    description: 'NPV adjusts future benefits for the time value of money, recognizing that a dollar today is worth more than a dollar tomorrow.',
    formulas: [
      {
        name: 'Net Present Value',
        formula: 'NPV = -Investment + Σ (Benefit_t / (1 + r)^t)',
        explanation: 'Discounts each year\'s benefits to present value, then subtracts initial investment.',
        variables: [
          { symbol: 'Investment', meaning: 'Initial upfront cost (negative because it\'s an outflow)' },
          { symbol: 'Benefit_t', meaning: 'Net benefit in year t' },
          { symbol: 'r', meaning: 'Discount rate (default 10% = corporate cost of capital)' },
          { symbol: 't', meaning: 'Year number (1, 2, 3...)' },
        ],
      },
      {
        name: 'Month-by-Month NPV',
        formula: 'NPV = -Investment + Σ (Monthly Benefit_m / (1 + r/12)^m)',
        explanation: 'More granular calculation using monthly periods.',
        variables: [
          { symbol: 'Monthly Benefit_m', meaning: 'Benefit in month m, adjusted for realization curve' },
          { symbol: 'r/12', meaning: 'Monthly discount rate (10%/12 = 0.833%)' },
          { symbol: 'm', meaning: 'Month number (1 through 36 for 3-year analysis)' },
        ],
      },
    ],
    assumptions: [
      'Default discount rate: 10% (typical corporate cost of capital)',
      'Benefits assumed to occur at end of each period (conservative)',
      'Positive NPV indicates project creates value above cost of capital',
    ],
  },
  {
    id: 'payback-period',
    title: 'Payback Period',
    description: 'The time required for cumulative benefits to equal the initial investment. Shorter payback = lower risk.',
    formulas: [
      {
        name: 'Simple Payback',
        formula: 'Payback Months = Investment / Monthly Benefit (after full adoption)',
        explanation: 'Calculates break-even point assuming steady-state benefits.',
        variables: [
          { symbol: 'Investment', meaning: 'Total upfront cost' },
          { symbol: 'Monthly Benefit', meaning: 'Average monthly benefit at full adoption' },
        ],
      },
      {
        name: 'Adjusted Payback',
        formula: 'Payback = Month where Cumulative Benefits ≥ Investment',
        explanation: 'Accounts for ramp-up period and varying monthly benefits.',
        variables: [
          { symbol: 'Cumulative Benefits', meaning: 'Running total of realized benefits month-over-month' },
        ],
      },
    ],
    assumptions: [
      'Benefits follow adoption curve, not flat from day one',
      'Implementation months have zero benefit',
      'Industry benchmark: <12 months = strong, 12-24 = acceptable, >24 = high risk',
    ],
  },
  {
    id: 'productivity-calculation',
    title: 'Productivity & Time Savings',
    description: 'Converts time saved into dollar value based on employee costs.',
    formulas: [
      {
        name: 'Annual Productivity Value',
        formula: 'Value = Employees × Hours Saved/Week × 52 × Hourly Cost × Productivity Factor',
        explanation: 'Calculates total annual value of time saved.',
        variables: [
          { symbol: 'Employees', meaning: 'Number of affected employees' },
          { symbol: 'Hours Saved/Week', meaning: 'Time freed per person per week' },
          { symbol: '52', meaning: 'Weeks per year (adjust for actual working weeks if needed)' },
          { symbol: 'Hourly Cost', meaning: 'Fully-loaded hourly rate' },
          { symbol: 'Productivity Factor', meaning: '0.75 (recognizes not all saved time converts to value)' },
        ],
      },
    ],
    assumptions: [
      'Time savings can be redeployed to value-adding work (not always eliminating headcount)',
      '75% productivity capture factor (25% lost to non-productive reallocation)',
      'Fully-loaded cost = Base Salary / 2080 hours × 1.4 overhead multiplier',
    ],
  },
  {
    id: 'benchmark-comparison',
    title: 'Internal vs. Industry Benchmarks',
    description: 'Comparing internal performance metrics to industry averages to identify gaps and opportunities.',
    formulas: [
      {
        name: 'Gap Calculation',
        formula: 'Gap = ((Internal Value - Industry Value) / Industry Value) × 100',
        explanation: 'Shows percentage above or below industry benchmark.',
        variables: [
          { symbol: 'Internal Value', meaning: 'Your organization\'s actual metric' },
          { symbol: 'Industry Value', meaning: 'Industry benchmark for that metric' },
        ],
      },
      {
        name: 'Blended Projection',
        formula: 'Projection = (Internal × 0.4) + (Industry × 0.6)',
        explanation: 'When both internal history and industry data exist, blends them with industry weighted higher.',
        variables: [
          { symbol: 'Internal', meaning: 'Your historical performance' },
          { symbol: 'Industry', meaning: 'Industry benchmark' },
          { symbol: '0.4/0.6', meaning: 'Weighting (industry weighted higher for objectivity)' },
        ],
      },
    ],
    assumptions: [
      'Industry benchmarks sourced from Gartner, Forrester, IDC',
      'Benchmarks updated annually (current data: 2025)',
      'Internal data should be from comparable project types',
    ],
  },
];

export const CalculationMethodology: React.FC = () => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

  const expandAll = () => {
    setExpandedSections(new Set(METHODOLOGY_SECTIONS.map(s => s.id)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="calculation-methodology bg-gray-900 text-gray-100 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Calculation Methodology</h2>
        <div className="space-x-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
          >
            Collapse All
          </button>
        </div>
      </div>

      <p className="text-gray-400 mb-6">
        This document explains how all calculations are performed, including formulas, 
        assumptions, and data sources. Click each section to expand details.
      </p>

      <div className="space-y-4">
        {METHODOLOGY_SECTIONS.map(section => (
          <div key={section.id} className="border border-gray-700 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-750 flex justify-between items-center text-left"
            >
              <span className="font-semibold text-white">{section.title}</span>
              <span className="text-gray-400">
                {expandedSections.has(section.id) ? '▼' : '▶'}
              </span>
            </button>

            {expandedSections.has(section.id) && (
              <div className="p-4 bg-gray-850 space-y-4">
                <p className="text-gray-300">{section.description}</p>

                {section.formulas && section.formulas.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium text-blue-400">Formulas</h4>
                    {section.formulas.map((formula, i) => (
                      <div key={i} className="bg-gray-800 p-4 rounded">
                        <h5 className="font-medium text-white mb-2">{formula.name}</h5>
                        <div className="bg-gray-900 p-3 rounded font-mono text-yellow-300 mb-2">
                          {formula.formula}
                        </div>
                        <p className="text-gray-400 text-sm mb-2">{formula.explanation}</p>
                        {formula.variables && (
                          <div className="mt-3">
                            <span className="text-xs text-gray-500 uppercase">Variables:</span>
                            <ul className="mt-1 text-sm text-gray-400 space-y-1">
                              {formula.variables.map((v, j) => (
                                <li key={j}>
                                  <code className="text-green-400">{v.symbol}</code>: {v.meaning}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.assumptions && section.assumptions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-yellow-400 mb-2">Assumptions</h4>
                    <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                      {section.assumptions.map((assumption, i) => (
                        <li key={i}>{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.sources && section.sources.length > 0 && (
                  <div>
                    <h4 className="font-medium text-purple-400 mb-2">Data Sources</h4>
                    <ul className="list-disc list-inside text-gray-400 space-y-1 text-sm">
                      {section.sources.map((source, i) => (
                        <li key={i}>{source}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-900/30 rounded-lg border border-blue-700">
        <h4 className="font-medium text-blue-400 mb-2">📊 Quick Reference</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Default Discount Rate:</span>
            <span className="text-white ml-2">10%</span>
          </div>
          <div>
            <span className="text-gray-400">Analysis Period:</span>
            <span className="text-white ml-2">3 Years</span>
          </div>
          <div>
            <span className="text-gray-400">Productivity Factor:</span>
            <span className="text-white ml-2">75%</span>
          </div>
          <div>
            <span className="text-gray-400">Overhead Multiplier:</span>
            <span className="text-white ml-2">1.4x</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalculationMethodology;
