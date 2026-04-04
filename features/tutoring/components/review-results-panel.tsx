"use client";

import { useEffect, useMemo, useState } from "react";
import { financeTopics } from "@/features/tutoring/config/topics";
import { readProgress } from "@/features/tutoring/progress/progress-store";

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function toTopicLabel(topicId: string) {
  return financeTopics.find((topic) => topic.id === topicId)?.title ?? topicId;
}

export function ReviewResultsPanel() {
  const [snapshot, setSnapshot] = useState(() => readProgress());

  useEffect(() => {
    setSnapshot(readProgress());
  }, []);

  const recentAttempts = useMemo(
    () => [...snapshot.attempts].sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)).slice(0, 5),
    [snapshot.attempts]
  );

  if (recentAttempts.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">No results yet</h2>
        <p className="mt-2 text-sm text-slate-600">
          Complete a practice session to populate review history and reflection notes.
        </p>
      </section>
    );
  }

  const latest = recentAttempts[0];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Latest result</h2>
        <p className="mt-1 text-sm text-slate-600">{toTopicLabel(latest.topicId)}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Score</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{toPercent(latest.score)}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">AI mode</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">{latest.aiMode ?? "mock"}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Next step</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {latest.recommendedNextStep ?? "repeat"}
            </p>
          </div>
        </div>

        {latest.summary && <p className="mt-4 text-sm text-slate-700">{latest.summary}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Recent submissions</h3>
        <div className="mt-3 space-y-2">
          {recentAttempts.map((attempt) => (
            <div
              key={`${attempt.scenarioId}-${attempt.submittedAt}`}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{toTopicLabel(attempt.topicId)}</p>
                <p className="text-xs text-slate-500">{new Date(attempt.submittedAt).toLocaleString()}</p>
              </div>
              <p className="text-sm font-semibold text-slate-700">{toPercent(attempt.score)}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
