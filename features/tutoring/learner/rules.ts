export const learnerModelRules = {
  defaultConfidenceScore: 0.35,
  confidenceRetentionWeight: 0.72,
  maxRecentAttempts: 200,
  successScoreThreshold: 0.78,
  struggleScoreThreshold: 0.55,
  numericIncorrectPenalty: 0.08,
  misconceptionPenaltyCap: 0.22,
  repeatedMistakeThreshold: 2,
  topMisconceptionLimit: 6,
} as const;

export const misconceptionPenaltyWeights: Record<string, number> = {
  formula_selection_error: 0.11,
  gross_vs_net_profit_confusion: 0.1,
  cash_vs_profit_confusion: 0.1,
  revenue_vs_profit_confusion: 0.09,
  roi_formula_confusion: 0.09,
  cap_rate_input_confusion: 0.09,
  arithmetic_accuracy_gap: 0.06,
  weak_concept_language: 0.05,
  limited_reasoning_depth: 0.05,
  missing_numeric_answer: 0.08,
  missing_explanation: 0.08,
} as const;

export const sequencingRules = {
  remediationScoreThreshold: 0.5,
  reinforceScoreThreshold: 0.72,
  advanceScoreThreshold: 0.84,
  repeatedMistakeThreshold: learnerModelRules.repeatedMistakeThreshold,
  maxRecentAttemptsPerTopic: 6,
} as const;

export const difficultyRank: Record<string, number> = {
  foundation: 1,
  intermediate: 2,
  advanced: 3,
} as const;
