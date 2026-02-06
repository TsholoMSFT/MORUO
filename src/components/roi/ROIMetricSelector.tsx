/**
 * ROI Metric Selector Component
 * 
 * Implements CFO feedback:
 * - Determine which key ROI metric should be the primary input
 * - Allow selection of primary metric for demo purposes
 * - Clear explanation of each metric type
 */

import React, { useState } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type PrimaryMetricType = 'revenue' | 'costReduction' | 'timeToMarket' | 'productivity';

export interface MetricOption {
  id: PrimaryMetricType;
  label: string;
  description: string;
  icon: string;
  useCases: string[];
  requiredInputs: string[];
  exampleCalculation: string;
  bestFor: string[];
}

export interface ROIMetricSelectorProps {
  selectedMetric: PrimaryMetricType;
  onMetricChange: (metric: PrimaryMetricType) => void;
  showDetails?: boolean;
}

// ============================================================================
// METRIC DEFINITIONS
// ============================================================================

export const METRIC_OPTIONS: MetricOption[] = [
  {
    id: 'revenue',
    label: 'Revenue Impact',
    description: 'Measures direct increase in top-line revenue from the investment',
    icon: '📈',
    useCases: [
      'New product launches',
      'Sales enablement tools',
      'Marketing automation',
      'Customer acquisition platforms',
    ],
    requiredInputs: [
      'Annual revenue',
      'Expected revenue increase %',
      'Time to realize benefit',
    ],
    exampleCalculation: 'If annual revenue is $10M and expected increase is 5%, benefit = $500K/year',
    bestFor: [
      'Growth-stage companies',
      'Sales-focused initiatives',
      'Market expansion projects',
    ],
  },
  {
    id: 'costReduction',
    label: 'Cost Reduction',
    description: 'Measures reduction in operational or overhead costs',
    icon: '💰',
    useCases: [
      'Process automation',
      'Infrastructure modernization',
      'Vendor consolidation',
      'Operational efficiency improvements',
    ],
    requiredInputs: [
      'Current annual operating costs',
      'Expected cost reduction %',
      'Implementation cost',
    ],
    exampleCalculation: 'If annual costs are $5M and reduction is 20%, savings = $1M/year',
    bestFor: [
      'Mature companies',
      'Efficiency-focused initiatives',
      'IT modernization projects',
    ],
  },
  {
    id: 'timeToMarket',
    label: 'Time to Market',
    description: 'Measures value of reduced time to launch products or services',
    icon: '⚡',
    useCases: [
      'DevOps improvements',
      'Agile transformation',
      'Platform modernization',
      'Development tool upgrades',
    ],
    requiredInputs: [
      'Current time to market (weeks/months)',
      'Expected time reduction',
      'Revenue per month acceleration value',
    ],
    exampleCalculation: 'If launching 2 months faster on a $1M ARR product, benefit = ~$167K (2 months of revenue)',
    bestFor: [
      'Product companies',
      'Competitive markets',
      'Innovation-focused organizations',
    ],
  },
  {
    id: 'productivity',
    label: 'Productivity Gains',
    description: 'Measures time savings and increased output per employee',
    icon: '⏱️',
    useCases: [
      'Workflow automation',
      'Collaboration tools',
      'AI/ML assistants',
      'Knowledge management',
    ],
    requiredInputs: [
      'Number of employees affected',
      'Current time spent on task (hours/week)',
      'Expected time reduction',
      'Average hourly cost',
    ],
    exampleCalculation: 'If 100 employees save 5 hours/week at $50/hr, benefit = $1.3M/year',
    bestFor: [
      'Large organizations',
      'Process-heavy industries',
      'Knowledge worker initiatives',
    ],
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const ROIMetricSelector: React.FC<ROIMetricSelectorProps> = ({
  selectedMetric,
  onMetricChange,
  showDetails = true,
}) => {
  const [hoveredMetric, setHoveredMetric] = useState<PrimaryMetricType | null>(null);

  const selectedOption = METRIC_OPTIONS.find(m => m.id === selectedMetric);
  const displayOption = hoveredMetric 
    ? METRIC_OPTIONS.find(m => m.id === hoveredMetric) 
    : selectedOption;

  return (
    <div className="roi-metric-selector space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Primary ROI Metric</h3>
        <p className="text-sm text-gray-600 mt-1">
          Select the primary metric that best represents the value of this investment.
          This will be the main driver for ROI calculations.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRIC_OPTIONS.map((metric) => (
          <button
            key={metric.id}
            onClick={() => onMetricChange(metric.id)}
            onMouseEnter={() => setHoveredMetric(metric.id)}
            onMouseLeave={() => setHoveredMetric(null)}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              selectedMetric === metric.id
                ? 'border-blue-500 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <span className={`font-semibold ${
                selectedMetric === metric.id ? 'text-blue-700' : 'text-gray-900'
              }`}>
                {metric.label}
              </span>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">
              {metric.description}
            </p>
            {selectedMetric === metric.id && (
              <div className="mt-2 flex items-center text-blue-600 text-sm">
                <span className="mr-1">✓</span> Selected
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Details Panel */}
      {showDetails && displayOption && (
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{displayOption.icon}</span>
            <div>
              <h4 className="text-lg font-semibold text-gray-900">{displayOption.label}</h4>
              <p className="text-gray-600">{displayOption.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Use Cases */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Common Use Cases</h5>
              <ul className="space-y-1">
                {displayOption.useCases.map((useCase, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>

            {/* Required Inputs */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Required Inputs</h5>
              <ul className="space-y-1">
                {displayOption.requiredInputs.map((input, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    {input}
                  </li>
                ))}
              </ul>
            </div>

            {/* Best For */}
            <div>
              <h5 className="font-medium text-gray-900 mb-2">Best For</h5>
              <ul className="space-y-1">
                {displayOption.bestFor.map((item, index) => (
                  <li key={index} className="text-sm text-gray-600 flex items-start">
                    <span className="text-purple-500 mr-2">★</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Example Calculation */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-2">Example Calculation</h5>
            <p className="text-sm text-gray-700 font-mono bg-gray-100 p-2 rounded">
              {displayOption.exampleCalculation}
            </p>
          </div>
        </div>
      )}

      {/* Methodology Note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h5 className="font-medium text-blue-800 mb-2">💡 Selection Guidance</h5>
        <div className="text-sm text-blue-700 space-y-1">
          <p>
            <strong>For executive demos:</strong> Revenue Impact or Cost Reduction typically 
            resonate most strongly as they directly tie to financial outcomes.
          </p>
          <p>
            <strong>For technical stakeholders:</strong> Time to Market or Productivity Gains 
            often better capture the value of development and operational improvements.
          </p>
          <p>
            The selected primary metric will drive the main ROI calculation. Secondary metrics
            can still be tracked for a comprehensive view.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ROIMetricSelector;
