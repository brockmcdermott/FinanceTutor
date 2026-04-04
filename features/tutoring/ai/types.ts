export type TutoringAiMode = "mock" | "real";

export interface EvaluatedQuestionForAi {
  questionId: string;
  prompt: string;
  responseFormat: "numeric" | "short_text" | "mixed";
  numericRequired: boolean;
  numericCorrect: boolean | null;
  numericDelta: number | null;
  explanationRequired: boolean;
  explanationScore: number;
  answerText: string;
  misconceptionTags: string[];
  hintLevelUsed: number;
  score: number;
}

export interface FeedbackRequest {
  topicSlug: string;
  topicTitle: string;
  scenarioId: string;
  scenarioTitle: string;
  scenarioContext: string;
  evaluatedQuestions: EvaluatedQuestionForAi[];
}

export interface QuestionFeedbackResponse {
  questionId: string;
  prompt: string;
  isCorrect: boolean;
  whatWasCorrect: string;
  whatWasWrong: string;
  whyItWasWrong: string;
  hint: string;
  followUpQuestion: string;
  misconceptionTags: string[];
}

export interface FeedbackResponse {
  mode: TutoringAiMode;
  score: number;
  numericCorrect: boolean;
  summary: string;
  strengths: string[];
  improvements: string[];
  hint: string;
  followUpQuestion: string;
  misconceptionTags: string[];
  questionFeedback: QuestionFeedbackResponse[];
  recommendedNextStep: "advance" | "repeat" | "review";
}

export interface TutoringAiProvider {
  getFeedback(request: FeedbackRequest): Promise<FeedbackResponse>;
}
