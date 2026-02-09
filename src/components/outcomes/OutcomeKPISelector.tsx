/**
 * Outcome KPI Selector - Business Value Tool V2.0
 * 
 * Allows selection of predefined outcomes plus custom "Other" option
 * with mandatory notes/justification. Includes editable weights.
 */

import React, { useState, useEffect } from 'react';
import { OutcomeKPI, PREDEFINED_OUTCOMES } from '../../types/businessValue';

interface OutcomeKPISelectorProps {
  onOutcomesChange: (outcomes: OutcomeKPI[]) => void;
  initialOutcomes?: OutcomeKPI[];
  requireNotes?: boolean;
  minNotesLength?: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  financial: '💰',
  operational: '⚙️',
  strategic: '🎯',
  customer: '👥',
  employee: '👤',
  other: '📋',
};

const CATEGORY_COLORS: Record<string, string> = {
  financial: 'bg-green-900/30 border-green-700',
  operational: 'bg-blue-900/30 border-blue-700',
  strategic: 'bg-purple-900/30 border-purple-700',
  customer: 'bg-cyan-900/30 border-cyan-700',
  employee: 'bg-yellow-900/30 border-yellow-700',
  other: 'bg-gray-800 border-gray-600',
};

export const OutcomeKPISelector: React.FC<OutcomeKPISelectorProps> = ({
  onOutcomesChange,
  initialOutcomes = [],
  requireNotes = true,
  minNotesLength = 50,
}) => {
  const [selectedOutcomes, setSelectedOutcomes] = useState<OutcomeKPI[]>(initialOutcomes);
  const [customOutcome, setCustomOutcome] = useState<Partial<OutcomeKPI> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showWeights, setShowWeights] = useState(false);

  useEffect(() => {
    onOutcomesChange(selectedOutcomes);
  }, [selectedOutcomes, onOutcomesChange]);

  const toggleOutcome = (predefinedOutcome: typeof PREDEFINED_OUTCOMES[0]) => {
    const existing = selectedOutcomes.find(o => o.id === predefinedOutcome.id);
    
    if (existing) {
      setSelectedOutcomes(prev => prev.filter(o => o.id !== predefinedOutcome.id));
    } else {
      const newOutcome: OutcomeKPI = {
        ...predefinedOutcome,
        weight: 100 / (selectedOutcomes.length + 1),
        notes: '',
      };
      setSelectedOutcomes(prev => [...prev, newOutcome]);
    }
  };

  const updateOutcome = (id: string, updates: Partial<OutcomeKPI>) => {
    setSelectedOutcomes(prev =>
      prev.map(o => (o.id === id ? { ...o, ...updates } : o))
    );
    
    // Clear error if notes are now valid
    if (updates.notes && updates.notes.length >= minNotesLength) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  const addCustomOutcome = () => {
    setCustomOutcome({
      id: `custom_${Date.now()}`,
      name: '',
      category: 'other',
      isCustom: true,
      description: '',
      weight: 10,
      notes: '',
    });
  };

  const saveCustomOutcome = () => {
    if (!customOutcome) return;

    const validationErrors: string[] = [];
    if (!customOutcome.name || customOutcome.name.length < 3) {
      validationErrors.push('Name is required (min 3 characters)');
    }
    if (!customOutcome.notes || customOutcome.notes.length < minNotesLength) {
      validationErrors.push(`Justification is required (min ${minNotesLength} characters)`);
    }

    if (validationErrors.length > 0) {
      setErrors(prev => ({ ...prev, [customOutcome.id!]: validationErrors.join('. ') }));
      return;
    }

    const newOutcome: OutcomeKPI = {
      id: customOutcome.id!,
      name: customOutcome.name!,
      category: 'other',
      isCustom: true,
      description: customOutcome.description || 'Custom outcome',
      weight: customOutcome.weight || 10,
      notes: customOutcome.notes!,
    };

    setSelectedOutcomes(prev => [...prev, newOutcome]);
    setCustomOutcome(null);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[customOutcome.id!];
      return newErrors;
    });
  };

  const removeOutcome = (id: string) => {
    setSelectedOutcomes(prev => prev.filter(o => o.id !== id));
  };

  const normalizeWeights = () => {
    const totalWeight = selectedOutcomes.reduce((sum, o) => sum + o.weight, 0);
    if (totalWeight === 0) return;
    
    setSelectedOutcomes(prev =>
      prev.map(o => ({ ...o, weight: (o.weight / totalWeight) * 100 }))
    );
  };

  const validateAll = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    selectedOutcomes.forEach(outcome => {
      if (requireNotes && (!outcome.notes || outcome.notes.length < minNotesLength)) {
        newErrors[outcome.id] = `Notes required (min ${minNotesLength} characters). Current: ${outcome.notes?.length || 0}`;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Group predefined outcomes by category
  const groupedOutcomes = PREDEFINED_OUTCOMES.reduce((acc, outcome) => {
    if (!acc[outcome.category]) acc[outcome.category] = [];
    acc[outcome.category].push(outcome);
    return acc;
  }, {} as Record<string, typeof PREDEFINED_OUTCOMES>);

  const totalWeight = selectedOutcomes.reduce((sum, o) => sum + o.weight, 0);

  return (
    <div className="outcome-kpi-selector bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Desired Outcomes & KPIs</h3>
          <p className="text-gray-400 text-sm">Select outcomes this solution will deliver. Notes are {requireNotes ? 'required' : 'optional'}.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWeights(!showWeights)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {showWeights ? 'Hide' : 'Show'} Weights
          </button>
          {showWeights && selectedOutcomes.length > 0 && (
            <button
              onClick={normalizeWeights}
              className="text-sm text-green-400 hover:text-green-300"
            >
              Normalize to 100%
            </button>
          )}
        </div>
      </div>

      {/* Predefined Outcomes by Category */}
      <div className="space-y-6">
        {Object.entries(groupedOutcomes).map(([category, outcomes]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
              {CATEGORY_ICONS[category]} {category.charAt(0).toUpperCase() + category.slice(1)}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {outcomes.map(outcome => {
                const isSelected = selectedOutcomes.some(o => o.id === outcome.id);
                
                return (
                  <button
                    key={outcome.id}
                    onClick={() => toggleOutcome(outcome)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? CATEGORY_COLORS[category]
                        : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-600'
                      }`}>
                        {isSelected && <span className="text-white text-xs">✓</span>}
                      </div>
                      <span className="font-medium text-white">{outcome.name}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 ml-6">{outcome.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Outcome Button */}
      <div className="mt-6">
        {!customOutcome ? (
          <button
            onClick={addCustomOutcome}
            className="w-full p-3 border-2 border-dashed border-gray-700 rounded-lg text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-xl">+</span>
            Add Other Outcome (requires justification)
          </button>
        ) : (
          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
            <h4 className="font-medium text-white mb-3">📋 Add Custom Outcome</h4>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Outcome Name *</label>
                <input
                  type="text"
                  value={customOutcome.name || ''}
                  onChange={(e) => setCustomOutcome(prev => ({ ...prev!, name: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="e.g., Reduce customer churn by 15%"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <input
                  type="text"
                  value={customOutcome.description || ''}
                  onChange={(e) => setCustomOutcome(prev => ({ ...prev!, description: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  placeholder="Brief description of this outcome"
                />
              </div>
              
              <div>
                <label className="block text-sm text-gray-400 mb-1">
                  Justification * <span className="text-xs text-gray-500">(min {minNotesLength} characters)</span>
                </label>
                <textarea
                  value={customOutcome.notes || ''}
                  onChange={(e) => setCustomOutcome(prev => ({ ...prev!, notes: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                  rows={3}
                  placeholder="Explain why this outcome is expected and how it will be measured..."
                />
                <div className="text-xs text-gray-500 mt-1">
                  {customOutcome.notes?.length || 0} / {minNotesLength} characters
                </div>
              </div>

              {errors[customOutcome.id!] && (
                <div className="text-sm text-red-400 bg-red-900/20 p-2 rounded">
                  {errors[customOutcome.id!]}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={saveCustomOutcome}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
                >
                  Add Outcome
                </button>
                <button
                  onClick={() => setCustomOutcome(null)}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Selected Outcomes with Notes */}
      {selectedOutcomes.length > 0 && (
        <div className="mt-6 border-t border-gray-700 pt-6">
          <h4 className="font-medium text-white mb-4">Selected Outcomes ({selectedOutcomes.length})</h4>
          
          <div className="space-y-4">
            {selectedOutcomes.map((outcome) => (
              <div
                key={outcome.id}
                className={`bg-gray-800 rounded-lg p-4 border ${
                  errors[outcome.id] ? 'border-red-600' : 'border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <span>{CATEGORY_ICONS[outcome.category]}</span>
                    <span className="font-medium text-white">{outcome.name}</span>
                    {outcome.isCustom && (
                      <span className="text-xs bg-yellow-800 text-yellow-300 px-2 py-0.5 rounded">Custom</span>
                    )}
                  </div>
                  <button
                    onClick={() => removeOutcome(outcome.id)}
                    className="text-gray-500 hover:text-red-400 text-sm"
                  >
                    ✕ Remove
                  </button>
                </div>

                {/* Weight (if showing) */}
                {showWeights && (
                  <div className="mb-3">
                    <label className="text-xs text-gray-400">Weight (%)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        value={outcome.weight}
                        onChange={(e) => updateOutcome(outcome.id, { weight: parseFloat(e.target.value) })}
                        className="flex-1"
                        min="1"
                        max="100"
                      />
                      <input
                        type="number"
                        value={outcome.weight.toFixed(0)}
                        onChange={(e) => updateOutcome(outcome.id, { weight: parseFloat(e.target.value) || 1 })}
                        className="w-16 bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                        min="1"
                        max="100"
                      />
                    </div>
                  </div>
                )}

                {/* Notes */}
                <div>
                  <label className="text-xs text-gray-400">
                    Notes {requireNotes && '*'}
                    <span className="text-gray-600 ml-2">({outcome.notes?.length || 0}/{minNotesLength} min)</span>
                  </label>
                  <textarea
                    value={outcome.notes}
                    onChange={(e) => updateOutcome(outcome.id, { notes: e.target.value })}
                    className={`w-full bg-gray-700 border rounded px-3 py-2 text-white text-sm mt-1 ${
                      errors[outcome.id] ? 'border-red-600' : 'border-gray-600'
                    }`}
                    rows={2}
                    placeholder="Explain how this outcome will be achieved and measured..."
                  />
                </div>

                {errors[outcome.id] && (
                  <div className="text-xs text-red-400 mt-1">{errors[outcome.id]}</div>
                )}
              </div>
            ))}
          </div>

          {/* Weight Summary */}
          {showWeights && (
            <div className="mt-4 bg-gray-800 rounded p-3 flex justify-between items-center">
              <span className="text-sm text-gray-400">Total Weight:</span>
              <span className={`font-medium ${
                Math.abs(totalWeight - 100) < 1 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {totalWeight.toFixed(0)}%
                {Math.abs(totalWeight - 100) >= 1 && ' (should equal 100%)'}
              </span>
            </div>
          )}

          {/* Validate Button */}
          <button
            onClick={validateAll}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
          >
            Validate Outcomes
          </button>
        </div>
      )}
    </div>
  );
};

export default OutcomeKPISelector;
