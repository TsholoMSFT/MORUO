/**
 * Company Benchmark Input - Business Value Tool V2.0
 * 
 * Captures customer-specific benchmarks: threshold ROI, target payback,
 * internal cost structures, and company performance targets.
 */

import React, { useState } from 'react';
import { CompanyBenchmark } from '../../types/businessValue';

interface CompanyBenchmarkInputProps {
  onBenchmarksChange: (benchmarks: CompanyBenchmark[]) => void;
  initialBenchmarks?: CompanyBenchmark[];
}

const DEFAULT_COMPANY_METRICS = [
  { metricName: 'Minimum Required ROI', defaultValue: 150, targetValue: 200, unit: '%' },
  { metricName: 'Maximum Payback Period', defaultValue: 24, targetValue: 18, unit: 'months' },
  { metricName: 'Target IRR', defaultValue: 15, targetValue: 20, unit: '%' },
  { metricName: 'Cost of Capital', defaultValue: 10, targetValue: 10, unit: '%' },
  { metricName: 'Hurdle Rate', defaultValue: 12, targetValue: 15, unit: '%' },
];

export const CompanyBenchmarkInput: React.FC<CompanyBenchmarkInputProps> = ({
  onBenchmarksChange,
  initialBenchmarks = [],
}) => {
  const [benchmarks, setBenchmarks] = useState<CompanyBenchmark[]>(
    initialBenchmarks.length > 0
      ? initialBenchmarks
      : DEFAULT_COMPANY_METRICS.map((m, i) => ({
          id: `company_${i}`,
          metricName: m.metricName,
          currentValue: m.defaultValue,
          targetValue: m.targetValue,
          unit: m.unit,
          notes: '',
        }))
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBenchmark, setNewBenchmark] = useState<Partial<CompanyBenchmark>>({});

  const updateBenchmark = (id: string, updates: Partial<CompanyBenchmark>) => {
    const updated = benchmarks.map(b => (b.id === id ? { ...b, ...updates } : b));
    setBenchmarks(updated);
    onBenchmarksChange(updated);
  };

  const removeBenchmark = (id: string) => {
    const updated = benchmarks.filter(b => b.id !== id);
    setBenchmarks(updated);
    onBenchmarksChange(updated);
  };

  const addBenchmark = () => {
    if (!newBenchmark.metricName) return;
    
    const benchmark: CompanyBenchmark = {
      id: `company_${Date.now()}`,
      metricName: newBenchmark.metricName,
      currentValue: newBenchmark.currentValue || 0,
      targetValue: newBenchmark.targetValue || 0,
      unit: newBenchmark.unit || '%',
      notes: newBenchmark.notes || '',
    };
    
    const updated = [...benchmarks, benchmark];
    setBenchmarks(updated);
    onBenchmarksChange(updated);
    setNewBenchmark({});
    setShowAddForm(false);
  };

  return (
    <div className="company-benchmark-input bg-gray-900 rounded-lg p-6">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-1">Company-Specific Benchmarks</h3>
        <p className="text-gray-400 text-sm">Enter your organization's investment thresholds and performance targets</p>
      </div>

      {/* Benchmark Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {benchmarks.map((benchmark) => {
          const meetsTarget = benchmark.currentValue >= benchmark.targetValue;
          
          return (
            <div
              key={benchmark.id}
              className="bg-gray-800 rounded-lg p-4 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-3">
                <input
                  type="text"
                  value={benchmark.metricName}
                  onChange={(e) => updateBenchmark(benchmark.id, { metricName: e.target.value })}
                  className="bg-transparent text-white font-medium focus:bg-gray-700 px-1 rounded"
                />
                <button
                  onClick={() => removeBenchmark(benchmark.id)}
                  className="text-gray-500 hover:text-red-400 text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Current/Threshold</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={benchmark.currentValue}
                      onChange={(e) => updateBenchmark(benchmark.id, { currentValue: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                    />
                    <span className="text-gray-500 text-sm">{benchmark.unit}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Target</label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      value={benchmark.targetValue}
                      onChange={(e) => updateBenchmark(benchmark.id, { targetValue: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                    />
                    <span className="text-gray-500 text-sm">{benchmark.unit}</span>
                  </div>
                </div>
              </div>

              {/* Gap Indicator */}
              <div className="mt-3 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${meetsTarget ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className={`text-xs ${meetsTarget ? 'text-green-400' : 'text-yellow-400'}`}>
                  {meetsTarget ? 'Meets target' : `Gap: ${(benchmark.targetValue - benchmark.currentValue).toFixed(1)}${benchmark.unit}`}
                </span>
              </div>

              {/* Notes */}
              <input
                type="text"
                value={benchmark.notes || ''}
                onChange={(e) => updateBenchmark(benchmark.id, { notes: e.target.value })}
                className="w-full mt-2 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-gray-400 text-xs"
                placeholder="Add notes..."
              />
            </div>
          );
        })}
      </div>

      {/* Add Custom Benchmark */}
      {showAddForm ? (
        <div className="mt-4 bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">Add Company Metric</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Metric name"
              value={newBenchmark.metricName || ''}
              onChange={(e) => setNewBenchmark(prev => ({ ...prev, metricName: e.target.value }))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
            <input
              type="number"
              placeholder="Current value"
              value={newBenchmark.currentValue || ''}
              onChange={(e) => setNewBenchmark(prev => ({ ...prev, currentValue: parseFloat(e.target.value) }))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
            <input
              type="number"
              placeholder="Target value"
              value={newBenchmark.targetValue || ''}
              onChange={(e) => setNewBenchmark(prev => ({ ...prev, targetValue: parseFloat(e.target.value) }))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
            <div className="flex gap-2">
              <button onClick={addBenchmark} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm">Add</button>
              <button onClick={() => setShowAddForm(false)} className="px-3 py-2 bg-gray-600 rounded text-white text-sm">Cancel</button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          + Add company metric
        </button>
      )}

      <div className="mt-6 bg-green-900/20 rounded p-3 text-xs text-green-400 border border-green-800">
        💡 Company benchmarks will be displayed alongside industry benchmarks in all comparison charts.
      </div>
    </div>
  );
};

export default CompanyBenchmarkInput;
