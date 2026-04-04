export const tutorToneConfig = {
  voice: "supportive",
  encourageMomentum: true,
  avoidShamingLanguage: true,
  prioritizeHintingBeforeRevealing: true,
  misconceptionPriority: [
    "formula_selection_error",
    "gross_vs_net_profit_confusion",
    "cash_vs_profit_confusion",
    "revenue_vs_profit_confusion",
    "arithmetic_accuracy_gap",
    "weak_concept_language",
  ],
} as const;

export const tutorRuleConfig = {
  explanationMinimumCharacters: 12,
  advanceThreshold: 0.8,
  repeatThreshold: 0.55,
} as const;
