import { ScenarioQuestionRecord } from "@/features/tutoring/data/types";
import { NumericEvaluation } from "@/features/tutoring/evaluation/types";

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function isNumericRequired(responseFormat: ScenarioQuestionRecord["responseFormat"]) {
  return responseFormat === "numeric" || responseFormat === "mixed";
}

export function evaluateNumericAnswer(
  question: ScenarioQuestionRecord,
  numericAnswer: number | null | undefined
): NumericEvaluation {
  const required = isNumericRequired(question.responseFormat);

  if (!required) {
    return {
      required: false,
      hasAnswer: false,
      expectedAnswer: null,
      tolerance: null,
      answer: null,
      delta: null,
      isCorrect: null,
      score: 1,
    };
  }

  const expectedAnswer = question.numericAnswer;
  const tolerance = question.numericTolerance ?? 0;
  const hasAnswer = typeof numericAnswer === "number" && Number.isFinite(numericAnswer);

  if (!hasAnswer) {
    return {
      required: true,
      hasAnswer: false,
      expectedAnswer,
      tolerance,
      answer: null,
      delta: null,
      isCorrect: false,
      score: 0,
    };
  }

  const safeAnswer = numericAnswer as number;

  if (typeof expectedAnswer !== "number") {
    return {
      required: true,
      hasAnswer: true,
      expectedAnswer: null,
      tolerance,
      answer: safeAnswer,
      delta: null,
      isCorrect: null,
      score: 0.7,
    };
  }

  const delta = Math.abs(safeAnswer - expectedAnswer);
  const isCorrect = delta <= tolerance;

  const relativeError = delta / Math.max(Math.abs(expectedAnswer), 1);
  const score = isCorrect ? 1 : clamp(1 - relativeError * 1.7);

  return {
    required: true,
    hasAnswer: true,
    expectedAnswer,
    tolerance,
    answer: safeAnswer,
    delta,
    isCorrect,
    score,
  };
}
