import { SkillMasteryRecord } from "@/features/tutoring/data/types";
import {
  learnerModelRules,
  misconceptionPenaltyWeights,
} from "@/features/tutoring/learner/rules";

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function uniqueTags(tags: string[]) {
  return Array.from(new Set(tags.filter((tag) => tag.trim().length > 0).map((tag) => tag.trim())));
}

function toMasteryLevel(confidenceScore: number): SkillMasteryRecord["masteryLevel"] {
  if (confidenceScore >= 0.8) {
    return "proficient";
  }

  if (confidenceScore >= 0.55) {
    return "developing";
  }

  return "early";
}

export interface LearnerAttemptSignal {
  score: number;
  numericCorrect: boolean | null;
  misconceptionTags: string[];
  submittedAt: string;
}

export interface LearnerSkillStateInput {
  confidenceScore: number;
  recentCorrectCount: number;
  recentAttemptCount: number;
  currentStreak: number;
  misconceptionTags: string[];
  misconceptionCounts: Record<string, number>;
  recentScores: number[];
}

export interface UpdatedLearnerSkillState {
  confidenceScore: number;
  masteryLevel: SkillMasteryRecord["masteryLevel"];
  recentCorrectCount: number;
  recentAttemptCount: number;
  currentStreak: number;
  lastPracticedAt: string;
  misconceptionTags: string[];
  misconceptionCounts: Record<string, number>;
  recentScores: number[];
  repeatedMistakeTags: string[];
}

function computeMisconceptionPenalty({
  misconceptionTags,
  nextMisconceptionCounts,
}: {
  misconceptionTags: string[];
  nextMisconceptionCounts: Record<string, number>;
}) {
  const basePenalty = misconceptionTags.reduce((sum, tag) => {
    return sum + (misconceptionPenaltyWeights[tag] ?? 0.03);
  }, 0);

  const repeatedPenalty = misconceptionTags.reduce((sum, tag) => {
    const count = nextMisconceptionCounts[tag] ?? 0;
    return count >= learnerModelRules.repeatedMistakeThreshold ? sum + 0.03 : sum;
  }, 0);

  return Math.min(
    learnerModelRules.misconceptionPenaltyCap,
    basePenalty + repeatedPenalty
  );
}

function applyAttemptToMisconceptionCounts({
  previousCounts,
  attemptTags,
}: {
  previousCounts: Record<string, number>;
  attemptTags: string[];
}) {
  const next = { ...previousCounts };
  attemptTags.forEach((tag) => {
    next[tag] = (next[tag] ?? 0) + 1;
  });
  return next;
}

function computeRepeatedMistakeTags(misconceptionCounts: Record<string, number>) {
  return Object.entries(misconceptionCounts)
    .filter(([, count]) => count >= learnerModelRules.repeatedMistakeThreshold)
    .sort((left, right) => right[1] - left[1])
    .map(([tag]) => tag);
}

function mergeTopMisconceptionTags(misconceptionCounts: Record<string, number>) {
  return Object.entries(misconceptionCounts)
    .sort((left, right) => right[1] - left[1])
    .slice(0, learnerModelRules.topMisconceptionLimit)
    .map(([tag]) => tag);
}

export function getDefaultLearnerSkillState(): LearnerSkillStateInput {
  return {
    confidenceScore: learnerModelRules.defaultConfidenceScore,
    recentCorrectCount: 0,
    recentAttemptCount: 0,
    currentStreak: 0,
    misconceptionTags: [],
    misconceptionCounts: {},
    recentScores: [],
  };
}

export function updateLearnerSkillState({
  previousState,
  signal,
}: {
  previousState: LearnerSkillStateInput;
  signal: LearnerAttemptSignal;
}): UpdatedLearnerSkillState {
  const misconceptionTags = uniqueTags(signal.misconceptionTags);
  const nextMisconceptionCounts = applyAttemptToMisconceptionCounts({
    previousCounts: previousState.misconceptionCounts,
    attemptTags: misconceptionTags,
  });

  const misconceptionPenalty = computeMisconceptionPenalty({
    misconceptionTags,
    nextMisconceptionCounts,
  });

  const numericPenalty = signal.numericCorrect === false ? learnerModelRules.numericIncorrectPenalty : 0;
  const adjustedSignalScore = clamp(signal.score - misconceptionPenalty - numericPenalty);

  const confidenceScore = clamp(
    previousState.confidenceScore * learnerModelRules.confidenceRetentionWeight +
      adjustedSignalScore * (1 - learnerModelRules.confidenceRetentionWeight)
  );

  const wasSuccessfulAttempt =
    adjustedSignalScore >= learnerModelRules.successScoreThreshold &&
    misconceptionTags.length === 0;

  const recentAttemptCount = Math.min(
    previousState.recentAttemptCount + 1,
    learnerModelRules.maxRecentAttempts
  );
  const recentCorrectCount = Math.min(
    previousState.recentCorrectCount + (wasSuccessfulAttempt ? 1 : 0),
    learnerModelRules.maxRecentAttempts
  );
  const currentStreak = wasSuccessfulAttempt ? previousState.currentStreak + 1 : 0;

  const recentScores = [...previousState.recentScores, adjustedSignalScore].slice(-8);
  const repeatedMistakeTags = computeRepeatedMistakeTags(nextMisconceptionCounts);

  return {
    confidenceScore,
    masteryLevel: toMasteryLevel(confidenceScore),
    recentCorrectCount,
    recentAttemptCount,
    currentStreak,
    lastPracticedAt: signal.submittedAt,
    misconceptionTags: mergeTopMisconceptionTags(nextMisconceptionCounts),
    misconceptionCounts: nextMisconceptionCounts,
    recentScores,
    repeatedMistakeTags,
  };
}
