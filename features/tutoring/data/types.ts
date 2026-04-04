export interface SubjectDomainRecord {
  id: string;
  slug: string;
  title: string;
  description: string | null;
}

export interface TopicSummary {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  displayOrder: number;
  subjectDomainId: string;
}

export interface ScenarioQuestionRecord {
  id: string;
  questionOrder: number;
  prompt: string;
  responseFormat: "numeric" | "short_text" | "mixed";
  numericAnswer: number | null;
  numericTolerance: number | null;
  unit: string | null;
  explanationPrompt: string | null;
  hint: string | null;
  rubric: Record<string, unknown>;
}

export interface ScenarioSkillRecord {
  id: string;
  slug: string;
  name: string;
  weight: number;
}

export interface ScenarioRecord {
  id: string;
  slug: string;
  title: string;
  businessContext: string;
  difficultyLevel: string;
  displayOrder: number;
  estimatedMinutes: number | null;
  topic: {
    id: string;
    slug: string;
    title: string;
    summary: string | null;
    displayOrder: number;
  };
  skills: ScenarioSkillRecord[];
  questions: ScenarioQuestionRecord[];
}

export interface ScenarioFilters {
  subjectDomainSlug?: string;
  topicSlug?: string;
  difficultyLevel?: string;
  skillSlug?: string;
  limit?: number;
}

export interface StartSessionInput {
  subjectDomainSlug?: string;
  topicSlug?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateAttemptInput {
  sessionId?: string | null;
  scenarioId: string;
  questionId: string;
  attemptNumber?: number;
  numericAnswer?: number | null;
  shortTextAnswer?: string | null;
  correctnessScore?: number | null;
  isNumericCorrect?: boolean | null;
  misconceptionTags?: string[];
  durationSeconds?: number | null;
  metadata?: Record<string, unknown>;
}

export interface CreateFeedbackHistoryInput {
  attemptId: string;
  providerMode: "mock" | "real";
  modelName?: string | null;
  feedbackSummary: string;
  strengths?: string[];
  improvements?: string[];
  recommendedNextStep?: "advance" | "repeat" | "review";
  hintProvided?: string | null;
  score?: number | null;
  rawFeedback?: Record<string, unknown>;
}

export interface SkillMasteryRecord {
  id: string;
  skillId: string;
  skillSlug?: string;
  skillName?: string;
  confidenceScore: number;
  masteryLevel: "early" | "developing" | "proficient";
  recentCorrectCount: number;
  recentAttemptCount: number;
  currentStreak: number;
  lastPracticedAt: string | null;
  misconceptionTags: string[];
  misconceptionCounts?: Record<string, number>;
  recentScores?: number[];
}

export interface TopicMasteryRecord {
  topicId: string;
  topicSlug: string;
  topicTitle: string;
  masteryScore: number;
  masteryLevel: "early" | "developing" | "proficient";
  recentAttempts: number;
  trendDelta: number;
  trendDirection: "improving" | "steady" | "declining";
  lastPracticedAt: string | null;
  weakTags: string[];
}

export interface LearnerProgressDashboard {
  topicMastery: TopicMasteryRecord[];
  recentlyPracticed: TopicMasteryRecord[];
  weakSkills: SkillMasteryRecord[];
  totalAttempts: number;
  averageRecentScore: number;
}
