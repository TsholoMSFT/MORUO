/**
 * Formulas Transparency Panel - Business Value Tool V2.0
 * 
 * Displays all calculation steps, formulas, and assumptions in a
 * clear, auditable format for defensibility and transparency.
 */

import React, { useState } from 'react';
import { ReturnCalculationResult, CalculationStep } from '../../types/businessValue';

interface FormulasTransparencyPanelProps {
  results: ReturnCalculationResult[];
  showAllSteps?: boolean;
}

export const FormulasTransparencyPanel: React.FC<FormulasTransparencyPanelProps> = ({
  results,
  showAllSteps = false,
}) => {
  const [expandedResults, setExpandedResults] = useState<Set<string>>(
    new Set(showAllSteps ? results.map(r => r.categoryType) : [])
  );

  const toggleExpanded = (categoryType: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(categoryType)) {
      newExpanded.delete(categoryType);
    } else {
      newExpanded.add(categoryType);
    }
    setExpandedResults(newExpanded);
  };

  const expandAll = () => setExpandedResults(new Set(results.map(r => r.categoryType)));
  const collapseAll = () => setExpandedResults(new Set());

  const getDataQualityBadge = (quality: string) => {
    const styles = {
      high: 'bg-green-900 text-green-300 border-green-700',
      medium: 'bg-yellow-900 text-yellow-300 border-yellow-700',
      low: 'bg-red-900 text-red-300 border-red-700',
    };
    return styles[quality as keyof typeof styles] || styles.medium;
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 70) return 'bg-green-900 text-green-300';
    if (confidence >= 40) return 'bg-yellow-900 text-yellow-300';
    return 'bg-red-900 text-red-300';
  };

  if (results.length === 0) {
    return (
      <div className="formulas-transparency-panel bg-gray-900 rounded-lg p-6">
        <h3 className="text-xl font-semibold text-white mb-4">Calculation Transparency</h3>
        <p className="text-gray-400">No calculations to display. Select return categories and provide inputs to see detailed formulas.</p>
      </div>
    );
  }

  return (
    <div className="formulas-transparency-panel bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Calculation Transparency</h3>
          <p className="text-gray-400 text-sm">Full audit trail of all calculations, formulas, and assumptions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={expandAll}
            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 rounded text-white"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded text-white"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Summary Table */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Results Summary</h4>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-gray-400">Category</th>
              <th className="text-right py-2 text-gray-400">Annual Return</th>
              <th className="text-right py-2 text-gray-400">3-Year Return</th>
              <th className="text-center py-2 text-gray-400">Confidence</th>
              <th className="text-center py-2 text-gray-400">Data Quality</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result) => (
              <tr key={result.categoryType} className="border-b border-gray-700">
                <td className="py-2 text-white">{result.categoryLabel}</td>
                <td className="py-2 text-right text-green-400">${result.annualReturn.toLocaleString()}</td>
                <td className="py-2 text-right text-blue-400">${result.threeYearReturn.toLocaleString()}</td>
                <td className="py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceBadge(result.confidenceLevel)}`}>
                    {result.confidenceLevel}%
                  </span>
                </td>
                <td className="py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-xs border ${getDataQualityBadge(result.dataQuality)}`}>
                    {result.dataQuality}
                  </span>
                </td>
              </tr>
            ))}
            <tr className="font-bold">
              <td className="py-2 text-white">Total</td>
              <td className="py-2 text-right text-green-400">
                ${results.reduce((sum, r) => sum + r.annualReturn, 0).toLocaleString()}
              </td>
              <td className="py-2 text-right text-blue-400">
                ${results.reduce((sum, r) => sum + r.threeYearReturn, 0).toLocaleString()}
              </td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Detailed Calculations */}
      <div className="space-y-4">
        {results.map((result) => {
          const isExpanded = expandedResults.has(result.categoryType);
          
          return (
            <div
              key={result.categoryType}
              className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
            >
              {/* Header */}
              <button
                onClick={() => toggleExpanded(result.categoryType)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg font-medium text-white">{result.categoryLabel}</span>
                  <span className={`px-2 py-0.5 rounded text-xs ${getConfidenceBadge(result.confidenceLevel)}`}>
                    {result.confidenceLevel}% confidence
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-blue-400 font-bold">${result.threeYearReturn.toLocaleString()}</span>
                  <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-gray-700 p-4 space-y-4">
                  {/* Formula */}
                  <div className="bg-gray-900 rounded p-4">
                    <div className="text-xs text-gray-500 uppercase mb-2">Formula Used</div>
                    <div className="font-mono text-yellow-400">{result.formulaUsed}</div>
                  </div>

                  {/* Calculation Steps */}
                  <div>
                    <div className="text-sm font-medium text-gray-300 mb-3">Calculation Steps</div>
                    <div className="space-y-3">
                      {result.calculationSteps.map((step) => (
                        <StepCard key={step.stepNumber} step={step} />
                      ))}
                    </div>
                  </div>

                  {/* Assumptions */}
                  <div className="bg-yellow-900/20 rounded-lg p-4 border border-yellow-800">
                    <div className="text-sm font-medium text-yellow-400 mb-2">📋 Assumptions</div>
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                      {result.assumptions.map((assumption, i) => (
                        <li key={i}>{assumption}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Data Quality Explanation */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Data Quality:</span>
                      <span className={`px-2 py-0.5 rounded border ${getDataQualityBadge(result.dataQuality)}`}>
                        {result.dataQuality}
                      </span>
                    </div>
                    <div className="text-gray-500">
                      {result.dataQuality === 'high' && 'Based on verifiable internal data or historical results'}
                      {result.dataQuality === 'medium' && 'Based on industry benchmarks or vendor estimates'}
                      {result.dataQuality === 'low' && 'Based on assumptions or projections requiring validation'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Methodology Note */}
      <div className="mt-6 bg-blue-900/20 rounded-lg p-4 border border-blue-800">
        <div className="text-sm font-medium text-blue-400 mb-2">📊 Methodology Note</div>
        <p className="text-sm text-gray-300">
          All calculations follow the Forrester Total Economic Impact (TEI) methodology and 
          McKinsey Digital Value Framework. Formulas are designed to provide conservative, 
          defensible estimates that can withstand executive scrutiny. Each assumption is 
          documented and can be adjusted based on customer-specific data.
        </p>
      </div>
    </div>
  );
};

// Step Card Component
const StepCard: React.FC<{ step: CalculationStep }> = ({ step }) => {
  const [showInputs, setShowInputs] = useState(false);

  return (
    <div className="bg-gray-850 rounded-lg p-3 border border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-xs text-white font-bold">
            {step.stepNumber}
          </div>
          <div>
            <div className="text-sm text-white">{step.description}</div>
            <div className="font-mono text-xs text-gray-400 mt-1">{step.formula}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-green-400">
            {step.unit === '$' ? '$' : ''}{step.result.toLocaleString()}{step.unit !== '$' ? ` ${step.unit}` : ''}
          </div>
          <button
            onClick={() => setShowInputs(!showInputs)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {showInputs ? 'Hide inputs' : 'Show inputs'}
          </button>
        </div>
      </div>
      
      {showInputs && (
        <div className="mt-3 pt-3 border-t border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(step.inputs).map(([key, value]) => (
              <div key={key} className="bg-gray-800 rounded px-2 py-1">
                <span className="text-gray-500">{key}: </span>
                <span className="text-white">
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulasTransparencyPanel;
