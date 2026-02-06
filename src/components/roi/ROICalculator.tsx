/**
 * ROI Calculator Component
 * 
 * Comprehensive ROI calculation tool implementing all CFO feedback:
 * 1. Industry-backed scenario methodology (conservative/realistic/optimistic)
 * 2. Internal data integration for improved accuracy
 * 3. Configurable primary metric selection
 * 4. Detailed methodology and assumption transparency
 */

import React, { useState, useMemo, useCallback } from 'react';
import { ROIMetricSelector, PrimaryMetricType } from './ROIMetricSelector';
import { 
  calculateROI, 
  ROIInput, 
  ROICalculationResult, 
  INDUSTRY_BENCHMARKS 
} from '../../services/roiCalculationService';

// ============================================================================
// TYPES
// ============================================================================

interface ROICalculatorProps {
  onCalculationComplete?: (result: ROICalculationResult) => void;
  initialValues?: Partial<ROIInput>;
}

type CalculatorStep = 'metric' | 'inputs' | 'internal' | 'results';

// ============================================================================
// COMPONENT
// ============================================================================

export const ROICalculator: React.FC<ROICalculatorProps> = ({
  onCalculationComplete,
  initialValues,
}) => {
  // State
  const [currentStep, setCurrentStep] = useState<CalculatorStep>('metric');
  const [primaryMetric, setPrimaryMetric] = useState<PrimaryMetricType>(
    initialValues?.primaryMetric || 'costReduction'
  );
  const [formData, setFormData] = useState<Partial<ROIInput>>({
    primaryMetric: 'costReduction',
    industry: 'technology',
    companySize: 'midmarket',
    implementationCost: 0,
    ongoingAnnualCost: 0,
    customMultiplier: 1,
    ...initialValues,
  });
  const [result, setResult] = useState<ROICalculationResult | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'conservative' | 'realistic' | 'optimistic'>('realistic');

  // Industry options
  const industries = Object.keys(INDUSTRY_BENCHMARKS).map(key => ({
    value: key,
    label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
  }));

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof ROIInput, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Calculate ROI
  const handleCalculate = useCallback(() => {
    try {
      const input: ROIInput = {
        primaryMetric,
        industry: formData.industry as ROIInput['industry'],
        companySize: formData.companySize as ROIInput['companySize'],
        implementationCost: formData.implementationCost || 0,
        ongoingAnnualCost: formData.ongoingAnnualCost || 0,
        annualRevenue: formData.annualRevenue,
        annualOperatingCosts: formData.annualOperatingCosts,
        currentProcessTimeHours: formData.currentProcessTimeHours,
        expectedProcessTimeHours: formData.expectedProcessTimeHours,
        employeeCount: formData.employeeCount,
        averageHourlyCost: formData.averageHourlyCost || 75,
        customMultiplier: formData.customMultiplier || 1,
        internalBenchmarks: formData.internalBenchmarks,
        notes: formData.notes,
      };

      const calculationResult = calculateROI(input);
      setResult(calculationResult);
      setCurrentStep('results');
      onCalculationComplete?.(calculationResult);
    } catch (error) {
      console.error('ROI calculation failed:', error);
    }
  }, [formData, primaryMetric, onCalculationComplete]);

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Current scenario data
  const currentScenario = result?.scenarios[activeScenario];

  // Steps navigation
  const steps: { id: CalculatorStep; label: string; icon: string }[] = [
    { id: 'metric', label: 'Select Metric', icon: '1' },
    { id: 'inputs', label: 'Enter Data', icon: '2' },
    { id: 'internal', label: 'Internal Benchmarks', icon: '3' },
    { id: 'results', label: 'Results', icon: '4' },
  ];

  return (
    <div className="roi-calculator max-w-5xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
            >
              <div 
                className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : steps.findIndex(s => s.id === currentStep) > index
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {steps.findIndex(s => s.id === currentStep) > index ? '✓' : step.icon}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                currentStep === step.id ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {step.label}
              </span>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-1 mx-4 ${
                  steps.findIndex(s => s.id === currentStep) > index
                    ? 'bg-green-500'
                    : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Metric Selection */}
      {currentStep === 'metric' && (
        <div className="space-y-6">
          <ROIMetricSelector
            selectedMetric={primaryMetric}
            onMetricChange={(metric) => {
              setPrimaryMetric(metric);
              handleFieldChange('primaryMetric', metric);
            }}
          />
          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep('inputs')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Input Data */}
      {currentStep === 'inputs' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Investment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Industry */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  value={formData.industry}
                  onChange={(e) => handleFieldChange('industry', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  {industries.map(ind => (
                    <option key={ind.value} value={ind.value}>{ind.label}</option>
                  ))}
                </select>
              </div>

              {/* Company Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Size
                </label>
                <select
                  value={formData.companySize}
                  onChange={(e) => handleFieldChange('companySize', e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="startup">Startup (&lt;50 employees)</option>
                  <option value="smb">SMB (50-250 employees)</option>
                  <option value="midmarket">Mid-Market (250-1000 employees)</option>
                  <option value="enterprise">Enterprise (1000+ employees)</option>
                </select>
              </div>

              {/* Implementation Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Implementation Cost ($)
                </label>
                <input
                  type="number"
                  value={formData.implementationCost || ''}
                  onChange={(e) => handleFieldChange('implementationCost', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 100000"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Ongoing Annual Cost */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ongoing Annual Cost ($)
                </label>
                <input
                  type="number"
                  value={formData.ongoingAnnualCost || ''}
                  onChange={(e) => handleFieldChange('ongoingAnnualCost', parseFloat(e.target.value) || 0)}
                  placeholder="e.g., 25000"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              {/* Metric-specific inputs */}
              {primaryMetric === 'revenue' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Revenue ($)
                  </label>
                  <input
                    type="number"
                    value={formData.annualRevenue || ''}
                    onChange={(e) => handleFieldChange('annualRevenue', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 10000000"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              {primaryMetric === 'costReduction' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Operating Costs ($)
                  </label>
                  <input
                    type="number"
                    value={formData.annualOperatingCosts || ''}
                    onChange={(e) => handleFieldChange('annualOperatingCosts', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 5000000"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}

              {(primaryMetric === 'timeToMarket' || primaryMetric === 'productivity') && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Process Time (hours/month)
                    </label>
                    <input
                      type="number"
                      value={formData.currentProcessTimeHours || ''}
                      onChange={(e) => handleFieldChange('currentProcessTimeHours', parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 160"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Process Time (hours/month)
                    </label>
                    <input
                      type="number"
                      value={formData.expectedProcessTimeHours || ''}
                      onChange={(e) => handleFieldChange('expectedProcessTimeHours', parseFloat(e.target.value) || 0)}
                      placeholder="e.g., 80"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              {primaryMetric === 'productivity' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Number of Employees Affected
                    </label>
                    <input
                      type="number"
                      value={formData.employeeCount || ''}
                      onChange={(e) => handleFieldChange('employeeCount', parseInt(e.target.value) || 0)}
                      placeholder="e.g., 50"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Average Hourly Cost ($)
                    </label>
                    <input
                      type="number"
                      value={formData.averageHourlyCost || ''}
                      onChange={(e) => handleFieldChange('averageHourlyCost', parseFloat(e.target.value) || 75)}
                      placeholder="e.g., 75"
                      className="w-full px-3 py-2 border rounded-lg"
                    />
                  </div>
                </>
              )}

              {primaryMetric === 'timeToMarket' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Annual Revenue (for time value calculation)
                  </label>
                  <input
                    type="number"
                    value={formData.annualRevenue || ''}
                    onChange={(e) => handleFieldChange('annualRevenue', parseFloat(e.target.value) || 0)}
                    placeholder="e.g., 10000000"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('metric')}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={() => setCurrentStep('internal')}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Internal Benchmarks */}
      {currentStep === 'internal' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2">Internal Benchmarks (Optional)</h3>
            <p className="text-sm text-gray-600 mb-4">
              Providing internal historical data improves calculation accuracy by blending 
              your actual experience with industry benchmarks.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Historical ROI (%)
                </label>
                <input
                  type="number"
                  value={formData.internalBenchmarks?.historicalROI || ''}
                  onChange={(e) => handleFieldChange('internalBenchmarks', {
                    ...formData.internalBenchmarks,
                    historicalROI: parseFloat(e.target.value) || undefined,
                  })}
                  placeholder="e.g., 150"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Average ROI from similar past projects</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Average Payback Period (months)
                </label>
                <input
                  type="number"
                  value={formData.internalBenchmarks?.averageProjectPayback || ''}
                  onChange={(e) => handleFieldChange('internalBenchmarks', {
                    ...formData.internalBenchmarks,
                    averageProjectPayback: parseFloat(e.target.value) || undefined,
                  })}
                  placeholder="e.g., 12"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Typical time to break even</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Success Rate (%)
                </label>
                <input
                  type="number"
                  value={formData.internalBenchmarks?.successRate || ''}
                  onChange={(e) => handleFieldChange('internalBenchmarks', {
                    ...formData.internalBenchmarks,
                    successRate: parseFloat(e.target.value) || undefined,
                  })}
                  placeholder="e.g., 80"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">% of projects meeting ROI targets</p>
              </div>
            </div>

            {/* Notes */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes & Assumptions (min. 50 characters)
              </label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={4}
                placeholder="Document key assumptions, data sources, and any caveats..."
                className="w-full px-3 py-2 border rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                {(formData.notes?.length || 0)}/50 characters
                {(formData.notes?.length || 0) >= 50 && ' ✓'}
              </p>
            </div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('inputs')}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              ← Back
            </button>
            <button
              onClick={handleCalculate}
              className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Calculate ROI →
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Results */}
      {currentStep === 'results' && result && currentScenario && (
        <div className="space-y-6">
          {/* Scenario Selector */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">ROI Analysis Results</h3>
              <div className="flex gap-2">
                {(['conservative', 'realistic', 'optimistic'] as const).map((scenario) => (
                  <button
                    key={scenario}
                    onClick={() => setActiveScenario(scenario)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                      activeScenario === scenario
                        ? scenario === 'conservative' ? 'bg-yellow-500 text-white' :
                          scenario === 'realistic' ? 'bg-blue-600 text-white' :
                          'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {scenario.charAt(0).toUpperCase() + scenario.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-700">
                  {currentScenario.roi.toFixed(0)}%
                </div>
                <div className="text-sm text-blue-600">3-Year ROI</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-700">
                  {formatCurrency(currentScenario.netBenefit)}
                </div>
                <div className="text-sm text-green-600">Net Benefit</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-purple-700">
                  {currentScenario.paybackPeriodMonths} mo
                </div>
                <div className="text-sm text-purple-600">Payback Period</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-orange-700">
                  {formatCurrency(currentScenario.npv)}
                </div>
                <div className="text-sm text-orange-600">NPV (10%)</div>
              </div>
            </div>

            {/* Scenario Description */}
            <div className={`p-4 rounded-lg ${
              activeScenario === 'conservative' ? 'bg-yellow-50 border border-yellow-200' :
              activeScenario === 'realistic' ? 'bg-blue-50 border border-blue-200' :
              'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">
                  {currentScenario.scenario.name.charAt(0).toUpperCase() + currentScenario.scenario.name.slice(1)} Scenario
                </span>
                <span className="text-sm px-2 py-0.5 bg-white rounded">
                  {currentScenario.scenario.confidence}% confidence
                </span>
              </div>
              <p className="text-sm">{currentScenario.scenario.description}</p>
            </div>
          </div>

          {/* Benefit Breakdown */}
          <div className="bg-white border rounded-lg p-6">
            <h4 className="font-semibold mb-4">Benefit Breakdown</h4>
            <div className="space-y-3">
              {currentScenario.breakdown.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-40 text-sm font-medium">{item.category}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full rounded-full"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <div className="w-24 text-right text-sm font-medium">
                    {formatCurrency(item.value)}
                  </div>
                  <div className="w-16 text-right text-sm text-gray-500">
                    {item.percentage}%
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t">
              {currentScenario.breakdown.map((item, index) => (
                <p key={index} className="text-xs text-gray-500 mb-1">
                  <strong>{item.category}:</strong> {item.methodology}
                </p>
              ))}
            </div>
          </div>

          {/* Year-by-Year Projection */}
          <div className="bg-white border rounded-lg p-6">
            <h4 className="font-semibold mb-4">3-Year Projection</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Year</th>
                  <th className="text-right py-2">Benefit</th>
                  <th className="text-right py-2">Cost</th>
                  <th className="text-right py-2">Realization</th>
                  <th className="text-right py-2">Cumulative ROI</th>
                </tr>
              </thead>
              <tbody>
                {currentScenario.yearlyProjection.map((year) => (
                  <tr key={year.year} className="border-b">
                    <td className="py-2">Year {year.year}</td>
                    <td className="text-right text-green-600">{formatCurrency(year.benefit)}</td>
                    <td className="text-right text-red-600">{formatCurrency(year.cost)}</td>
                    <td className="text-right">{(year.realizationRate * 100).toFixed(0)}%</td>
                    <td className="text-right font-semibold">{year.cumulativeROI.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Data Quality */}
          <div className="bg-white border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold">Data Quality Score</h4>
              <div className={`text-lg font-bold ${
                result.dataQuality.overallScore >= 70 ? 'text-green-600' :
                result.dataQuality.overallScore >= 50 ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {result.dataQuality.overallScore}/100
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600">Completeness</div>
                <div className="font-semibold">{result.dataQuality.completeness}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Reliability</div>
                <div className="font-semibold">{result.dataQuality.reliability}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Recency</div>
                <div className="font-semibold">{result.dataQuality.recency}%</div>
              </div>
            </div>
            {result.dataQuality.recommendations.length > 0 && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-yellow-800 mb-1">Recommendations:</div>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {result.dataQuality.recommendations.map((rec, i) => (
                    <li key={i}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Methodology Toggle */}
          <div className="bg-white border rounded-lg">
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="w-full p-4 flex justify-between items-center text-left"
            >
              <span className="font-semibold">📊 Methodology & Assumptions</span>
              <span>{showMethodology ? '▼' : '▶'}</span>
            </button>
            {showMethodology && (
              <div className="p-6 pt-0 space-y-4 border-t">
                <div>
                  <h5 className="font-medium mb-2">Overview</h5>
                  <p className="text-sm text-gray-700">{result.methodology.overview}</p>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Scenario Approach</h5>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {result.methodology.scenarioApproach}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Industry Factors</h5>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {result.methodology.industryFactors}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Time Value Considerations</h5>
                  <div className="text-sm text-gray-700 whitespace-pre-line">
                    {result.methodology.timeValueConsiderations}
                  </div>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Limitations</h5>
                  <ul className="text-sm text-gray-700 list-disc list-inside">
                    {result.methodology.limitations.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Sources</h5>
                  <ul className="text-sm text-gray-500 list-disc list-inside">
                    {result.methodology.sources.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium mb-2">Key Assumptions</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2">Assumption</th>
                          <th className="text-left py-2">Value</th>
                          <th className="text-left py-2">Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.assumptions.map((a) => (
                          <tr key={a.id} className="border-b">
                            <td className="py-2">{a.description}</td>
                            <td className="py-2">{a.value}</td>
                            <td className="py-2">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                a.impact === 'high' ? 'bg-red-100 text-red-700' :
                                a.impact === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {a.impact}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep('internal')}
              className="px-6 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50"
            >
              ← Modify Inputs
            </button>
            <button
              onClick={() => {
                setCurrentStep('metric');
                setResult(null);
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Start New Calculation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ROICalculator;
