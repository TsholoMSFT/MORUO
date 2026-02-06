/**
 * Benchmark Comparison Component
 * 
 * Implements CFO feedback:
 * - Display company-specific internal benchmarks alongside industry benchmarks
 * - Visual side-by-side comparison
 * - Gap analysis with actionable insights
 * 
 * METHODOLOGY:
 * - Industry benchmarks sourced from Gartner, Forrester, McKinsey reports
 * - Internal benchmarks input by user from company data
 * - Gap calculated as (Internal - Industry) with directional interpretation
 */

import React, { useState, useMemo } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface BenchmarkMetric {
  id: string;
  name: string;
  category: string;
  description: string;
  unit: string;
  higherIsBetter: boolean;
  industryValue: number;
  industrySource: string;
  industryPercentile?: number;
  internalValue?: number;
  internalSource?: string;
  internalConfidence?: 'low' | 'medium' | 'high';
}

export interface BenchmarkGap {
  metric: BenchmarkMetric;
  absoluteGap: number;
  percentageGap: number;
  direction: 'above' | 'below' | 'at-par';
  performance: 'exceeding' | 'meeting' | 'below';
  insight: string;
  priority: 'high' | 'medium' | 'low';
}

export interface BenchmarkComparisonProps {
  industry: string;
  companySize: string;
  onBenchmarksChange?: (benchmarks: BenchmarkMetric[]) => void;
  showEditMode?: boolean;
}

// ============================================================================
// INDUSTRY BENCHMARK DATA
// ============================================================================

