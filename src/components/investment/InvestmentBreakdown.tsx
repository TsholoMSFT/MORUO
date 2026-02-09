/**
 * Investment Breakdown Component - Business Value Tool V2.0
 * 
 * Captures detailed investment breakdown with rollup summary.
 * Supports licensing, Azure consumption, development, services, and co-investment.
 */

import React, { useState, useEffect } from 'react';
import { InvestmentBreakdown as IInvestmentBreakdown, InvestmentSummary } from '../../types/businessValue';

interface InvestmentBreakdownProps {
  onInvestmentChange: (summary: InvestmentSummary) => void;
  initialValues?: Partial<IInvestmentBreakdown>;
  analysisYears?: number;
}

const DEFAULT_BREAKDOWN: IInvestmentBreakdown = {
  licensing: 0,
  azureConsumption: 0,
  developmentEffort: 0,
  implementationServices: 0,
  partnerServices: 0,
  esfEsofCoInvestment: 0,
  changeManagement: 0,
  training: 0,
  contingency: 0,
  other: 0,
  otherDescription: '',
};

const FIELD_CONFIG = [
  { key: 'licensing', label: 'Licensing Costs', description: 'Software licenses, subscriptions (annual or multi-year)', icon: '📄' },
  { key: 'azureConsumption', label: 'Azure Consumption', description: 'Estimated Azure spend for the solution', icon: '☁️' },
  { key: 'developmentEffort', label: 'Development Effort', description: 'Custom development, integration work (internal or external)', icon: '💻' },
  { key: 'implementationServices', label: 'Implementation Services', description: 'Microsoft or SI professional services', icon: '🔧' },
  { key: 'partnerServices', label: 'Partner Services', description: 'ISV or partner implementation costs', icon: '🤝' },
  { key: 'changeManagement', label: 'Change Management', description: 'Organizational change, communications, adoption programs', icon: '📢' },
  { key: 'training', label: 'Training', description: 'End-user and admin training costs', icon: '🎓' },
  { key: 'contingency', label: 'Contingency', description: 'Buffer for unforeseen costs (typically 10-20%)', icon: '🛡️' },
  { key: 'other', label: 'Other Costs', description: 'Any additional investment not covered above', icon: '📋' },
] as const;

