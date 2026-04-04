import { NextResponse } from "next/server";
import {
  FeedbackApiRequest,
  FeedbackApiResponse,
  SubmittedAnswerPayload,
} from "@/features/tutoring/ai/contracts";
import { createTutoringAiProvider } from "@/features/tutoring/ai/provider";
import {
  createTutoringAttempt,
  createTutoringFeedbackHistory,
  fetchLearnerSkillMastery,
  fetchScenarioById,
  fetchScenariosByFilters,
  startTutoringSession,
  updateLearnerProgressFromAttempt,
} from "@/features/tutoring/data/server";
import { evaluatePracticeSubmission } from "@/features/tutoring/evaluation/evaluate-practice-submission";
import { selectAdaptiveRecommendation } from "@/features/tutoring/session/adaptive-engine";
import { requireAuth } from "@/lib/auth";

function isValidSubmittedAnswer(value: unknown): value is SubmittedAnswerPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  if (typeof candidate.questionId !== "string" || candidate.questionId.trim().length === 0) {
    return false;
  }

  if (
    candidate.numericAnswer !== undefined &&
    candidate.numericAnswer !== null &&
    (typeof candidate.numericAnswer !== "number" || !Number.isFinite(candidate.numericAnswer))
  ) {
    return false;
  }

  if (
    candidate.shortTextAnswer !== undefined &&
    candidate.shortTextAnswer !== null &&
    typeof candidate.shortTextAnswer !== "string"
  ) {
    return false;
  }

  if (
    candidate.hintLevel !== undefined &&
    candidate.hintLevel !== null &&
    (typeof candidate.hintLevel !== "number" || !Number.isFinite(candidate.hintLevel))
  ) {
    return false;
  }

  return true;
}

function toSafeAnswer(answer: SubmittedAnswerPayload): SubmittedAnswerPayload {
  return {
    questionId: answer.questionId.trim(),
    numericAnswer:
      typeof answer.numericAnswer === "number" && Number.isFinite(answer.numericAnswer)
        ? answer.numericAnswer
        : null,
    shortTextAnswer:
      typeof answer.shortTextAnswer === "string" ? answer.shortTextAnswer.trim() : null,
    hintLevel:
      typeof answer.hintLevel === "number" && Number.isFinite(answer.hintLevel)
        ? Math.max(0, Math.trunc(answer.hintLevel))
        : 0,
  };
}

