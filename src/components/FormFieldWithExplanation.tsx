/**
 * Form Field With Explanation Component
 * 
 * A reusable wrapper that adds contextual help to any form input field.
 * Integrates with INPUT_EXPLANATIONS for consistent messaging.
 */

import React, { useState } from 'react';
import { INPUT_EXPLANATIONS, InputTooltip } from './InputExplanations';

interface FormFieldWithExplanationProps {
  fieldId: string;
  label?: string;
  required?: boolean;
  children: React.ReactNode;
  showHelpText?: boolean;
  showExpandedHelp?: boolean;
  className?: string;
}

export const FormFieldWithExplanation: React.FC<FormFieldWithExplanationProps> = ({
  fieldId,
  label,
  required = false,
  children,
  showHelpText = true,
  showExpandedHelp = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(showExpandedHelp);
  const explanation = INPUT_EXPLANATIONS[fieldId];
  
  const displayLabel = label || explanation?.label || fieldId;

  return (
    <div className={`form-field-with-explanation ${className}`}>
      <div className="flex items-center gap-1 mb-1">
        <label className="block text-sm font-medium text-gray-300">
          {displayLabel}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {explanation && <InputTooltip fieldId={fieldId} />}
      </div>
      
      {children}
      
      {showHelpText && explanation && (
        <div className="mt-1">
          <p className="text-xs text-gray-500">
            {explanation.purpose.length > 120 
              ? `${explanation.purpose.slice(0, 120)}...` 
              : explanation.purpose
            }
          </p>
          
          {explanation.example && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-blue-500 hover:text-blue-700 mt-1"
            >
              {isExpanded ? 'Hide details ▲' : 'Show example & tips ▼'}
            </button>
          )}
          
          {isExpanded && (
            <div className="mt-2 p-3 bg-gray-800 rounded-lg text-xs space-y-2">
              {explanation.example && (
                <div>
                  <span className="font-medium text-blue-400">Example: </span>
                  <span className="text-gray-300">{explanation.example}</span>
                </div>
              )}
              
              {explanation.usedIn && explanation.usedIn.length > 0 && (
                <div>
                  <span className="font-medium text-green-400">Used in: </span>
                  <ul className="list-disc list-inside text-gray-300 mt-1">
                    {explanation.usedIn.slice(0, 3).map((use, i) => (
                      <li key={i}>{use}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {explanation.tips && explanation.tips.length > 0 && (
                <div>
                  <span className="font-medium text-yellow-400">Tips: </span>
                  <ul className="list-disc list-inside text-gray-300 mt-1">
                    {explanation.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * USAGE EXAMPLE:
 * 
 * <FormFieldWithExplanation fieldId="investmentAmount" required>
 *   <input
 *     type="number"
 *     value={investmentAmount}
 *     onChange={(e) => setInvestmentAmount(e.target.value)}
 *     className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
 *   />
 * </FormFieldWithExplanation>
 * 
 * For Solution Areas (checkbox):
 * 
 * <FormFieldWithExplanation fieldId="solutionAreas">
 *   <div className="space-y-2">
 *     {solutionAreaOptions.map(option => (
 *       <label key={option.id} className="flex items-center gap-2">
 *         <input type="checkbox" ... />
 *         {option.label}
 *       </label>
 *     ))}
 *   </div>
 * </FormFieldWithExplanation>
 */

export default FormFieldWithExplanation;
