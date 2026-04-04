export type TutoringAiMode = "mock" | "real";

export interface FeedbackRequest {
  topicId: string;
  scenarioId: string;
  scenarioPrompt: string;
  expectedNumericAnswer?: number;
  acceptedNumericTolerance?: number;
  hint: string;
  numericAnswer?: number;
  writtenAnswer: string;
}

export interface FeedbackResponse {
  mode: TutoringAiMode;
  score: number;
  numericCorrect: boolean;
  summary: string;
  strengths: string[];
  improvements: string[];
  hint: string;
  recommendedNextStep: "advance" | "repeat" | "review";
}

export interface TutoringAiProvider {
  getFeedback(request: FeedbackRequest): Promise<FeedbackResponse>;
}