export async function POST(request: Request) {
  await requireAuth();

  let body: Partial<FeedbackApiRequest>;
  try {
    body = (await request.json()) as Partial<FeedbackApiRequest>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  if (
    typeof body.topicSlug !== "string" ||
    body.topicSlug.trim().length === 0 ||
    typeof body.scenarioId !== "string" ||
    body.scenarioId.trim().length === 0 ||
    !Array.isArray(body.answers)
  ) {
    return NextResponse.json(
      { error: "topicSlug, scenarioId, and answers[] are required." },
      { status: 400 }
    );
  }

  if (!body.answers.every((answer) => isValidSubmittedAnswer(answer))) {
    return NextResponse.json(
      {
        error:
          "answers[] entries must include questionId and optional numericAnswer, shortTextAnswer, hintLevel.",
      },
      { status: 400 }
    );
  }

  const scenario = await fetchScenarioById(body.scenarioId);
  if (!scenario) {
    return NextResponse.json({ error: "Scenario not found." }, { status: 404 });
  }

  if (scenario.topic.slug !== body.topicSlug.trim()) {
    return NextResponse.json(
      {
        error:
          "The selected topic does not match this scenario. Refresh and try selecting the scenario again.",
      },
      { status: 400 }
    );
  }

  if (scenario.questions.length === 0) {
    return NextResponse.json(
      { error: "Scenario has no questions configured." },
      { status: 409 }
    );
  }

  const answers = body.answers.map(toSafeAnswer);
  const sessionId =
    typeof body.sessionId === "string" && body.sessionId.trim().length > 0
      ? body.sessionId
      : (await startTutoringSession({
          topicSlug: scenario.topic.slug,
          metadata: { source: "practice_api_feedback" },
        })).id;

  const evaluation = evaluatePracticeSubmission({
    scenario,
    topicSlug: scenario.topic.slug,
    answers,
  });

  const provider = createTutoringAiProvider();
  const providerFeedback = await provider.getFeedback({
    topicSlug: scenario.topic.slug,
    topicTitle: scenario.topic.title,
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    scenarioContext: scenario.businessContext,
    evaluatedQuestions: evaluation.evaluatedQuestions.map((item) => ({
      questionId: item.question.id,
      prompt: item.question.prompt,
      responseFormat: item.question.responseFormat,
      numericRequired: item.numeric.required,
      numericCorrect: item.numeric.isCorrect,
      numericDelta: item.numeric.delta,
      explanationRequired: item.explanation.required,
      explanationScore: item.explanation.score,
      answerText: item.explanation.answer,
      misconceptionTags: item.misconceptionTags,
      hintLevelUsed: item.answer.hintLevel ?? 0,
      score: item.score,
    })),
  });

  const feedback = {
    ...providerFeedback,
    score: evaluation.score,
    numericCorrect: evaluation.numericCorrect,
    misconceptionTags: Array.from(
      new Set([...providerFeedback.misconceptionTags, ...evaluation.misconceptionTags])
    ),
    recommendedNextStep: evaluation.recommendedNextStep,
  } as const;

  const questionFeedbackById = new Map(
    feedback.questionFeedback.map((questionFeedback) => [questionFeedback.questionId, questionFeedback])
  );

  const attempts = await Promise.all(
    evaluation.evaluatedQuestions.map((evaluatedQuestion) =>
      createTutoringAttempt({
        sessionId,
        scenarioId: scenario.id,
        questionId: evaluatedQuestion.question.id,
        numericAnswer: evaluatedQuestion.answer.numericAnswer ?? null,
        shortTextAnswer: evaluatedQuestion.answer.shortTextAnswer ?? null,
        correctnessScore: evaluatedQuestion.score,
        isNumericCorrect: evaluatedQuestion.numeric.required
          ? evaluatedQuestion.numeric.isCorrect === true
          : null,
        misconceptionTags: evaluatedQuestion.misconceptionTags,
        metadata: {
          hintLevel: evaluatedQuestion.answer.hintLevel ?? 0,
          responseFormat: evaluatedQuestion.question.responseFormat,
          numericDelta: evaluatedQuestion.numeric.delta,
          explanationScore: evaluatedQuestion.explanation.score,
        },
      })
    )
  );

  await Promise.all(
    attempts.map((attempt) => {
      const questionFeedback = questionFeedbackById.get(attempt.question_id as string);
      return createTutoringFeedbackHistory({
        attemptId: attempt.id as string,
        providerMode: feedback.mode,
        modelName: feedback.mode === "real" ? (process.env.OPENAI_MODEL ?? null) : null,
        feedbackSummary: questionFeedback?.whyItWasWrong ?? feedback.summary,
        strengths: questionFeedback ? [questionFeedback.whatWasCorrect] : feedback.strengths,
        improvements: questionFeedback
          ? [questionFeedback.whatWasWrong, questionFeedback.whyItWasWrong]
          : feedback.improvements,
        recommendedNextStep: feedback.recommendedNextStep,
        hintProvided: questionFeedback?.hint ?? feedback.hint,
        score: feedback.score,
        rawFeedback: {
          overall: feedback,
          question: questionFeedback ?? null,
        },
      });
    })
  );

  await Promise.all(attempts.map((attempt) => updateLearnerProgressFromAttempt(attempt.id as string)));

  const [allScenarios, skillMastery] = await Promise.all([
    fetchScenariosByFilters(),
    fetchLearnerSkillMastery(),
  ]);

  const adaptiveRecommendation = selectAdaptiveRecommendation({
    currentScenario: scenario,
    availableScenarios: allScenarios,
    skillMastery,
    submissionScore: evaluation.score,
    submissionMisconceptionTags: evaluation.misconceptionTags,
  });

  const sessionSummary = {
    whatWentWell: feedback.strengths.slice(0, 2),
    whatToPracticeNext: [
      feedback.improvements[0] ?? "Review the core formula and units before retrying.",
      adaptiveRecommendation.reason,
    ],
    recommendedNextTopic: adaptiveRecommendation.nextTopicTitle,
    recommendedNextScenario: adaptiveRecommendation.nextScenarioTitle,
  };

  const submittedAt =
    attempts[0]?.submitted_at && typeof attempts[0].submitted_at === "string"
      ? attempts[0].submitted_at
      : new Date().toISOString();

  const response: FeedbackApiResponse = {
    sessionId,
    submittedAt,
    attemptsCreated: attempts.length,
    feedback,
    adaptiveRecommendation,
    sessionSummary,
  };

  return NextResponse.json(response);
}
