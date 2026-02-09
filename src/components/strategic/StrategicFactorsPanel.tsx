/**
 * Strategic Factors Panel - Business Value Tool V2.0
 * 
 * Captures and weights strategic factors that influence business value
 * beyond direct financial returns. Shows weighted contribution to strategic score.
 */

import React, { useState, useEffect } from 'react';
import { StrategicFactor, StrategicScoreResult } from '../../types/businessValue';

interface StrategicFactorsPanelProps {
  onScoreChange: (result: StrategicScoreResult) => void;
  initialFactors?: Partial<Record<string, number>>;
}

const DEFAULT_FACTORS: Omit<StrategicFactor, 'score' | 'weightedScore'>[] = [
  {
    id: 'competitive_differentiation',
    name: 'Competitive Differentiation',
    description: 'Ability to create unique market position or capabilities competitors cannot easily replicate',
    weight: 20,
    impactDescription: 'Affects market positioning, pricing power, and customer acquisition',
  },
  {
    id: 'risk_mitigation',
    name: 'Risk Mitigation',
    description: 'Reduction in operational, security, compliance, or business continuity risks',
    weight: 15,
    impactDescription: 'Reduces potential for losses, penalties, and reputational damage',
  },
  {
    id: 'customer_experience',
    name: 'Customer Experience',
    description: 'Improvement in customer satisfaction, engagement, and loyalty',
    weight: 20,
    impactDescription: 'Drives retention, referrals, and lifetime value',
  },
  {
    id: 'time_to_market',
    name: 'Time to Market',
    description: 'Acceleration of product development, feature delivery, or market entry',
    weight: 15,
    impactDescription: 'Enables first-mover advantage and faster revenue capture',
  },
  {
    id: 'employee_productivity',
    name: 'Employee Productivity',
    description: 'Enhancement of workforce efficiency, collaboration, and output quality',
    weight: 15,
    impactDescription: 'Improves capacity, reduces burnout, and enables higher-value work',
  },
  {
    id: 'regulatory_compliance',
    name: 'Regulatory Compliance',
    description: 'Meeting current or upcoming regulatory requirements and industry standards',
    weight: 15,
    impactDescription: 'Avoids penalties, enables market access, and builds trust',
  },
];

const SCORE_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: 'Minimal', color: 'text-gray-400' },
  2: { label: 'Low', color: 'text-yellow-500' },
  3: { label: 'Moderate', color: 'text-yellow-400' },
  4: { label: 'High', color: 'text-green-400' },
  5: { label: 'Transformational', color: 'text-green-300' },
};

