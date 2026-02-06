/**
 * Customer Outcome Selector Component
 * 
 * Implements CFO feedback:
 * - "Other" field for custom outcomes not in predefined list
 * - Mandatory notes section with minimum character requirement
 * - Flexible outcome capture with validation
 */

import React, { useState, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface CustomerOutcome {
  id: string;
  predefinedOutcome: string;
  customOutcome?: string;
  notes: string;
  quantifiedValue?: number;
  quantifiedUnit?: string;
  confidence: 'low' | 'medium' | 'high';
  timeframe?: string;
  createdAt: Date;
}

export interface OutcomeValidationError {
  field: string;
  message: string;
}

interface CustomerOutcomeSelectorProps {
  onOutcomeChange: (outcome: CustomerOutcome | null) => void;
  onValidationChange?: (isValid: boolean, errors: OutcomeValidationError[]) => void;
  initialOutcome?: Partial<CustomerOutcome>;
  required?: boolean;
  minNotesLength?: number;
}

// ============================================================================
// PREDEFINED OUTCOMES
// ============================================================================

export const PREDEFINED_OUTCOMES = [
  {
    id: 'revenue-increase',
    label: 'Revenue Increase',
    category: 'Financial',
    description: 'Direct increase in top-line revenue',
    suggestedMetrics: ['Percentage increase', 'Dollar amount', 'New customers acquired'],
  },
  {
    id: 'cost-reduction',
    label: 'Cost Reduction',
    category: 'Financial',
    description: 'Reduction in operational or overhead costs',
    suggestedMetrics: ['Percentage reduction', 'Dollar savings', 'FTE reduction'],
  },
  {
    id: 'time-savings',
    label: 'Time Savings',
    category: 'Operational',
    description: 'Reduction in time spent on processes or tasks',
    suggestedMetrics: ['Hours saved per week', 'Days to completion', 'Cycle time reduction'],
  },
  {
    id: 'productivity-improvement',
    label: 'Productivity Improvement',
    category: 'Operational',
    description: 'Increased output per employee or team',
    suggestedMetrics: ['Output per hour', 'Tasks completed', 'Throughput increase'],
  },
  {
    id: 'quality-improvement',
    label: 'Quality Improvement',
    category: 'Operational',
    description: 'Reduction in errors, defects, or rework',
    suggestedMetrics: ['Error rate reduction', 'Defect rate', 'First-pass yield'],
  },
  {
    id: 'customer-satisfaction',
    label: 'Customer Satisfaction',
    category: 'Customer',
    description: 'Improved customer experience and loyalty',
    suggestedMetrics: ['NPS increase', 'CSAT score', 'Retention rate'],
  },
  {
    id: 'time-to-market',
    label: 'Faster Time to Market',
    category: 'Strategic',
    description: 'Reduced time to launch products or services',
    suggestedMetrics: ['Days to launch', 'Sprint velocity', 'Release frequency'],
  },
  {
    id: 'risk-reduction',
    label: 'Risk Reduction',
    category: 'Strategic',
    description: 'Decreased business, compliance, or security risk',
    suggestedMetrics: ['Risk score reduction', 'Compliance rate', 'Incident reduction'],
  },
  {
    id: 'employee-satisfaction',
    label: 'Employee Satisfaction',
    category: 'People',
    description: 'Improved employee experience and engagement',
    suggestedMetrics: ['eNPS', 'Engagement score', 'Turnover reduction'],
  },
  {
    id: 'scalability',
    label: 'Improved Scalability',
    category: 'Strategic',
    description: 'Ability to handle increased volume without proportional cost increase',
    suggestedMetrics: ['Transactions per dollar', 'Users supported', 'Capacity increase'],
  },
  {
    id: 'other',
    label: 'Other (Please Specify)',
    category: 'Custom',
    description: 'Custom outcome not listed above',
    suggestedMetrics: [],
  },
] as const;

const OUTCOME_CATEGORIES = ['Financial', 'Operational', 'Customer', 'Strategic', 'People', 'Custom'] as const;

const CONFIDENCE_LEVELS = [
  { value: 'low', label: 'Low', description: 'Early estimate, limited data' },
  { value: 'medium', label: 'Medium', description: 'Based on similar projects or partial data' },
  { value: 'high', label: 'High', description: 'Based on direct measurement or strong evidence' },
] as const;

const TIMEFRAMES = [
  '0-3 months',
  '3-6 months',
  '6-12 months',
  '1-2 years',
  '2+ years',
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export const CustomerOutcomeSelector: React.FC<CustomerOutcomeSelectorProps> = ({
  onOutcomeChange,
  onValidationChange,
  initialOutcome,
  required = true,
  minNotesLength = 50,
}) => {
  const [selectedOutcomeId, setSelectedOutcomeId] = useState<string>(
    initialOutcome?.predefinedOutcome || ''
  );
  const [customOutcome, setCustomOutcome] = useState<string>(
    initialOutcome?.customOutcome || ''
  );
  const [notes, setNotes] = useState<string>(initialOutcome?.notes || '');
  const [quantifiedValue, setQuantifiedValue] = useState<string>(
    initialOutcome?.quantifiedValue?.toString() || ''
  );
  const [quantifiedUnit, setQuantifiedUnit] = useState<string>(
    initialOutcome?.quantifiedUnit || ''
  );
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(
    initialOutcome?.confidence || 'medium'
  );
  const [timeframe, setTimeframe] = useState<string>(
    initialOutcome?.timeframe || ''
  );
  const [errors, setErrors] = useState<OutcomeValidationError[]>([]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const selectedOutcome = PREDEFINED_OUTCOMES.find(o => o.id === selectedOutcomeId);
  const isOtherSelected = selectedOutcomeId === 'other';

  // Validation
  const validate = useCallback((): OutcomeValidationError[] => {
    const validationErrors: OutcomeValidationError[] = [];

    if (required && !selectedOutcomeId) {
      validationErrors.push({
        field: 'predefinedOutcome',
        message: 'Please select an outcome type',
      });
    }

    if (isOtherSelected && !customOutcome.trim()) {
      validationErrors.push({
        field: 'customOutcome',
        message: 'Please specify the custom outcome',
      });
    }

    if (isOtherSelected && customOutcome.trim().length < 10) {
      validationErrors.push({
        field: 'customOutcome',
        message: 'Custom outcome must be at least 10 characters',
      });
    }

    if (notes.length < minNotesLength) {
      validationErrors.push({
        field: 'notes',
        message: `Notes are required (minimum ${minNotesLength} characters). Please provide context about how this outcome was determined. Currently: ${notes.length}/${minNotesLength}`,
      });
    }

    return validationErrors;
  }, [selectedOutcomeId, customOutcome, notes, required, isOtherSelected, minNotesLength]);

  // Build outcome object and notify parent
  const updateOutcome = useCallback(() => {
    const validationErrors = validate();
    setErrors(validationErrors);
    onValidationChange?.(validationErrors.length === 0, validationErrors);

    if (validationErrors.length === 0 && selectedOutcomeId) {
      const outcome: CustomerOutcome = {
        id: crypto.randomUUID(),
        predefinedOutcome: selectedOutcomeId,
        customOutcome: isOtherSelected ? customOutcome : undefined,
        notes,
        quantifiedValue: quantifiedValue ? parseFloat(quantifiedValue) : undefined,
        quantifiedUnit: quantifiedUnit || undefined,
        confidence,
        timeframe: timeframe || undefined,
        createdAt: new Date(),
      };
      onOutcomeChange(outcome);
    } else {
      onOutcomeChange(null);
    }
  }, [
    validate,
    selectedOutcomeId,
    customOutcome,
    notes,
    quantifiedValue,
    quantifiedUnit,
    confidence,
    timeframe,
    isOtherSelected,
    onOutcomeChange,
    onValidationChange,
  ]);

  // Update on any change
  React.useEffect(() => {
    updateOutcome();
  }, [selectedOutcomeId, customOutcome, notes, quantifiedValue, quantifiedUnit, confidence, timeframe]);

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const getFieldError = (field: string): string | undefined => {
    if (!touched[field]) return undefined;
    return errors.find(e => e.field === field)?.message;
  };

  // Group outcomes by category
  const outcomesByCategory = OUTCOME_CATEGORIES.map(category => ({
    category,
    outcomes: PREDEFINED_OUTCOMES.filter(o => o.category === category),
  })).filter(group => group.outcomes.length > 0);

  return (
    <div className="customer-outcome-selector space-y-6">
      {/* Header */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold text-gray-900">Customer Outcome</h3>
        <p className="text-sm text-gray-600 mt-1">
          Select the primary outcome achieved and provide supporting context.
          {required && <span className="text-red-500 ml-1">*</span>}
        </p>
      </div>

      {/* Outcome Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Outcome Type
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        <select
          value={selectedOutcomeId}
          onChange={(e) => {
            setSelectedOutcomeId(e.target.value);
            if (e.target.value !== 'other') {
              setCustomOutcome('');
            }
          }}
          onBlur={() => handleBlur('predefinedOutcome')}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            getFieldError('predefinedOutcome') ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <option value="">Select an outcome...</option>
          {outcomesByCategory.map(group => (
            <optgroup key={group.category} label={group.category}>
              {group.outcomes.map(outcome => (
                <option key={outcome.id} value={outcome.id}>
                  {outcome.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        
        {getFieldError('predefinedOutcome') && (
          <p className="text-sm text-red-600">{getFieldError('predefinedOutcome')}</p>
        )}

        {/* Selected outcome description */}
        {selectedOutcome && selectedOutcome.id !== 'other' && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">{selectedOutcome.description}</p>
            {selectedOutcome.suggestedMetrics.length > 0 && (
              <p className="text-xs text-blue-600 mt-1">
                Suggested metrics: {selectedOutcome.suggestedMetrics.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Custom Outcome Field (shown when "Other" is selected) */}
      {isOtherSelected && (
        <div className="space-y-2 animate-fadeIn">
          <label className="block text-sm font-medium text-gray-700">
            Specify Custom Outcome
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={customOutcome}
            onChange={(e) => setCustomOutcome(e.target.value)}
            onBlur={() => handleBlur('customOutcome')}
            placeholder="Describe the specific outcome achieved..."
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              getFieldError('customOutcome') ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {getFieldError('customOutcome') && (
            <p className="text-sm text-red-600">{getFieldError('customOutcome')}</p>
          )}
          <p className="text-xs text-gray-500">
            Be specific about what was achieved (e.g., "Reduced invoice processing time by automating data entry")
          </p>
        </div>
      )}

      {/* Quantification */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Quantified Value
            <span className="text-gray-400 ml-1">(optional)</span>
          </label>
          <input
            type="number"
            value={quantifiedValue}
            onChange={(e) => setQuantifiedValue(e.target.value)}
            placeholder="e.g., 25"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Unit of Measure
            <span className="text-gray-400 ml-1">(optional)</span>
          </label>
          <input
            type="text"
            value={quantifiedUnit}
            onChange={(e) => setQuantifiedUnit(e.target.value)}
            placeholder="e.g., %, hours, $"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Confidence & Timeframe */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Confidence Level
          </label>
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value as 'low' | 'medium' | 'high')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {CONFIDENCE_LEVELS.map(level => (
              <option key={level.value} value={level.value}>
                {level.label} - {level.description}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Expected Timeframe
          </label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select timeframe...</option>
            {TIMEFRAMES.map(tf => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Mandatory Notes Section */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Notes & Context
          <span className="text-red-500 ml-1">*</span>
          <span className="text-gray-400 ml-2">(minimum {minNotesLength} characters)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => handleBlur('notes')}
          rows={4}
          placeholder={`Please provide context about this outcome:
• How was this outcome measured or estimated?
• What assumptions were made?
• What evidence supports this claim?
• Any caveats or conditions?`}
          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            getFieldError('notes') ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        <div className="flex justify-between items-center">
          <div>
            {getFieldError('notes') && (
              <p className="text-sm text-red-600">{getFieldError('notes')}</p>
            )}
          </div>
          <p className={`text-sm ${notes.length >= minNotesLength ? 'text-green-600' : 'text-gray-500'}`}>
            {notes.length}/{minNotesLength} characters
            {notes.length >= minNotesLength && ' ✓'}
          </p>
        </div>
      </div>

      {/* Validation Summary */}
      {errors.length > 0 && touched.notes && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Please address the following:</h4>
          <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
            {errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Success indicator */}
      {errors.length === 0 && selectedOutcomeId && notes.length >= minNotesLength && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 flex items-center">
            <span className="mr-2">✓</span>
            Outcome captured successfully
          </p>
        </div>
      )}
    </div>
  );
};

export default CustomerOutcomeSelector;
