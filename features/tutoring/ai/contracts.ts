import { FeedbackResponse } from "@/features/tutoring/ai/types";

export interface SubmittedAnswerPayload {
  questionId: string;
  numericAnswer?: number | null;
  shortTextAnswer?: string | null;
  hintLevel?: number;
}

export interface FeedbackApiRequest {
  topicSlug: string;
  scenarioId: string;
  sessionId?: string | null;
  answers: SubmittedAnswerPayload[];
}

export interface FeedbackApiResponse {
  sessionId: string;
  submittedAt: string;
  attemptsCreated: number;
  feedback: FeedbackResponse;
  adaptiveRecommendation: {
    strategy: "remediation" | "scaffold" | "reinforce" | "advance";
    reason: string;
    nextScenarioId: string;
    nextScenarioTitle: string;
    nextTopicSlug: string;
    nextTopicTitle: string;
    targetSkillSlug: string | null;
    targetSkillName: string | null;
  };
  sessionSummary: {
    whatWentWell: string[];
    whatToPracticeNext: string[];
    recommendedNextTopic: string;
    recommendedNextScenario: string;
  };
}

export interface HintApiRequest {
  scenarioId: string;
  questionId: string;
  hintLevel?: number;
}

export interface HintApiResponse {
  questionId: string;
  hintLevel: number;
  hint: string;
}
