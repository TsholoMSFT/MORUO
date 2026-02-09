/**
 * Return Category Selector - Business Value Tool V2.0
 * 
 * Allows users to select which return categories apply to their use case
 * and provides input forms for each selected category.
 */

import React, { useState } from 'react';
import {
  ReturnCategoryType,
  ReturnCategoryInputs,
  RevenueImpactInputs,
  MarginUpliftInputs,
  ProductivityGainInputs,
  CostReductionInputs,
  RiskAvoidanceInputs,
  TimeToMarketInputs,
} from '../../types/businessValue';
import { RETURN_CATEGORY_CONFIGS } from '../../services/roiQuantificationEngine';

interface ReturnCategorySelectorProps {
  onCategoriesChange: (categories: ReturnCategoryInputs[]) => void;
  selectedCategories?: ReturnCategoryType[];
}

const CATEGORY_ICONS: Record<ReturnCategoryType, string> = {
  revenue_impact: '📈',
  margin_uplift: '💹',
  productivity_gain: '⚡',
  cost_reduction: '💰',
  risk_avoidance: '🛡️',
  time_to_market: '🚀',
};

// Default values for each category
const DEFAULT_INPUTS: Record<ReturnCategoryType, any> = {
  revenue_impact: {
    annualRevenue: 10000000,
    expectedImpactPercent: 5,
    timeToFullImpact: 6,
    confidenceLevel: 'realistic' as const,
  },
  margin_uplift: {
    annualRevenue: 10000000,
    currentMarginPercent: 30,
    expectedMarginPercent: 33,
    affectedRevenuePercent: 50,
  },
  productivity_gain: {
    employeesAffected: 100,
    averageHourlyCost: 75,
    currentHoursPerWeek: 40,
    expectedHoursSaved: 5,
    productivityCaptureRate: 0.75,
  },
  cost_reduction: {
    currentAnnualCost: 2000000,
    expectedReductionPercent: 25,
    realizationTimeMonths: 6,
    sustainabilityFactor: 0.9,
  },
  risk_avoidance: {
    annualRiskExposure: 5000000,
    probabilityOfOccurrence: 0.15,
    expectedRiskReduction: 0.6,
    compliancePenaltyAvoided: 0,
  },
  time_to_market: {
    monthsAccelerated: 3,
    monthlyRevenueOpportunity: 500000,
    marketWindowMonths: 12,
    competitiveAdvantageMultiplier: 1.2,
  },
};