export const InvestmentBreakdown: React.FC<InvestmentBreakdownProps> = ({
  onInvestmentChange,
  initialValues = {},
  analysisYears = 3,
}) => {
  const [breakdown, setBreakdown] = useState<IInvestmentBreakdown>({
    ...DEFAULT_BREAKDOWN,
    ...initialValues,
  });
  const [showDetails, setShowDetails] = useState(true);
  const [coInvestmentEnabled, setCoInvestmentEnabled] = useState(false);

  // Calculate totals and notify parent
  useEffect(() => {
    const grossTotal = Object.entries(breakdown)
      .filter(([key]) => key !== 'otherDescription' && key !== 'esfEsofCoInvestment')
      .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0);
    
    const netTotal = grossTotal - breakdown.esfEsofCoInvestment;
    
    const percentages = {} as Record<keyof IInvestmentBreakdown, number>;
    (Object.keys(breakdown) as Array<keyof IInvestmentBreakdown>).forEach(key => {
      if (key !== 'otherDescription') {
        const value = breakdown[key];
        percentages[key] = grossTotal > 0 && typeof value === 'number' ? (value / grossTotal) * 100 : 0;
      }
    });

    const summary: InvestmentSummary = {
      breakdown,
      totalInvestment: grossTotal,
      netInvestment: netTotal,
      annualizedCost: netTotal / analysisYears,
      costBreakdownPercentages: percentages,
    };

    onInvestmentChange(summary);
  }, [breakdown, analysisYears, onInvestmentChange]);

  const handleChange = (key: keyof IInvestmentBreakdown, value: number | string) => {
    setBreakdown(prev => ({ ...prev, [key]: value }));
  };

  const grossTotal = Object.entries(breakdown)
    .filter(([key]) => key !== 'otherDescription' && key !== 'esfEsofCoInvestment')
    .reduce((sum, [, value]) => sum + (typeof value === 'number' ? value : 0), 0);
  
  const netTotal = grossTotal - breakdown.esfEsofCoInvestment;

  return (
    <div className="investment-breakdown bg-gray-900 rounded-lg p-6">
      {/* Header with Total */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Investment Breakdown</h3>
          <p className="text-gray-400 text-sm">Enter all costs associated with the solution implementation</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Total Investment</div>
          <div className="text-3xl font-bold text-blue-400">${grossTotal.toLocaleString()}</div>
          {coInvestmentEnabled && breakdown.esfEsofCoInvestment > 0 && (
            <div className="text-sm text-green-400">
              Net: ${netTotal.toLocaleString()} (after co-investment)
            </div>
          )}
        </div>
      </div>

      {/* Toggle Details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-blue-400 hover:text-blue-300 text-sm mb-4 flex items-center gap-1"
      >
        {showDetails ? '▼ Hide Details' : '▶ Show Details'}
      </button>

      {showDetails && (
        <div className="space-y-4">
          {/* Main Cost Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FIELD_CONFIG.map(({ key, label, description, icon }) => (
              <div key={key} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span>{icon}</span>
                  <label className="text-sm font-medium text-gray-300">{label}</label>
                </div>
                <input
                  type="number"
                  value={breakdown[key as keyof IInvestmentBreakdown] || ''}
                  onChange={(e) => handleChange(key as keyof IInvestmentBreakdown, parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="0"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">{description}</p>
                {grossTotal > 0 && (breakdown[key as keyof IInvestmentBreakdown] as number) > 0 && (
                  <div className="text-xs text-blue-400 mt-1">
                    {(((breakdown[key as keyof IInvestmentBreakdown] as number) / grossTotal) * 100).toFixed(1)}% of total
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Other Description */}
          {breakdown.other > 0 && (
            <div className="bg-gray-800 rounded-lg p-4">
              <label className="text-sm font-medium text-gray-300 block mb-2">
                Other Costs Description *
              </label>
              <textarea
                value={breakdown.otherDescription || ''}
                onChange={(e) => handleChange('otherDescription', e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                placeholder="Describe the other costs..."
                rows={2}
                required={breakdown.other > 0}
              />
            </div>
          )}

          {/* Co-Investment Section */}
          <div className="border-t border-gray-700 pt-4 mt-4">
            <div className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                id="coInvestment"
                checked={coInvestmentEnabled}
                onChange={(e) => {
                  setCoInvestmentEnabled(e.target.checked);
                  if (!e.target.checked) {
                    handleChange('esfEsofCoInvestment', 0);
                  }
                }}
                className="rounded bg-gray-700 border-gray-600"
              />
              <label htmlFor="coInvestment" className="text-sm font-medium text-gray-300">
                Include Microsoft Co-Investment (ESF/ESOF)
              </label>
            </div>

            {coInvestmentEnabled && (
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-700">
                <label className="text-sm font-medium text-green-400 block mb-2">
                  💰 ESF/ESOF Co-Investment Amount
                </label>
                <input
                  type="number"
                  value={breakdown.esfEsofCoInvestment || ''}
                  onChange={(e) => handleChange('esfEsofCoInvestment', parseFloat(e.target.value) || 0)}
                  className="w-full bg-gray-700 border border-green-600 rounded px-3 py-2 text-white"
                  placeholder="0"
                  min="0"
                  max={grossTotal}
                />
                <p className="text-xs text-green-500 mt-1">
                  Microsoft investment that reduces customer's net cost
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Summary Bar */}
      <div className="mt-6 bg-gray-800 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <span className="text-gray-400 text-sm">Gross Investment:</span>
            <span className="text-white ml-2 font-semibold">${grossTotal.toLocaleString()}</span>
          </div>
          {coInvestmentEnabled && breakdown.esfEsofCoInvestment > 0 && (
            <>
              <div>
                <span className="text-gray-400 text-sm">Co-Investment:</span>
                <span className="text-green-400 ml-2 font-semibold">-${breakdown.esfEsofCoInvestment.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-gray-400 text-sm">Net Investment:</span>
                <span className="text-blue-400 ml-2 font-bold">${netTotal.toLocaleString()}</span>
              </div>
            </>
          )}
          <div>
            <span className="text-gray-400 text-sm">Annualized ({analysisYears}yr):</span>
            <span className="text-white ml-2">${Math.round(netTotal / analysisYears).toLocaleString()}/yr</span>
          </div>
        </div>
      </div>

      {/* Visual Breakdown */}
      {grossTotal > 0 && (
        <div className="mt-4">
          <div className="text-sm text-gray-400 mb-2">Cost Distribution</div>
          <div className="flex h-4 rounded-full overflow-hidden">
            {FIELD_CONFIG.map(({ key }) => {
              const value = breakdown[key as keyof IInvestmentBreakdown];
              if (typeof value !== 'number' || value <= 0) return null;
              const percent = (value / grossTotal) * 100;
              const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-red-500', 'bg-gray-500'];
              const colorIndex = FIELD_CONFIG.findIndex(f => f.key === key) % colors.length;
              return (
                <div
                  key={key}
                  className={`${colors[colorIndex]} transition-all`}
                  style={{ width: `${percent}%` }}
                  title={`${FIELD_CONFIG.find(f => f.key === key)?.label}: $${value.toLocaleString()} (${percent.toFixed(1)}%)`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {FIELD_CONFIG.map(({ key, label }) => {
              const value = breakdown[key as keyof IInvestmentBreakdown];
              if (typeof value !== 'number' || value <= 0) return null;
              const colors = ['bg-blue-500', 'bg-cyan-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-red-500', 'bg-gray-500'];
              const colorIndex = FIELD_CONFIG.findIndex(f => f.key === key) % colors.length;
              return (
                <div key={key} className="flex items-center gap-1 text-xs text-gray-400">
                  <div className={`w-2 h-2 rounded-full ${colors[colorIndex]}`} />
                  {label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestmentBreakdown;
