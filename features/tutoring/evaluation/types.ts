import { ScenarioQuestionRecord, ScenarioRecord } from "@/features/tutoring/data/types";

export interface SubmittedQuestionAnswer {
  questionId: string;
  numericAnswer?: number | null;
  shortTextAnswer?: string | null;
  hintLevel?: number;
}

export interface NumericEvaluation {
  required: boolean;
  hasAnswer: boolean;
  expectedAnswer: number | null;
  tolerance: number | null;
  answer: number | null;
  delta: number | null;
  isCorrect: boolean | null;
  score: number;
}

export interface ExplanationEvaluation {
  required: boolean;
  hasAnswer: boolean;
  answer: string;
  lengthScore: number;
  keywordScore: number;
  reasoningScore: number;
  score: number;
}

export interface EvaluatedQuestion {
  question: ScenarioQuestionRecord;
  answer: SubmittedQuestionAnswer;
  numeric: NumericEvaluation;
  explanation: ExplanationEvaluation;
  misconceptionTags: string[];
  isCorrect: boolean;
  score: number;
}

export interface SubmissionEvaluation {
  scenario: ScenarioRecord;
  topicSlug: string;
  topicTitle: string;
  evaluatedQuestions: EvaluatedQuestion[];
  score: number;
  numericCorrect: boolean;
  misconceptionTags: string[];
  recommendedNextStep: "advance" | "repeat" | "review";
}