export const ReturnCategorySelector: React.FC<ReturnCategorySelectorProps> = ({
  onCategoriesChange,
  selectedCategories: initialSelected = [],
}) => {
  const [selectedCategories, setSelectedCategories] = useState<Set<ReturnCategoryType>>(
    new Set(initialSelected)
  );
  const [categoryInputs, setCategoryInputs] = useState<Record<ReturnCategoryType, any>>(
    {} as Record<ReturnCategoryType, any>
  );
  const [expandedCategory, setExpandedCategory] = useState<ReturnCategoryType | null>(null);

  const toggleCategory = (category: ReturnCategoryType) => {
    const newSelected = new Set(selectedCategories);
    if (newSelected.has(category)) {
      newSelected.delete(category);
    } else {
      newSelected.add(category);
      // Initialize with defaults if not already set
      if (!categoryInputs[category]) {
        setCategoryInputs(prev => ({
          ...prev,
          [category]: DEFAULT_INPUTS[category],
        }));
      }
    }
    setSelectedCategories(newSelected);
    updateParent(newSelected, categoryInputs);
  };

  const updateCategoryInput = (category: ReturnCategoryType, field: string, value: any) => {
    const newInputs = {
      ...categoryInputs,
      [category]: {
        ...categoryInputs[category],
        [field]: value,
      },
    };
    setCategoryInputs(newInputs);
    updateParent(selectedCategories, newInputs);
  };

  const updateParent = (selected: Set<ReturnCategoryType>, inputs: Record<ReturnCategoryType, any>) => {
    const categories: ReturnCategoryInputs[] = Array.from(selected).map(type => ({
      type,
      inputs: inputs[type] || DEFAULT_INPUTS[type],
    })) as ReturnCategoryInputs[];
    onCategoriesChange(categories);
  };

  const renderCategoryInputs = (category: ReturnCategoryType) => {
    const inputs = categoryInputs[category] || DEFAULT_INPUTS[category];
    const config = RETURN_CATEGORY_CONFIGS[category];

    switch (category) {
      case 'revenue_impact':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Annual Revenue ($)</label>
              <input
                type="number"
                value={inputs.annualRevenue}
                onChange={(e) => updateCategoryInput(category, 'annualRevenue', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Impact (%)</label>
              <input
                type="number"
                value={inputs.expectedImpactPercent}
                onChange={(e) => updateCategoryInput(category, 'expectedImpactPercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="100"
                step="0.5"
              />
              <p className="text-xs text-gray-500 mt-1">Typical range: {config.typicalRange.min}-{config.typicalRange.max}%</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Time to Full Impact (months)</label>
              <input
                type="number"
                value={inputs.timeToFullImpact}
                onChange={(e) => updateCategoryInput(category, 'timeToFullImpact', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="1"
                max="24"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Confidence Level</label>
              <select
                value={inputs.confidenceLevel}
                onChange={(e) => updateCategoryInput(category, 'confidenceLevel', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              >
                <option value="conservative">Conservative (0.7x)</option>
                <option value="realistic">Realistic (1.0x)</option>
                <option value="optimistic">Optimistic (1.3x)</option>
              </select>
            </div>
          </div>
        );

      case 'margin_uplift':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Annual Revenue ($)</label>
              <input
                type="number"
                value={inputs.annualRevenue}
                onChange={(e) => updateCategoryInput(category, 'annualRevenue', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Affected Revenue (%)</label>
              <input
                type="number"
                value={inputs.affectedRevenuePercent}
                onChange={(e) => updateCategoryInput(category, 'affectedRevenuePercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Margin (%)</label>
              <input
                type="number"
                value={inputs.currentMarginPercent}
                onChange={(e) => updateCategoryInput(category, 'currentMarginPercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Margin (%)</label>
              <input
                type="number"
                value={inputs.expectedMarginPercent}
                onChange={(e) => updateCategoryInput(category, 'expectedMarginPercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="100"
              />
            </div>
          </div>
        );

      case 'productivity_gain':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Employees Affected</label>
              <input
                type="number"
                value={inputs.employeesAffected}
                onChange={(e) => updateCategoryInput(category, 'employeesAffected', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Avg Hourly Cost ($)</label>
              <input
                type="number"
                value={inputs.averageHourlyCost}
                onChange={(e) => updateCategoryInput(category, 'averageHourlyCost', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Fully loaded (salary × 1.4)</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Hours Saved/Week</label>
              <input
                type="number"
                value={inputs.expectedHoursSaved}
                onChange={(e) => updateCategoryInput(category, 'expectedHoursSaved', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="40"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Productivity Capture Rate</label>
              <input
                type="number"
                value={inputs.productivityCaptureRate}
                onChange={(e) => updateCategoryInput(category, 'productivityCaptureRate', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="1"
                step="0.05"
              />
              <p className="text-xs text-gray-500 mt-1">Typically 0.75 (75% of saved time creates value)</p>
            </div>
          </div>
        );

      case 'cost_reduction':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Current Annual Cost ($)</label>
              <input
                type="number"
                value={inputs.currentAnnualCost}
                onChange={(e) => updateCategoryInput(category, 'currentAnnualCost', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Reduction (%)</label>
              <input
                type="number"
                value={inputs.expectedReductionPercent}
                onChange={(e) => updateCategoryInput(category, 'expectedReductionPercent', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="100"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Realization Time (months)</label>
              <input
                type="number"
                value={inputs.realizationTimeMonths}
                onChange={(e) => updateCategoryInput(category, 'realizationTimeMonths', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="1"
                max="24"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Sustainability Factor</label>
              <input
                type="number"
                value={inputs.sustainabilityFactor}
                onChange={(e) => updateCategoryInput(category, 'sustainabilityFactor', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="1"
                step="0.05"
              />
              <p className="text-xs text-gray-500 mt-1">Likelihood savings persist (0.9 = 90%)</p>
            </div>
          </div>
        );

      case 'risk_avoidance':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Annual Risk Exposure ($)</label>
              <input
                type="number"
                value={inputs.annualRiskExposure}
                onChange={(e) => updateCategoryInput(category, 'annualRiskExposure', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
              <p className="text-xs text-gray-500 mt-1">Potential loss if risk occurs</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Probability of Occurrence</label>
              <input
                type="number"
                value={inputs.probabilityOfOccurrence}
                onChange={(e) => updateCategoryInput(category, 'probabilityOfOccurrence', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="1"
                step="0.05"
              />
              <p className="text-xs text-gray-500 mt-1">0.15 = 15% annual probability</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Expected Risk Reduction</label>
              <input
                type="number"
                value={inputs.expectedRiskReduction}
                onChange={(e) => updateCategoryInput(category, 'expectedRiskReduction', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="0"
                max="1"
                step="0.05"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Compliance Penalty Avoided ($)</label>
              <input
                type="number"
                value={inputs.compliancePenaltyAvoided || 0}
                onChange={(e) => updateCategoryInput(category, 'compliancePenaltyAvoided', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
          </div>
        );

      case 'time_to_market':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Months Accelerated</label>
              <input
                type="number"
                value={inputs.monthsAccelerated}
                onChange={(e) => updateCategoryInput(category, 'monthsAccelerated', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="1"
                max="24"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Monthly Revenue Opportunity ($)</label>
              <input
                type="number"
                value={inputs.monthlyRevenueOpportunity}
                onChange={(e) => updateCategoryInput(category, 'monthlyRevenueOpportunity', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Market Window (months)</label>
              <input
                type="number"
                value={inputs.marketWindowMonths}
                onChange={(e) => updateCategoryInput(category, 'marketWindowMonths', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="1"
                max="36"
              />
              <p className="text-xs text-gray-500 mt-1">Time before competition catches up</p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Competitive Multiplier</label>
              <input
                type="number"
                value={inputs.competitiveAdvantageMultiplier}
                onChange={(e) => updateCategoryInput(category, 'competitiveAdvantageMultiplier', parseFloat(e.target.value) || 0)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                min="1"
                max="3"
                step="0.1"
              />
              <p className="text-xs text-gray-500 mt-1">1.2 = 20% competitive premium</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="return-category-selector bg-gray-900 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-white mb-2">Return Categories</h3>
      <p className="text-gray-400 text-sm mb-6">
        Select all value drivers that apply to this solution. Each category uses a specific formula to calculate returns.
      </p>

      <div className="space-y-4">
        {(Object.keys(RETURN_CATEGORY_CONFIGS) as ReturnCategoryType[]).map(category => {
          const config = RETURN_CATEGORY_CONFIGS[category];
          const isSelected = selectedCategories.has(category);
          const isExpanded = expandedCategory === category;

          return (
            <div
              key={category}
              className={`bg-gray-800 rounded-lg border transition-all ${
                isSelected ? 'border-blue-500' : 'border-gray-700'
              }`}
            >
              {/* Category Header */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => {
                  if (!isSelected) {
                    toggleCategory(category);
                  }
                  setExpandedCategory(isExpanded ? null : category);
                }}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleCategory(category)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded bg-gray-700 border-gray-600 text-blue-500"
                  />
                  <span className="text-2xl">{CATEGORY_ICONS[category]}</span>
                  <div>
                    <div className="font-medium text-white">{config.label}</div>
                    <div className="text-sm text-gray-400">{config.description}</div>
                  </div>
                </div>
                <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
              </div>

              {/* Category Inputs (Expanded) */}
              {isExpanded && isSelected && (
                <div className="px-4 pb-4 border-t border-gray-700 pt-4">
                  {/* Formula Display */}
                  <div className="bg-gray-900 rounded p-3 mb-4">
                    <div className="text-xs text-gray-500 uppercase mb-1">Formula</div>
                    <div className="font-mono text-yellow-400 text-sm">{config.formula}</div>
                    <div className="text-xs text-gray-400 mt-1">{config.formulaExplanation}</div>
                  </div>

                  {/* Inputs */}
                  {renderCategoryInputs(category)}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Summary */}
      {selectedCategories.size > 0 && (
        <div className="mt-6 bg-blue-900/30 rounded-lg p-4 border border-blue-700">
          <div className="text-sm text-blue-400 mb-2">
            {selectedCategories.size} return {selectedCategories.size === 1 ? 'category' : 'categories'} selected
          </div>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedCategories).map(cat => (
              <span key={cat} className="bg-blue-800 text-blue-200 px-2 py-1 rounded text-sm">
                {CATEGORY_ICONS[cat]} {RETURN_CATEGORY_CONFIGS[cat].label}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnCategorySelector;
