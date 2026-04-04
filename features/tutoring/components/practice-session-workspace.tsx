"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  FeedbackApiRequest,
  FeedbackApiResponse,
  HintApiRequest,
  HintApiResponse,
  SubmittedAnswerPayload,
} from "@/features/tutoring/ai/contracts";
import { FeedbackResponse } from "@/features/tutoring/ai/types";
import { AnswerForm } from "@/features/tutoring/components/answer-form";
import { FeedbackCard } from "@/features/tutoring/components/feedback-card";
import { ScenarioCard } from "@/features/tutoring/components/scenario-card";
import { TopicBadge } from "@/features/tutoring/components/topic-badge";
import { ScenarioRecord, TopicSummary } from "@/features/tutoring/data/types";
import { recordPracticeAttempt } from "@/features/tutoring/progress/progress-store";

interface PracticeSessionWorkspaceProps {
  topics: TopicSummary[];
  scenarios: ScenarioRecord[];
  initialTopicSlug: string;
}

function toNextStepLabel(step: FeedbackResponse["recommendedNextStep"]) {
  if (step === "advance") {
    return "Great work. Move to a harder scenario in this topic.";
  }

  if (step === "repeat") {
    return "Solid progress. Repeat a similar scenario to lock in your process.";
  }

  return "Review this concept with hints before increasing difficulty.";
}

function toStrategyLabel(strategy: FeedbackApiResponse["adaptiveRecommendation"]["strategy"]) {
  if (strategy === "remediation") {
    return "Remediation";
  }
  if (strategy === "scaffold") {
    return "Scaffolded";
  }
  if (strategy === "advance") {
    return "Advance";
  }
  return "Reinforce";
}