const INDUSTRY_BENCHMARKS: Record<string, BenchmarkMetric[]> = {
  technology: [
    {
      id: 'revenue-per-employee',
      name: 'Revenue per Employee',
      category: 'Financial',
      description: 'Annual revenue divided by total employee count',
      unit: '$',
      higherIsBetter: true,
      industryValue: 350000,
      industrySource: 'Gartner IT Key Metrics (2025)',
      industryPercentile: 50,
    },
    {
      id: 'customer-acquisition-cost',
      name: 'Customer Acquisition Cost',
      category: 'Marketing',
      description: 'Average cost to acquire a new customer',
      unit: '$',
      higherIsBetter: false,
      industryValue: 395,
      industrySource: 'McKinsey SaaS Benchmarks (2025)',
      industryPercentile: 50,
    },
    {
      id: 'employee-turnover',
      name: 'Employee Turnover Rate',
      category: 'HR',
      description: 'Annual voluntary employee turnover',
      unit: '%',
      higherIsBetter: false,
      industryValue: 13.2,
      industrySource: 'LinkedIn Workforce Report (2025)',
      industryPercentile: 50,
    },
    {
      id: 'time-to-market',
      name: 'Time to Market',
      category: 'Operations',
      description: 'Average time from concept to launch',
      unit: 'weeks',
      higherIsBetter: false,
      industryValue: 16,
      industrySource: 'Forrester Product Development Study (2025)',
      industryPercentile: 50,
    },
    {
      id: 'nps',
      name: 'Net Promoter Score',
      category: 'Customer',
      description: 'Customer loyalty and satisfaction metric',
      unit: 'score',
      higherIsBetter: true,
      industryValue: 41,
      industrySource: 'Bain NPS Benchmarks (2025)',
      industryPercentile: 50,
    },
    {
      id: 'gross-margin',
      name: 'Gross Margin',
      category: 'Financial',
      description: 'Revenue minus cost of goods sold, as percentage',
      unit: '%',
      higherIsBetter: true,
      industryValue: 72,
      industrySource: 'SaaS Capital Metrics Report (2025)',
      industryPercentile: 50,
    },
  ],
  financialServices: [
    {
      id: 'cost-income-ratio',
      name: 'Cost-to-Income Ratio',
      category: 'Financial',
      description: 'Operating expenses as percentage of income',
      unit: '%',
      higherIsBetter: false,
      industryValue: 58,
      industrySource: 'McKinsey Banking Practice (2025)',
      industryPercentile: 50,
    },
    {
      id: 'customer-retention',
      name: 'Customer Retention Rate',
      category: 'Customer',
      description: 'Percentage of customers retained year-over-year',
      unit: '%',
      higherIsBetter: true,
      industryValue: 89,
      industrySource: 'Bain Financial Services Study (2025)',
      industryPercentile: 50,
    },
    {
      id: 'digital-adoption',
      name: 'Digital Channel Adoption',
      category: 'Operations',
      description: 'Percentage of transactions via digital channels',
      unit: '%',
      higherIsBetter: true,
      industryValue: 72,
      industrySource: 'Deloitte Digital Banking Report (2025)',
      industryPercentile: 50,
    },
    {
      id: 'processing-time',
      name: 'Loan Processing Time',
      category: 'Operations',
      description: 'Average days to process a loan application',
      unit: 'days',
      higherIsBetter: false,
      industryValue: 12,
      industrySource: 'McKinsey Operations Benchmark (2025)',
      industryPercentile: 50,
    },
    {
      id: 'nps',
      name: 'Net Promoter Score',
      category: 'Customer',
      description: 'Customer loyalty and satisfaction metric',
      unit: 'score',
      higherIsBetter: true,
      industryValue: 35,
      industrySource: 'JD Power Financial Study (2025)',
      industryPercentile: 50,
    },
  ],
  healthcare: [
    {
      id: 'patient-satisfaction',
      name: 'Patient Satisfaction Score',
      category: 'Customer',
      description: 'HCAHPS overall rating',
      unit: 'score',
      higherIsBetter: true,
      industryValue: 72,
      industrySource: 'CMS HCAHPS Data (2025)',
      industryPercentile: 50,
    },
    {
      id: 'readmission-rate',
      name: '30-Day Readmission Rate',
      category: 'Quality',
      description: 'Percentage of patients readmitted within 30 days',
      unit: '%',
      higherIsBetter: false,
      industryValue: 15.2,
      industrySource: 'CMS Hospital Compare (2025)',
      industryPercentile: 50,
    },
    {
      id: 'claims-processing-time',
      name: 'Claims Processing Time',
      category: 'Operations',
      description: 'Average days to process insurance claims',
      unit: 'days',
      higherIsBetter: false,
      industryValue: 18,
      industrySource: 'HFMA Benchmarking (2025)',
      industryPercentile: 50,
    },
    {
      id: 'staff-turnover',
      name: 'Staff Turnover Rate',
      category: 'HR',
      description: 'Annual voluntary nursing staff turnover',
      unit: '%',
      higherIsBetter: false,
      industryValue: 22,
      industrySource: 'NSI Nursing Solutions (2025)',
      industryPercentile: 50,
    },
  ],
  manufacturing: [
    {
      id: 'oee',
      name: 'Overall Equipment Effectiveness',
      category: 'Operations',
      description: 'Availability × Performance × Quality',
      unit: '%',
      higherIsBetter: true,
      industryValue: 65,
      industrySource: 'Industry Week Manufacturing Survey (2025)',
      industryPercentile: 50,
    },
    {
      id: 'defect-rate',
      name: 'Defect Rate',
      category: 'Quality',
      description: 'Defects per million opportunities (DPMO)',
      unit: 'DPMO',
      higherIsBetter: false,
      industryValue: 3400,
      industrySource: 'ASQ Quality Benchmark (2025)',
      industryPercentile: 50,
    },
    {
      id: 'inventory-turns',
      name: 'Inventory Turns',
      category: 'Operations',
      description: 'Times inventory is sold/replaced per year',
      unit: 'turns',
      higherIsBetter: true,
      industryValue: 8.2,
      industrySource: 'APICS Supply Chain Metrics (2025)',
      industryPercentile: 50,
    },
    {
      id: 'on-time-delivery',
      name: 'On-Time Delivery Rate',
      category: 'Operations',
      description: 'Percentage of orders delivered on time',
      unit: '%',
      higherIsBetter: true,
      industryValue: 92,
      industrySource: 'CSCMP Supply Chain Study (2025)',
      industryPercentile: 50,
    },
  ],
  retail: [
    {
      id: 'same-store-sales',
      name: 'Same-Store Sales Growth',
      category: 'Financial',
      description: 'Year-over-year revenue growth at existing locations',
      unit: '%',
      higherIsBetter: true,
      industryValue: 3.2,
      industrySource: 'NRF Retail Benchmarks (2025)',
      industryPercentile: 50,
    },
    {
      id: 'inventory-shrinkage',
      name: 'Inventory Shrinkage',
      category: 'Operations',
      description: 'Loss due to theft, damage, or errors',
      unit: '%',
      higherIsBetter: false,
      industryValue: 1.4,
      industrySource: 'NRF Security Survey (2025)',
      industryPercentile: 50,
    },
    {
      id: 'conversion-rate',
      name: 'Conversion Rate',
      category: 'Sales',
      description: 'Percentage of visitors who make a purchase',
      unit: '%',
      higherIsBetter: true,
      industryValue: 2.8,
      industrySource: 'Statista E-commerce Report (2025)',
      industryPercentile: 50,
    },
    {
      id: 'customer-lifetime-value',
      name: 'Customer Lifetime Value',
      category: 'Customer',
      description: 'Total revenue expected from a customer',
      unit: '$',
      higherIsBetter: true,
      industryValue: 280,
      industrySource: 'Forrester Retail Research (2025)',
      industryPercentile: 50,
    },
  ],
  professional_services: [
    {
      id: 'utilization-rate',
      name: 'Billable Utilization Rate',
      category: 'Operations',
      description: 'Percentage of time spent on billable work',
      unit: '%',
      higherIsBetter: true,
      industryValue: 68,
      industrySource: 'SPI Professional Services Maturity (2025)',
      industryPercentile: 50,
    },
    {
      id: 'revenue-per-consultant',
      name: 'Revenue per Consultant',
      category: 'Financial',
      description: 'Annual revenue per consulting professional',
      unit: '$',
      higherIsBetter: true,
      industryValue: 245000,
      industrySource: 'Kennedy Consulting Research (2025)',
      industryPercentile: 50,
    },
    {
      id: 'project-margin',
      name: 'Project Gross Margin',
      category: 'Financial',
      description: 'Gross margin on project engagements',
      unit: '%',
      higherIsBetter: true,
      industryValue: 38,
      industrySource: 'SPI Benchmark Report (2025)',
      industryPercentile: 50,
    },
    {
      id: 'client-retention',
      name: 'Client Retention Rate',
      category: 'Customer',
      description: 'Percentage of clients with repeat engagements',
      unit: '%',
      higherIsBetter: true,
      industryValue: 72,
      industrySource: 'Hinge Research Institute (2025)',
      industryPercentile: 50,
    },
  ],
};

