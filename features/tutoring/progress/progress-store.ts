import { TutoringAiMode } from "@/features/tutoring/ai/types";

export interface PracticeAttempt {
  topicId: string;
  scenarioId: string;
  score: number;
  numericCorrect: boolean;
  summary?: string;
  recommendedNextStep?: "advance" | "repeat" | "review";
  aiMode?: TutoringAiMode;
  submittedAt: string;
}

export interface LearnerProgressSnapshot {
  attempts: PracticeAttempt[];
}

export interface TopicProgress {
  topicId: string;
  attempts: number;
  averageScore: number;
  mastery: "early" | "developing" | "proficient";
  lastPracticedAt?: string;
}

const STORAGE_KEY = "finance-tutor-progress-v1";

const EMPTY_PROGRESS: LearnerProgressSnapshot = {
  attempts: [],
};

export function readProgress(): LearnerProgressSnapshot {
  if (typeof window === "undefined") {
    return EMPTY_PROGRESS;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return EMPTY_PROGRESS;
  }

  try {
    const parsed = JSON.parse(raw) as LearnerProgressSnapshot;
    if (!parsed || !Array.isArray(parsed.attempts)) {
      return EMPTY_PROGRESS;
    }

    return parsed;
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function saveProgress(progress: LearnerProgressSnapshot) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function recordPracticeAttempt(attempt: PracticeAttempt) {
  const current = readProgress();
  const updated = {
    attempts: [...current.attempts, attempt],
  } satisfies LearnerProgressSnapshot;
  saveProgress(updated);
  return updated;
}

export function toTopicProgress(
  progress: LearnerProgressSnapshot,
  topicIds: string[]
): TopicProgress[] {
  return topicIds.map((topicId) => {
    const attempts = progress.attempts
      .filter((attempt) => attempt.topicId === topicId)
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));

    const averageScore =
      attempts.length > 0
        ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length
        : 0;

    const mastery: TopicProgress["mastery"] =
      averageScore >= 0.8 ? "proficient" : averageScore >= 0.55 ? "developing" : "early";

    return {
      topicId,
      attempts: attempts.length,
      averageScore,
      mastery,
      lastPracticedAt: attempts[0]?.submittedAt,
    };
  });
}
