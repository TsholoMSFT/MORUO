/**
 * Business Value Calculator - Business Value Tool V2.0
 * 
 * Main integration component that combines all BVT V2.0 features:
 * - Investment breakdown with rollup
 * - Return category selection and quantification
 * - Scenario modeling with Monte Carlo
 * - Industry and company benchmarks
 * - Strategic factors scoring
 * - Outcome/KPI tracking
 * - Formulas transparency panel
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  InvestmentSummary,
  ReturnCategoryInputs,
  ReturnCalculationResult,
  ScenarioResult,
  StrategicScoreResult,
  OutcomeKPI,
  IndustryBenchmark,
  CompanyBenchmark,
} from '../types/businessValue';
import {
  calculateReturn,
  calculateFinancialMetrics,
  calculateScenarios,
  FinancialMetrics,
} from '../services/roiQuantificationEngine';
import { InvestmentBreakdown } from './investment/InvestmentBreakdown';
import { ReturnCategorySelector } from './returns/ReturnCategorySelector';
import { FormulasTransparencyPanel } from './returns/FormulasTransparencyPanel';
import { StrategicFactorsPanel } from './strategic/StrategicFactorsPanel';
import { ScenarioModelingPanel } from './scenarios/ScenarioModelingPanel';
import { OutcomeKPISelector } from './outcomes/OutcomeKPISelector';
import { IndustryBenchmarkInput } from './benchmarks/IndustryBenchmarkInput';
import { CompanyBenchmarkInput } from './benchmarks/CompanyBenchmarkInput';

interface BusinessValueCalculatorProps {
  onAssessmentComplete?: (assessment: any) => void;
  customerName?: string;
  projectName?: string;
}

type Step = 'investment' | 'returns' | 'outcomes' | 'strategic' | 'benchmarks' | 'scenarios' | 'results';

const STEPS: { id: Step; label: string; icon: string }[] = [
  { id: 'investment', label: 'Investment', icon: '💰' },
  { id: 'returns', label: 'Returns', icon: '📈' },
  { id: 'outcomes', label: 'Outcomes', icon: '🎯' },
  { id: 'strategic', label: 'Strategic', icon: '⚡' },
  { id: 'benchmarks', label: 'Benchmarks', icon: '📊' },
  { id: 'scenarios', label: 'Scenarios', icon: '🔮' },
  { id: 'results', label: 'Results', icon: '✅' },
];

export const BusinessValueCalculator: React.FC<BusinessValueCalculatorProps> = ({
  onAssessmentComplete,
  customerName = 'Customer',
  projectName = 'AI/Cloud Investment',
}) => {
  // Step navigation
  const [currentStep, setCurrentStep] = useState<Step>('investment');
  
  // Data state
  const [investment, setInvestment] = useState<InvestmentSummary | null>(null);
  const [returnCategories, setReturnCategories] = useState<ReturnCategoryInputs[]>([]);
  const [outcomes, setOutcomes] = useState<OutcomeKPI[]>([]);
  const [strategicScore, setStrategicScore] = useState<StrategicScoreResult | null>(null);
  const [industryBenchmarks, setIndustryBenchmarks] = useState<IndustryBenchmark[]>([]);
  const [companyBenchmarks, setCompanyBenchmarks] = useState<CompanyBenchmark[]>([]);
  const [industry, setIndustry] = useState('technology');
  
  // UI state
  const [showFormulas, setShowFormulas] = useState(false);

  // Calculate returns from categories
  const returnResults: ReturnCalculationResult[] = useMemo(() => {
    return returnCategories.map(cat => calculateReturn(cat));
  }, [returnCategories]);

  // Calculate financial metrics
  const financialMetrics: FinancialMetrics | null = useMemo(() => {
    if (!investment || returnResults.length === 0) return null;
    return calculateFinancialMetrics(investment, returnResults);
  }, [investment, returnResults]);

  // Calculate scenarios
  const scenarioResults: ScenarioResult[] = useMemo(() => {
    if (!financialMetrics) return [];
    return calculateScenarios(financialMetrics);
  }, [financialMetrics]);

  // Callbacks
  const handleInvestmentChange = useCallback((summary: InvestmentSummary) => {
    setInvestment(summary);
  }, []);

  const handleCategoriesChange = useCallback((categories: ReturnCategoryInputs[]) => {
    setReturnCategories(categories);
  }, []);

  const handleOutcomesChange = useCallback((newOutcomes: OutcomeKPI[]) => {
    setOutcomes(newOutcomes);
  }, []);

  const handleStrategicScoreChange = useCallback((result: StrategicScoreResult) => {
    setStrategicScore(result);
  }, []);

  const handleIndustryBenchmarksChange = useCallback((benchmarks: IndustryBenchmark[]) => {
    setIndustryBenchmarks(benchmarks);
  }, []);

  const handleCompanyBenchmarksChange = useCallback((benchmarks: CompanyBenchmark[]) => {
    setCompanyBenchmarks(benchmarks);
  }, []);

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const canGoNext = currentStepIndex < STEPS.length - 1;
  const canGoPrev = currentStepIndex > 0;

  const goNext = () => {
    if (canGoNext) setCurrentStep(STEPS[currentStepIndex + 1].id);
  };

  const goPrev = () => {
    if (canGoPrev) setCurrentStep(STEPS[currentStepIndex - 1].id);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="business-value-calculator bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Business Value Assessment</h1>
            <p className="text-gray-400">{customerName} - {projectName}</p>
          </div>
          {financialMetrics && (
            <div className="flex gap-6">
              <div className="text-right">
                <div className="text-xs text-gray-500">3-Year Return</div>
                <div className="text-xl font-bold text-green-400">
                  {formatCurrency(financialMetrics.totalReturn)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">ROI</div>
                <div className="text-xl font-bold text-blue-400">
                  {financialMetrics.roiPercentage}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Payback</div>
                <div className="text-xl font-bold text-purple-400">
                  {financialMetrics.paybackMonths} mo
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Step Navigation */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3">
        <div className="flex gap-2">
          {STEPS.map((step, index) => {
            const isCurrent = step.id === currentStep;
            const isComplete = index < currentStepIndex;
            
            return (
              <button
                key={step.id}
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-blue-600 text-white'
                    : isComplete
                    ? 'bg-green-900/30 text-green-400 border border-green-700'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                <span>{step.icon}</span>
                <span className="text-sm font-medium">{step.label}</span>
                {isComplete && <span className="text-green-400">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Investment Step */}
          {currentStep === 'investment' && (
            <div className="space-y-6">
              <div className="mb-4">
                <label className="text-sm text-gray-400">Industry</label>
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="ml-3 bg-gray-800 border border-gray-700 rounded px-3 py-1 text-white"
                >
                  <option value="technology">Technology</option>
                  <option value="financial_services">Financial Services</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="manufacturing">Manufacturing</option>
                  <option value="retail">Retail</option>
                  <option value="government">Government</option>
                  <option value="education">Education</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <InvestmentBreakdown onInvestmentChange={handleInvestmentChange} />
            </div>
          )}

          {/* Returns Step */}
          {currentStep === 'returns' && (
            <div className="space-y-6">
              <ReturnCategorySelector onCategoriesChange={handleCategoriesChange} />
              
              {returnResults.length > 0 && (
                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setShowFormulas(!showFormulas)}
                    className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
                  >
                    {showFormulas ? '▼ Hide' : '▶ Show'} Calculation Details
                  </button>
                </div>
              )}
              
              {showFormulas && <FormulasTransparencyPanel results={returnResults} />}
            </div>
          )}

          {/* Outcomes Step */}
          {currentStep === 'outcomes' && (
            <OutcomeKPISelector
              onOutcomesChange={handleOutcomesChange}
              requireNotes={true}
              minNotesLength={50}
            />
          )}

          {/* Strategic Step */}
          {currentStep === 'strategic' && (
            <StrategicFactorsPanel onScoreChange={handleStrategicScoreChange} />
          )}

          {/* Benchmarks Step */}
          {currentStep === 'benchmarks' && (
            <div className="space-y-6">
              <IndustryBenchmarkInput
                industry={industry}
                onBenchmarksChange={handleIndustryBenchmarksChange}
              />
              <CompanyBenchmarkInput onBenchmarksChange={handleCompanyBenchmarksChange} />
            </div>
          )}

          {/* Scenarios Step */}
          {currentStep === 'scenarios' && financialMetrics && (
            <ScenarioModelingPanel
              baseMetrics={financialMetrics}
              showMonteCarlo={true}
            />
          )}

          {/* Results Step */}
          {currentStep === 'results' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div className="bg-gray-900 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Executive Summary</h3>
                
                {financialMetrics && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Total Investment</div>
                      <div className="text-2xl font-bold text-white">
                        {formatCurrency(financialMetrics.totalInvestment)}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400">3-Year Return</div>
                      <div className="text-2xl font-bold text-green-400">
                        {formatCurrency(financialMetrics.totalReturn)}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400">ROI</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {financialMetrics.roiPercentage}
                      </div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <div className="text-sm text-gray-400">Payback Period</div>
                      <div className="text-2xl font-bold text-purple-400">
                        {financialMetrics.paybackMonths} months
                      </div>
                    </div>
                  </div>
                )}

                {/* Strategic Score */}
                {strategicScore && (
                  <div className="bg-purple-900/20 rounded-lg p-4 border border-purple-700 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-purple-400">Strategic Score</div>
                        <div className="text-xl font-bold text-white">
                          {strategicScore.scorePercentage.toFixed(0)}%
                        </div>
                      </div>
                      <div className="text-sm text-gray-400 max-w-md">
                        {strategicScore.qualitativeAssessment}
                      </div>
                    </div>
                  </div>
                )}

                {/* Return Breakdown */}
                {returnResults.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Return Breakdown</h4>
                    <div className="space-y-2">
                      {returnResults.map((result) => (
                        <div key={result.categoryType} className="flex justify-between bg-gray-800 rounded p-3">
                          <span className="text-white">{result.categoryLabel}</span>
                          <span className="text-green-400 font-medium">
                            {formatCurrency(result.threeYearReturn)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Formulas Panel */}
              <FormulasTransparencyPanel results={returnResults} showAllSteps={true} />
            </div>
          )}
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <button
            onClick={goPrev}
            disabled={!canGoPrev}
            className={`px-6 py-2 rounded-lg font-medium ${
              canGoPrev
                ? 'bg-gray-700 text-white hover:bg-gray-600'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            ← Previous
          </button>

          <div className="text-sm text-gray-500">
            Step {currentStepIndex + 1} of {STEPS.length}
          </div>

          <button
            onClick={goNext}
            disabled={!canGoNext}
            className={`px-6 py-2 rounded-lg font-medium ${
              canGoNext
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}
          >
            {currentStep === 'results' ? 'Export Report' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusinessValueCalculator;