const DEFAULT_BENCHMARKS: BenchmarkMetric[] = [
  {
    id: 'revenue-growth',
    name: 'Revenue Growth Rate',
    category: 'Financial',
    description: 'Year-over-year revenue growth',
    unit: '%',
    higherIsBetter: true,
    industryValue: 8.5,
    industrySource: 'Cross-Industry Average, S&P (2025)',
    industryPercentile: 50,
  },
  {
    id: 'operating-margin',
    name: 'Operating Margin',
    category: 'Financial',
    description: 'Operating income as percentage of revenue',
    unit: '%',
    higherIsBetter: true,
    industryValue: 12,
    industrySource: 'Cross-Industry Average, Deloitte (2025)',
    industryPercentile: 50,
  },
  {
    id: 'employee-productivity',
    name: 'Revenue per Employee',
    category: 'Operations',
    description: 'Annual revenue divided by employee count',
    unit: '$',
    higherIsBetter: true,
    industryValue: 280000,
    industrySource: 'Bureau of Labor Statistics (2025)',
    industryPercentile: 50,
  },
  {
    id: 'customer-satisfaction',
    name: 'Customer Satisfaction',
    category: 'Customer',
    description: 'Overall customer satisfaction score',
    unit: 'score (100)',
    higherIsBetter: true,
    industryValue: 78,
    industrySource: 'ACSI Cross-Industry Report (2025)',
    industryPercentile: 50,
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateGap(metric: BenchmarkMetric): BenchmarkGap | null {
  if (metric.internalValue === undefined) return null;

  const absoluteGap = metric.internalValue - metric.industryValue;
  const percentageGap = metric.industryValue !== 0
    ? (absoluteGap / metric.industryValue) * 100
    : 0;

  let direction: 'above' | 'below' | 'at-par';
  if (Math.abs(percentageGap) < 5) {
    direction = 'at-par';
  } else if (absoluteGap > 0) {
    direction = 'above';
  } else {
    direction = 'below';
  }

  let performance: 'exceeding' | 'meeting' | 'below';
  if (direction === 'at-par') {
    performance = 'meeting';
  } else if (metric.higherIsBetter) {
    performance = direction === 'above' ? 'exceeding' : 'below';
  } else {
    performance = direction === 'below' ? 'exceeding' : 'below';
  }

  let insight: string;
  let priority: 'high' | 'medium' | 'low';

  if (performance === 'exceeding') {
    insight = `Outperforming industry by ${Math.abs(percentageGap).toFixed(1)}%. Competitive advantage.`;
    priority = 'low';
  } else if (performance === 'meeting') {
    insight = `Performing in line with industry standards.`;
    priority = 'medium';
  } else {
    insight = `${Math.abs(percentageGap).toFixed(1)}% gap to industry benchmark. Improvement opportunity.`;
    priority = Math.abs(percentageGap) > 20 ? 'high' : 'medium';
  }

  return { metric, absoluteGap, percentageGap, direction, performance, insight, priority };
}

function formatValue(value: number, unit: string): string {
  if (unit === '$') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
  }
  if (unit === '%') return `${value.toFixed(1)}%`;
  return `${value.toLocaleString()} ${unit}`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const BenchmarkComparison: React.FC<BenchmarkComparisonProps> = ({
  industry,
  companySize,
  onBenchmarksChange,
  showEditMode = true,
}) => {
  const industryBenchmarks = INDUSTRY_BENCHMARKS[industry] || DEFAULT_BENCHMARKS;
  const [benchmarks, setBenchmarks] = useState<BenchmarkMetric[]>(industryBenchmarks);
  const [isEditing, setIsEditing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const gaps = useMemo(() => {
    return benchmarks.map(calculateGap).filter((gap): gap is BenchmarkGap => gap !== null);
  }, [benchmarks]);

  const categories = useMemo(() => {
    const cats = [...new Set(benchmarks.map(b => b.category))];
    return ['all', ...cats];
  }, [benchmarks]);

  const filteredBenchmarks = useMemo(() => {
    if (activeCategory === 'all') return benchmarks;
    return benchmarks.filter(b => b.category === activeCategory);
  }, [benchmarks, activeCategory]);

  const handleInternalValueChange = (metricId: string, value: string) => {
    const numValue = value === '' ? undefined : parseFloat(value);
    const updated = benchmarks.map(b => b.id === metricId ? { ...b, internalValue: numValue } : b);
    setBenchmarks(updated);
    onBenchmarksChange?.(updated);
  };

  const summaryStats = useMemo(() => {
    const withInternal = benchmarks.filter(b => b.internalValue !== undefined);
    return {
      total: benchmarks.length,
      withData: withInternal.length,
      exceeding: gaps.filter(g => g.performance === 'exceeding').length,
      meeting: gaps.filter(g => g.performance === 'meeting').length,
      below: gaps.filter(g => g.performance === 'below').length,
    };
  }, [benchmarks, gaps]);

  return (
    <div className="benchmark-comparison space-y-6">
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Benchmark Comparison</h3>
          <p className="text-sm text-gray-600 mt-1">
            Compare performance against {industry.replace(/_/g, ' ')} industry benchmarks
          </p>
        </div>
        {showEditMode && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              isEditing ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isEditing ? 'Done' : 'Add Internal Data'}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="text-2xl font-bold">{summaryStats.withData}/{summaryStats.total}</div>
          <div className="text-sm text-gray-600">With Data</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-700">{summaryStats.exceeding}</div>
          <div className="text-sm text-green-600">Exceeding</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-700">{summaryStats.meeting}</div>
          <div className="text-sm text-yellow-600">At Par</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-red-700">{summaryStats.below}</div>
          <div className="text-sm text-red-600">Below</div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium ${
              activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {cat === 'all' ? 'All' : cat}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-3 text-sm font-semibold">Metric</th>
              <th className="text-center p-3 text-sm font-semibold">Industry</th>
              <th className="text-center p-3 text-sm font-semibold">Internal</th>
              <th className="text-center p-3 text-sm font-semibold">Gap</th>
              <th className="text-center p-3 text-sm font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredBenchmarks.map(metric => {
              const gap = calculateGap(metric);
              return (
                <tr key={metric.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-xs text-gray-500">{metric.description}</div>
                  </td>
                  <td className="p-3 text-center">
                    <div className="font-semibold">{formatValue(metric.industryValue, metric.unit)}</div>
                    <div className="text-xs text-gray-500">{metric.industrySource}</div>
                  </td>
                  <td className="p-3 text-center">
                    {isEditing ? (
                      <input
                        type="number"
                        value={metric.internalValue ?? ''}
                        onChange={(e) => handleInternalValueChange(metric.id, e.target.value)}
                        className="w-24 px-2 py-1 border rounded text-center text-sm"
                        placeholder="Value"
                      />
                    ) : metric.internalValue !== undefined ? (
                      <div className="font-semibold text-blue-700">
                        {formatValue(metric.internalValue, metric.unit)}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {gap ? (
                      <span className={
                        gap.performance === 'exceeding' ? 'text-green-600 font-semibold' :
                        gap.performance === 'meeting' ? 'text-yellow-600' : 'text-red-600 font-semibold'
                      }>
                        {gap.percentageGap > 0 ? '+' : ''}{gap.percentageGap.toFixed(1)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="p-3 text-center">
                    {gap ? (
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        gap.performance === 'exceeding' ? 'bg-green-100 text-green-800' :
                        gap.performance === 'meeting' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {gap.performance === 'exceeding' ? '↑ Exceeding' :
                         gap.performance === 'meeting' ? '→ At Par' : '↓ Below'}
                      </span>
                    ) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 mb-2">📊 Methodology</h5>
        <p className="text-sm text-blue-700">
          Industry benchmarks represent 50th percentile for {industry.replace(/_/g, ' ')} sector.
          Gap = ((Internal - Industry) / Industry) × 100. Status: Exceeding (±5% favorable),
          At Par (within 5%), Below (&gt;5% unfavorable).
        </p>
      </div>
    </div>
  );
};

export default BenchmarkComparison;
