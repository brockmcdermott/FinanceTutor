"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FeedbackApiRequest, FeedbackApiResponse } from "@/features/tutoring/ai/contracts";
import { FeedbackResponse } from "@/features/tutoring/ai/types";
import { AnswerForm } from "@/features/tutoring/components/answer-form";
import { FeedbackCard } from "@/features/tutoring/components/feedback-card";
import { HintPanel } from "@/features/tutoring/components/hint-panel";
import { ScenarioCard } from "@/features/tutoring/components/scenario-card";
import { TopicBadge } from "@/features/tutoring/components/topic-badge";
import { recordPracticeAttempt } from "@/features/tutoring/progress/progress-store";
import { getNextScenarioIndex } from "@/features/tutoring/session/adaptive-engine";
import { FinanceTopic } from "@/features/tutoring/types";

export function PracticeSessionWorkspace({
  topics,
  initialTopicId,
}: {
  topics: FinanceTopic[];
  initialTopicId: string;
}) {
  const searchParams = useSearchParams();
  const topicIds = useMemo(() => topics.map((topic) => topic.id), [topics]);
  const requestedTopicId = searchParams.get("topic");
  const safeInitialTopic =
    requestedTopicId && topicIds.includes(requestedTopicId) ? requestedTopicId : initialTopicId;

  const [topicId, setTopicId] = useState(safeInitialTopic);
  const [scenarioIndex, setScenarioIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nextScenarioIndex, setNextScenarioIndex] = useState<number | null>(null);

  const topic = useMemo(
    () => topics.find((candidate) => candidate.id === topicId) ?? topics[0],
    [topics, topicId]
  );

  const scenario = topic.scenarios[scenarioIndex] ?? topic.scenarios[0];

  const hasSuggestedScenario =
    typeof nextScenarioIndex === "number" && nextScenarioIndex !== scenarioIndex;

  useEffect(() => {
    if (requestedTopicId && topicIds.includes(requestedTopicId) && requestedTopicId !== topicId) {
      setTopicId(requestedTopicId);
      setScenarioIndex(0);
      setFeedback(null);
      setError(null);
      setNextScenarioIndex(null);
    }
  }, [requestedTopicId, topicIds, topicId]);

  const handleTopicChange = (value: string) => {
    setTopicId(value);
    setScenarioIndex(0);
    setFeedback(null);
    setError(null);
    setNextScenarioIndex(null);
  };

  const handleSubmit = async ({
    numericAnswer,
    writtenAnswer,
  }: {
    numericAnswer?: number;
    writtenAnswer: string;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload: FeedbackApiRequest = {
        topicId: topic.id,
        scenarioId: scenario.id,
        numericAnswer,
        writtenAnswer,
      };

      const response = await fetch("/api/tutoring/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Unable to score your answer right now.");
      }

      const data = (await response.json()) as FeedbackApiResponse;
      setFeedback(data.feedback);

      recordPracticeAttempt({
        topicId: topic.id,
        scenarioId: scenario.id,
        score: data.feedback.score,
        numericCorrect: data.feedback.numericCorrect,
        summary: data.feedback.summary,
        recommendedNextStep: data.feedback.recommendedNextStep,
        aiMode: data.feedback.mode,
        submittedAt: new Date().toISOString(),
      });

      setNextScenarioIndex(
        getNextScenarioIndex(scenarioIndex, topic.scenarios.length, data.feedback.score)
      );
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while scoring your response."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (typeof nextScenarioIndex === "number") {
      setScenarioIndex(nextScenarioIndex);
      setFeedback(null);
      setError(null);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Session setup</p>
            <label className="mt-2 block text-sm font-medium text-slate-700">
              Topic
              <select
                className="mt-1.5 w-full min-w-[220px] rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500"
                value={topic.id}
                onChange={(event) => handleTopicChange(event.target.value)}
              >
                {topics.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-slate-500">Scenario</p>
            <p className="text-sm font-semibold text-slate-900">
              {Math.min(scenarioIndex + 1, topic.scenarios.length)} of {topic.scenarios.length}
            </p>
            <TopicBadge className="mt-2">Adaptive sequencing enabled</TopicBadge>
          </div>
        </div>
      </section>

      <ScenarioCard scenario={scenario} />

      <AnswerForm scenario={scenario} onSubmit={handleSubmit} disabled={isSubmitting} />

      <HintPanel hint={scenario.hint} />

      {error && <p className="text-sm text-rose-600">{error}</p>}

      {feedback && (
        <>
          <FeedbackCard feedback={feedback} />
          <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-900">Recommended next step</p>
            <p className="mt-1 text-sm text-slate-600">
              {feedback.recommendedNextStep === "advance"
                ? "Great work. Move to the next challenge to increase difficulty."
                : feedback.recommendedNextStep === "repeat"
                  ? "Practice one more scenario at this level to build confidence."
                  : "Take a quick review pass before moving ahead."}
            </p>
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
        </>
      )}
    </div>
  );
}
