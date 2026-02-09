/**
 * Scenario Modeling Panel - Business Value Tool V2.0
 * 
 * Provides defensible scenario analysis with benchmark-driven multipliers,
 * user override capability, and Monte Carlo simulation visualization.
 */

import React, { useState, useMemo } from 'react';
import {
  ScenarioConfig,
  ScenarioResult,
  MonteCarloResult,
} from '../../types/businessValue';
import {
  DEFAULT_SCENARIO_CONFIGS,
  calculateScenarios,
  runMonteCarloSimulation,
  FinancialMetrics,
} from '../../services/roiQuantificationEngine';

interface ScenarioModelingPanelProps {
  baseMetrics: FinancialMetrics;
  onScenariosChange?: (results: ScenarioResult[]) => void;
  showMonteCarlo?: boolean;
}

export const ScenarioModelingPanel: React.FC<ScenarioModelingPanelProps> = ({
  baseMetrics,
  onScenariosChange,
  showMonteCarlo = true,
}) => {
  const [scenarios, setScenarios] = useState<ScenarioConfig[]>(DEFAULT_SCENARIO_CONFIGS);
  const [useCustomMultipliers, setUseCustomMultipliers] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [monteCarloIterations, setMonteCarloIterations] = useState(10000);
  const [volatility, setVolatility] = useState(0.25);

  // Calculate scenario results
  const scenarioResults = useMemo(() => {
    const results = calculateScenarios(baseMetrics, scenarios);
    onScenariosChange?.(results);
    return results;
  }, [baseMetrics, scenarios, onScenariosChange]);

  // Run Monte Carlo simulation
  const monteCarloResult = useMemo(() => {
    if (!showMonteCarlo) return null;
    return runMonteCarloSimulation(
      baseMetrics.totalReturn,
      baseMetrics.totalInvestment,
      monteCarloIterations,
      volatility
    );
  }, [baseMetrics, monteCarloIterations, volatility, showMonteCarlo]);

  const updateScenarioMultiplier = (type: string, multiplier: number) => {
    setScenarios(prev =>
      prev.map(s =>
        s.type === type ? { ...s, multiplier, userOverride: true } : s
      )
    );
  };

  const resetToDefaults = () => {
    setScenarios(DEFAULT_SCENARIO_CONFIGS);
    setUseCustomMultipliers(false);
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="scenario-modeling-panel bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Scenario Analysis</h3>
          <p className="text-gray-400 text-sm">Conservative, realistic, and optimistic projections based on industry benchmarks</p>
        </div>
        <button
          onClick={() => setShowMethodology(!showMethodology)}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          {showMethodology ? 'Hide' : 'Show'} Methodology
        </button>
      </div>

      {/* Methodology Explanation */}
      {showMethodology && (
        <div className="bg-blue-900/20 rounded-lg p-4 border border-blue-800 mb-6">
          <h4 className="text-sm font-medium text-blue-400 mb-2">📊 Scenario Methodology</h4>
          <p className="text-sm text-gray-300 mb-3">
            Scenarios are based on statistical percentiles from industry benchmark databases:
          </p>
          <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
            <li><strong>Conservative (60%)</strong>: 25th percentile - 75% of similar projects achieve or exceed this</li>
            <li><strong>Realistic (100%)</strong>: 50th percentile (median) - Expected most likely outcome</li>
            <li><strong>Optimistic (150%)</strong>: 75th percentile - Top quartile performance with strong execution</li>
          </ul>
          <p className="text-xs text-gray-500 mt-3">
            Sources: Forrester TEI Meta-Analysis, Gartner IT Investment Benchmarks 2025, McKinsey Digital Transformation Database
          </p>
        </div>
      )}

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {scenarioResults.map((result, index) => {
          const config = scenarios.find(s => s.type === result.scenario)!;
          
          return (
            <div
              key={result.scenario}
              className={`bg-gray-800 rounded-lg p-4 border-2 transition-all ${
                result.scenario === 'realistic'
                  ? 'border-blue-500 ring-1 ring-blue-500/30'
                  : 'border-gray-700'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium text-white">{config.label}</h4>
                  <p className="text-xs text-gray-500">{config.percentile}th percentile</p>
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: config.color }}
                />
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-xs text-gray-400">3-Year Return</span>
                  <div className="text-2xl font-bold" style={{ color: config.color }}>
                    {formatCurrency(result.totalReturn)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">ROI</span>
                    <div className="text-white font-medium">{result.roi.toFixed(0)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Payback</span>
                    <div className="text-white font-medium">{result.paybackMonths} mo</div>
                  </div>
                  <div>
                    <span className="text-gray-500">NPV</span>
                    <div className="text-white font-medium">{formatCurrency(result.npv)}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">IRR</span>
                    <div className="text-white font-medium">{result.irr.toFixed(0)}%</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t border-gray-700">
                  {config.confidenceLevel}% confidence of achieving
                </div>
              </div>

              {/* Custom Multiplier */}
              {useCustomMultipliers && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <label className="text-xs text-gray-400">Multiplier Override</label>
                  <input
                    type="number"
                    value={config.multiplier}
                    onChange={(e) => updateScenarioMultiplier(result.scenario, parseFloat(e.target.value) || 1)}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm mt-1"
                    step="0.1"
                    min="0.1"
                    max="3"
                  />
                  {config.userOverride && (
                    <span className="text-xs text-yellow-500">Custom value</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Customize Options */}
      <div className="flex items-center gap-4 mb-6">
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input
            type="checkbox"
            checked={useCustomMultipliers}
            onChange={(e) => setUseCustomMultipliers(e.target.checked)}
            className="rounded bg-gray-700 border-gray-600"
          />
          Enable custom multipliers
        </label>
        {useCustomMultipliers && (
          <button
            onClick={resetToDefaults}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Reset to defaults
          </button>
        )}
      </div>

      {/* Monte Carlo Section */}
      {showMonteCarlo && monteCarloResult && (
        <div className="mt-6 border-t border-gray-700 pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-medium text-white">Monte Carlo Simulation</h4>
              <p className="text-xs text-gray-500">{monteCarloIterations.toLocaleString()} iterations</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Probability of Positive ROI:</span>
              <span className="text-lg font-bold text-green-400">
                {(monteCarloResult.probabilityOfPositiveROI * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Histogram Visualization */}
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <div className="h-32 flex items-end gap-1">
              {monteCarloResult.histogram.map((bar, i) => {
                const maxCount = Math.max(...monteCarloResult.histogram.map(h => h.count));
                const height = (bar.count / maxCount) * 100;
                const isPositive = bar.bucket >= 0;
                
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-t transition-all hover:opacity-80 ${
                      isPositive ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                    style={{ height: `${height}%` }}
                    title={`ROI: ${bar.bucket.toFixed(0)}% | Count: ${bar.count}`}
                  />
                );
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>ROI: {monteCarloResult.percentiles.p10.toFixed(0)}%</span>
              <span>Median: {monteCarloResult.percentiles.p50.toFixed(0)}%</span>
              <span>ROI: {monteCarloResult.percentiles.p90.toFixed(0)}%</span>
            </div>
          </div>

          {/* Percentile Summary */}
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(monteCarloResult.percentiles).map(([key, value]) => (
              <div key={key} className="bg-gray-800 rounded p-2 text-center">
                <div className="text-xs text-gray-500">{key.toUpperCase()}</div>
                <div className="text-sm font-medium text-white">{value.toFixed(0)}%</div>
              </div>
            ))}
          </div>

          {/* Simulation Controls */}
          <div className="mt-4 flex gap-4">
            <div>
              <label className="text-xs text-gray-400">Iterations</label>
              <select
                value={monteCarloIterations}
                onChange={(e) => setMonteCarloIterations(parseInt(e.target.value))}
                className="ml-2 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              >
                <option value="1000">1,000</option>
                <option value="10000">10,000</option>
                <option value="50000">50,000</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-400">Volatility</label>
              <select
                value={volatility}
                onChange={(e) => setVolatility(parseFloat(e.target.value))}
                className="ml-2 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
              >
                <option value="0.15">Low (15%)</option>
                <option value="0.25">Medium (25%)</option>
                <option value="0.35">High (35%)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Data Sources */}
      <div className="mt-6 text-xs text-gray-500">
        <strong>Data Sources:</strong> Forrester TEI Analysis, Gartner IT Investment Benchmarks (2025), McKinsey Digital Transformation Database
      </div>
    </div>
  );
};

export default ScenarioModelingPanel;