export function PracticeSessionWorkspace({
  topics,
  scenarios,
  initialTopicSlug,
}: PracticeSessionWorkspaceProps) {
  const searchParams = useSearchParams();
  const topicSlugs = useMemo(() => topics.map((topic) => topic.slug), [topics]);
  const requestedTopicSlug = searchParams.get("topic");
  const safeInitialTopic =
    requestedTopicSlug && topicSlugs.includes(requestedTopicSlug)
      ? requestedTopicSlug
      : initialTopicSlug;

  const [topicSlug, setTopicSlug] = useState(safeInitialTopic);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adaptiveRecommendation, setAdaptiveRecommendation] =
    useState<FeedbackApiResponse["adaptiveRecommendation"] | null>(null);
  const [sessionSummary, setSessionSummary] =
    useState<FeedbackApiResponse["sessionSummary"] | null>(null);

  const topic = useMemo(
    () => topics.find((candidate) => candidate.slug === topicSlug) ?? topics[0] ?? null,
    [topics, topicSlug]
  );

  const scenariosForTopic = useMemo(
    () =>
      scenarios
        .filter((scenario) => scenario.topic.slug === topicSlug)
        .sort((left, right) => left.displayOrder - right.displayOrder),
    [scenarios, topicSlug]
  );

  const scenario = scenariosForTopic[scenarioIndex] ?? scenariosForTopic[0] ?? null;

  useEffect(() => {
    if (
      requestedTopicSlug &&
      topicSlugs.includes(requestedTopicSlug) &&
      requestedTopicSlug !== topicSlug
    ) {
      setTopicSlug(requestedTopicSlug);
      setScenarioIndex(0);
      setFeedback(null);
      setError(null);
      setSessionId(null);
      setAdaptiveRecommendation(null);
      setSessionSummary(null);
    }
  }, [requestedTopicSlug, topicSlugs, topicSlug]);

  const hasSuggestedScenario = Boolean(adaptiveRecommendation);

  const handleTopicChange = (value: string) => {
    setTopicSlug(value);
    setScenarioIndex(0);
    setFeedback(null);
    setError(null);
    setSessionId(null);
    setAdaptiveRecommendation(null);
    setSessionSummary(null);
  };

  const handleCycleScenario = () => {
    if (scenariosForTopic.length <= 1) {
      return;
    }

    setScenarioIndex((current) => (current + 1) % scenariosForTopic.length);
    setFeedback(null);
    setError(null);
    setAdaptiveRecommendation(null);
    setSessionSummary(null);
  };

  const handleSubmit = async (answers: SubmittedAnswerPayload[]) => {
    if (!topic || !scenario) {
      setError("No scenario is available for this topic yet.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: FeedbackApiRequest = {
        topicSlug: topic.slug,
        scenarioId: scenario.id,
        sessionId,
        answers,
      };

      const response = await fetch("/api/tutoring/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorPayload?.error ?? "Unable to evaluate your answers right now.");
      }

      const data = (await response.json()) as FeedbackApiResponse;
      setSessionId(data.sessionId);
      setFeedback(data.feedback);
      setAdaptiveRecommendation(data.adaptiveRecommendation);
      setSessionSummary(data.sessionSummary);

      recordPracticeAttempt({
        topicId: topic.slug,
        scenarioId: scenario.id,
        score: data.feedback.score,
        numericCorrect: data.feedback.numericCorrect,
        summary: data.feedback.summary,
        recommendedNextStep: data.feedback.recommendedNextStep,
        aiMode: data.feedback.mode,
        submittedAt: data.submittedAt,
      });
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while evaluating your answers."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestHint = async ({
    questionId,
    requestedHintLevel,
  }: {
    questionId: string;
    requestedHintLevel: number;
  }): Promise<HintApiResponse> => {
    if (!scenario) {
      throw new Error("No scenario loaded.");
    }

    const payload: HintApiRequest = {
      scenarioId: scenario.id,
      questionId,
      hintLevel: requestedHintLevel,
    };

    const response = await fetch("/api/tutoring/hint", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(errorPayload?.error ?? "Unable to fetch a hint.");
    }

    return (await response.json()) as HintApiResponse;
  };

  const handleContinue = () => {
    if (!adaptiveRecommendation) {
      return;
    }

    const nextTopicIndex = topics.findIndex(
      (candidate) => candidate.slug === adaptiveRecommendation.nextTopicSlug
    );

    const effectiveTopicSlug =
      nextTopicIndex >= 0 ? topics[nextTopicIndex].slug : topicSlug;
    const scenariosForRecommendedTopic = scenarios
      .filter((item) => item.topic.slug === effectiveTopicSlug)
      .sort((left, right) => left.displayOrder - right.displayOrder);

    const nextScenarioIdx = scenariosForRecommendedTopic.findIndex(
      (item) => item.id === adaptiveRecommendation.nextScenarioId
    );

    setTopicSlug(effectiveTopicSlug);
    setScenarioIndex(nextScenarioIdx >= 0 ? nextScenarioIdx : 0);
    setFeedback(null);
    setError(null);
    setAdaptiveRecommendation(null);
    setSessionSummary(null);
  };

  if (!topic || !scenario) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">No scenarios available</h2>
        <p className="mt-2 text-sm text-slate-600">
          Seed your database or verify topic mappings to load practice content.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Session setup
            </p>
            <label className="mt-2 block text-sm font-medium text-slate-700">
              Topic
              <select
                className="mt-1.5 w-full min-w-[220px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                value={topic.slug}
                onChange={(event) => handleTopicChange(event.target.value)}
              >
                {topics.map((candidate) => (
                  <option key={candidate.id} value={candidate.slug}>
                    {candidate.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Scenario</p>
            <p className="text-sm font-semibold text-slate-900">
              {Math.min(scenarioIndex + 1, scenariosForTopic.length)} of {scenariosForTopic.length}
            </p>
            <TopicBadge className="mt-2">Adaptive sequencing enabled</TopicBadge>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleCycleScenario}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
          >
            Load another scenario
          </button>
          {isSubmitting && (
            <span className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-700">
              Evaluating your answers...
            </span>
          )}
        </div>
      </section>

      <ScenarioCard scenario={scenario} />

      <AnswerForm
        scenario={scenario}
        disabled={isSubmitting}
        onSubmit={handleSubmit}
        onRequestHint={handleRequestHint}
      />

      {error && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-4 shadow-sm">
          <p className="text-sm font-medium text-rose-900">Unable to complete this action</p>
          <p className="mt-1 text-sm text-rose-800">{error}</p>
        </section>
      )}

      {feedback && (
        <>
          <FeedbackCard feedback={feedback} />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-900">Recommended next step</p>
            <p className="mt-1 text-sm text-slate-600">
              {toNextStepLabel(feedback.recommendedNextStep)}
            </p>
            {adaptiveRecommendation && (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <TopicBadge variant="intermediate">
                    {toStrategyLabel(adaptiveRecommendation.strategy)}
                  </TopicBadge>
                </div>
                <p className="mt-2 text-sm text-slate-700">{adaptiveRecommendation.reason}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Next: {adaptiveRecommendation.nextTopicTitle} - {adaptiveRecommendation.nextScenarioTitle}
                </p>
              </>
            )}
            {hasSuggestedScenario && (
              <button
                type="button"
                onClick={handleContinue}
                className="mt-3 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Load recommended scenario
              </button>
            )}
          </section>

          {sessionSummary && (
            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900">Session summary</h4>
              <p className="mt-2 text-sm font-medium text-slate-800">What you did well</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {sessionSummary.whatWentWell.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm font-medium text-slate-800">What to practice next</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-600">
                {sessionSummary.whatToPracticeNext.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm text-slate-700">
                Recommended next topic: {sessionSummary.recommendedNextTopic}
              </p>
              <p className="text-sm text-slate-700">
                Recommended scenario: {sessionSummary.recommendedNextScenario}
              </p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
