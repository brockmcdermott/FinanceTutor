import { FeedbackResponse } from "@/features/tutoring/ai/types";

export interface FeedbackApiRequest {
  topicId: string;
  scenarioId: string;
  numericAnswer?: number;
  writtenAnswer: string;
}

export interface FeedbackApiResponse {
  feedback: FeedbackResponse;
}
