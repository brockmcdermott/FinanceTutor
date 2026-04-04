import { ScenarioRecord } from "@/features/tutoring/data/types";
import { evaluateExplanation } from "@/features/tutoring/evaluation/explanation";
import { detectMisconceptionTags } from "@/features/tutoring/evaluation/misconceptions";
import { evaluateNumericAnswer } from "@/features/tutoring/evaluation/numeric";
import {
  SubmissionEvaluation,
  SubmittedQuestionAnswer,
  EvaluatedQuestion,
} from "@/features/tutoring/evaluation/types";

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function getRecommendedNextStep(score: number): SubmissionEvaluation["recommendedNextStep"] {
  if (score >= 0.8) {
    return "advance";
  }

  if (score >= 0.55) {
    return "repeat";
  }

  return "review";
}

export function evaluatePracticeSubmission({
  scenario,
  topicSlug,
  answers,
}: {
  scenario: ScenarioRecord;
  topicSlug: string;
  answers: SubmittedQuestionAnswer[];
}): SubmissionEvaluation {
  const answerMap = new Map(answers.map((answer) => [answer.questionId, answer]));

  const evaluatedQuestions: EvaluatedQuestion[] = scenario.questions.map((question) => {
    const answer =
      answerMap.get(question.id) ??
      ({ questionId: question.id, shortTextAnswer: "", numericAnswer: null } satisfies SubmittedQuestionAnswer);

    const numeric = evaluateNumericAnswer(question, answer.numericAnswer);
    const explanation = evaluateExplanation(question, topicSlug, answer.shortTextAnswer);

    const score = clamp(
      (numeric.required ? numeric.score * 0.65 : 0.35) +
        (explanation.required ? explanation.score * 0.35 : 0.65)
    );

    const isCorrect =
      (numeric.required ? numeric.isCorrect === true : true) &&
      (explanation.required ? explanation.score >= 0.6 : true);

    const provisionalQuestion: EvaluatedQuestion = {
      question,
      answer,
      numeric,
      explanation,
      misconceptionTags: [],
      isCorrect,
      score,
    };

    const misconceptionTags = detectMisconceptionTags(topicSlug, provisionalQuestion);

    return {
      ...provisionalQuestion,
      misconceptionTags,
    };
  });

  const score =
    evaluatedQuestions.length > 0
      ? evaluatedQuestions.reduce((sum, question) => sum + question.score, 0) /
        evaluatedQuestions.length
      : 0;

  const numericCorrect = evaluatedQuestions.every((question) =>
    question.numeric.required ? question.numeric.isCorrect === true : true
  );

  const misconceptionTags = Array.from(
    new Set(evaluatedQuestions.flatMap((question) => question.misconceptionTags))
  );

  return {
    scenario,
    topicSlug,
    topicTitle: scenario.topic.title,
    evaluatedQuestions,
    score,
    numericCorrect,
    misconceptionTags,
    recommendedNextStep: getRecommendedNextStep(score),
  };
}