export const StrategicFactorsPanel: React.FC<StrategicFactorsPanelProps> = ({
  onScoreChange,
  initialFactors = {},
}) => {
  const [factors, setFactors] = useState<StrategicFactor[]>(
    DEFAULT_FACTORS.map(f => ({
      ...f,
      score: initialFactors[f.id] || 3,
      weightedScore: (initialFactors[f.id] || 3) * f.weight,
    }))
  );
  const [showWeights, setShowWeights] = useState(false);

  useEffect(() => {
    const totalWeightedScore = factors.reduce((sum, f) => sum + f.weightedScore, 0);
    const maxPossibleScore = factors.reduce((sum, f) => sum + f.weight * 5, 0);
    const scorePercentage = (totalWeightedScore / maxPossibleScore) * 100;

    let qualitativeAssessment = '';
    let recommendations: string[] = [];

    if (scorePercentage >= 80) {
      qualitativeAssessment = 'Exceptional strategic value - Strong justification for investment beyond pure ROI';
      recommendations = [
        'Highlight transformational benefits in executive presentations',
        'Consider this a strategic priority investment',
      ];
    } else if (scorePercentage >= 60) {
      qualitativeAssessment = 'Strong strategic value - Significant non-financial benefits support investment';
      recommendations = [
        'Emphasize strategic factors alongside financial returns',
        'Identify quick wins to demonstrate strategic value early',
      ];
    } else if (scorePercentage >= 40) {
      qualitativeAssessment = 'Moderate strategic value - Some strategic benefits, but ROI should be primary driver';
      recommendations = [
        'Focus on strengthening financial justification',
        'Identify opportunities to increase strategic impact',
      ];
    } else {
      qualitativeAssessment = 'Limited strategic value - Investment primarily justified by financial returns';
      recommendations = [
        'Ensure financial ROI is compelling',
        'Consider if strategic scope can be expanded',
      ];
    }

    const result: StrategicScoreResult = {
      totalScore: totalWeightedScore,
      maxPossibleScore,
      scorePercentage,
      factors,
      qualitativeAssessment,
      recommendations,
    };

    onScoreChange(result);
  }, [factors, onScoreChange]);

  const updateScore = (factorId: string, newScore: number) => {
    setFactors(prev =>
      prev.map(f =>
        f.id === factorId
          ? { ...f, score: newScore, weightedScore: newScore * f.weight }
          : f
      )
    );
  };

  const totalWeightedScore = factors.reduce((sum, f) => sum + f.weightedScore, 0);
  const maxPossibleScore = factors.reduce((sum, f) => sum + f.weight * 5, 0);
  const scorePercentage = (totalWeightedScore / maxPossibleScore) * 100;

  return (
    <div className="strategic-factors-panel bg-gray-900 rounded-lg p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-1">Strategic Factors</h3>
          <p className="text-gray-400 text-sm">Rate how this solution impacts each strategic dimension (1-5)</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Strategic Score</div>
          <div className="text-3xl font-bold text-purple-400">
            {scorePercentage.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500">{totalWeightedScore} / {maxPossibleScore} points</div>
        </div>
      </div>

      {/* Show Weights Toggle */}
      <button
        onClick={() => setShowWeights(!showWeights)}
        className="text-sm text-blue-400 hover:text-blue-300 mb-4 flex items-center gap-1"
      >
        {showWeights ? '▼ Hide weight details' : '▶ Show weight details'}
      </button>

      {/* Factors */}
      <div className="space-y-4">
        {factors.map((factor) => (
          <div key={factor.id} className="bg-gray-800 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{factor.name}</span>
                  {showWeights && (
                    <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-400">
                      Weight: {factor.weight}%
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{factor.description}</p>
              </div>
              <div className="text-right">
                <span className={`text-lg font-bold ${SCORE_LABELS[factor.score].color}`}>
                  {factor.score}/5
                </span>
                <div className="text-xs text-gray-500">{SCORE_LABELS[factor.score].label}</div>
              </div>
            </div>

            {/* Score Slider */}
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="5"
                value={factor.score}
                onChange={(e) => updateScore(factor.id, parseInt(e.target.value))}
                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    onClick={() => updateScore(factor.id, score)}
                    className={`w-8 h-8 rounded ${factor.score === score
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
            </div>

            {/* Impact Description (shown when score > 3) */}
            {factor.score >= 4 && showWeights && (
              <div className="mt-3 bg-purple-900/30 rounded p-2 text-xs text-purple-300 border border-purple-800">
                💡 {factor.impactDescription}
              </div>
            )}

            {/* Weighted Score */}
            {showWeights && (
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>Weighted Score: {factor.score} × {factor.weight}%</span>
                <span className="text-purple-400 font-medium">= {factor.weightedScore} points</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Score Explanation */}
      <div className="mt-6 bg-purple-900/20 rounded-lg p-4 border border-purple-800">
        <h4 className="text-sm font-medium text-purple-400 mb-2">📊 Strategic Score Explanation</h4>
        <p className="text-sm text-gray-300 mb-3">
          {scorePercentage >= 80 && 'Exceptional strategic value - Strong justification for investment beyond pure ROI'}
          {scorePercentage >= 60 && scorePercentage < 80 && 'Strong strategic value - Significant non-financial benefits support investment'}
          {scorePercentage >= 40 && scorePercentage < 60 && 'Moderate strategic value - Some strategic benefits, but ROI should be primary driver'}
          {scorePercentage < 40 && 'Limited strategic value - Investment primarily justified by financial returns'}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
          {factors
            .sort((a, b) => b.weightedScore - a.weightedScore)
            .slice(0, 3)
            .map((factor) => (
              <div key={factor.id} className="bg-gray-800 rounded p-2">
                <div className="text-gray-400">Top Factor</div>
                <div className="text-white font-medium">{factor.name}</div>
                <div className="text-purple-400">{factor.weightedScore} pts</div>
              </div>
            ))}
        </div>
      </div>

      {/* Weighting Methodology */}
      {showWeights && (
        <div className="mt-4 bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-2">Weighting Methodology</h4>
          <p className="text-xs text-gray-400">
            Weights are based on McKinsey's Digital Value Framework and Gartner's Business Value Model.
            Customer Experience and Competitive Differentiation are weighted highest (20%) as primary
            strategic differentiators. Other factors are weighted at 15% each.
          </p>
        </div>
      )}
    </div>
  );
};

export default StrategicFactorsPanel;
