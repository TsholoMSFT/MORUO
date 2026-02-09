/**
 * Industry Benchmark Input - Business Value Tool V2.0
 * 
 * Allows input of industry benchmarks with data source citations.
 * Provides comparison against customer's projected values.
 */

import React, { useState } from 'react';
import { IndustryBenchmark } from '../../types/businessValue';

interface IndustryBenchmarkInputProps {
  industry: string;
  onBenchmarksChange: (benchmarks: IndustryBenchmark[]) => void;
  initialBenchmarks?: IndustryBenchmark[];
}

const DEFAULT_BENCHMARK_METRICS = [
  { metric: 'Average ROI', unit: '%', defaultValue: 250, source: 'Gartner IT Investment Benchmarks 2025' },
  { metric: 'Median Payback Period', unit: 'months', defaultValue: 14, source: 'Forrester TEI Studies' },
  { metric: 'Average Time to Value', unit: 'months', defaultValue: 6, source: 'McKinsey Digital Transformation' },
  { metric: 'Implementation Success Rate', unit: '%', defaultValue: 72, source: 'Standish CHAOS Report 2024' },
  { metric: 'Cost Overrun Frequency', unit: '%', defaultValue: 45, source: 'PMI Pulse of Profession' },
  { metric: 'Productivity Improvement', unit: '%', defaultValue: 25, source: 'Gartner Workforce Analytics' },
];

const INDUSTRY_MULTIPLIERS: Record<string, number> = {
  technology: 1.1,
  financial_services: 1.0,
  healthcare: 0.9,
  manufacturing: 1.05,
  retail: 0.95,
  government: 0.85,
  education: 0.88,
  other: 1.0,
};

export const IndustryBenchmarkInput: React.FC<IndustryBenchmarkInputProps> = ({
  industry,
  onBenchmarksChange,
  initialBenchmarks = [],
}) => {
  const multiplier = INDUSTRY_MULTIPLIERS[industry] || 1.0;
  
  const [benchmarks, setBenchmarks] = useState<IndustryBenchmark[]>(
    initialBenchmarks.length > 0
      ? initialBenchmarks
      : DEFAULT_BENCHMARK_METRICS.map((m, i) => ({
          id: `benchmark_${i}`,
          industry,
          metric: m.metric,
          value: Math.round(m.defaultValue * multiplier),
          unit: m.unit,
          percentile: 50,
          source: m.source,
          sourceYear: 2025,
        }))
  );
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBenchmark, setNewBenchmark] = useState<Partial<IndustryBenchmark>>({});

  const updateBenchmark = (id: string, updates: Partial<IndustryBenchmark>) => {
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
    if (!newBenchmark.metric || !newBenchmark.value) return;
    
    const benchmark: IndustryBenchmark = {
      id: `benchmark_${Date.now()}`,
      industry,
      metric: newBenchmark.metric,
      value: newBenchmark.value,
      unit: newBenchmark.unit || '%',
      percentile: newBenchmark.percentile || 50,
      source: newBenchmark.source || 'Custom',
      sourceYear: newBenchmark.sourceYear || 2025,
    };
    
    const updated = [...benchmarks, benchmark];
    setBenchmarks(updated);
    onBenchmarksChange(updated);
    setNewBenchmark({});
    setShowAddForm(false);
  };

  return (
    <div className="industry-benchmark-input bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Industry Benchmarks</h3>
          <p className="text-gray-400 text-sm">
            {industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} industry data with source citations
          </p>
        </div>
        <div className="bg-blue-900/30 px-3 py-1 rounded border border-blue-700">
          <span className="text-xs text-blue-400">Industry Factor: {multiplier}x</span>
        </div>
      </div>

      {/* Benchmark Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 text-gray-400">Metric</th>
              <th className="text-right py-2 text-gray-400">Value</th>
              <th className="text-left py-2 text-gray-400 px-2">Unit</th>
              <th className="text-center py-2 text-gray-400">Percentile</th>
              <th className="text-left py-2 text-gray-400">Source</th>
              <th className="text-right py-2 text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((benchmark) => (
              <tr key={benchmark.id} className="border-b border-gray-800">
                <td className="py-3">
                  <input
                    type="text"
                    value={benchmark.metric}
                    onChange={(e) => updateBenchmark(benchmark.id, { metric: e.target.value })}
                    className="bg-transparent text-white w-full focus:bg-gray-800 px-1 rounded"
                  />
                </td>
                <td className="py-3 text-right">
                  <input
                    type="number"
                    value={benchmark.value}
                    onChange={(e) => updateBenchmark(benchmark.id, { value: parseFloat(e.target.value) || 0 })}
                    className="bg-gray-700 text-white w-20 px-2 py-1 rounded text-right"
                  />
                </td>
                <td className="py-3 px-2">
                  <select
                    value={benchmark.unit}
                    onChange={(e) => updateBenchmark(benchmark.id, { unit: e.target.value })}
                    className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  >
                    <option value="%">%</option>
                    <option value="months">months</option>
                    <option value="$">$</option>
                    <option value="days">days</option>
                    <option value="x">x (multiplier)</option>
                  </select>
                </td>
                <td className="py-3 text-center">
                  <select
                    value={benchmark.percentile}
                    onChange={(e) => updateBenchmark(benchmark.id, { percentile: parseInt(e.target.value) })}
                    className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
                  >
                    <option value={25}>25th</option>
                    <option value={50}>50th (Median)</option>
                    <option value={75}>75th</option>
                  </select>
                </td>
                <td className="py-3">
                  <input
                    type="text"
                    value={benchmark.source}
                    onChange={(e) => updateBenchmark(benchmark.id, { source: e.target.value })}
                    className="bg-transparent text-gray-400 w-full focus:bg-gray-800 px-1 rounded text-sm"
                    placeholder="Data source"
                  />
                </td>
                <td className="py-3 text-right">
                  <button
                    onClick={() => removeBenchmark(benchmark.id)}
                    className="text-gray-500 hover:text-red-400 text-sm"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Benchmark Form */}
      {showAddForm ? (
        <div className="mt-4 bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-3">Add Custom Benchmark</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="Metric name"
              value={newBenchmark.metric || ''}
              onChange={(e) => setNewBenchmark(prev => ({ ...prev, metric: e.target.value }))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
            <input
              type="number"
              placeholder="Value"
              value={newBenchmark.value || ''}
              onChange={(e) => setNewBenchmark(prev => ({ ...prev, value: parseFloat(e.target.value) }))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
            <input
              type="text"
              placeholder="Source"
              value={newBenchmark.source || ''}
              onChange={(e) => setNewBenchmark(prev => ({ ...prev, source: e.target.value }))}
              className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={addBenchmark}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddForm(true)}
          className="mt-4 text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
        >
          + Add benchmark metric
        </button>
      )}

      {/* Source Note */}
      <div className="mt-6 bg-gray-800 rounded p-3 text-xs text-gray-500">
        <strong>Note:</strong> Benchmark values should be cited with their source for defensibility. 
        Click on any value or source to edit. Default values are industry-adjusted based on 
        Gartner, Forrester, and McKinsey research.
      </div>
    </div>
  );
};

export default IndustryBenchmarkInput;
