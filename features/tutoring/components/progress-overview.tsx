"use client";

import { useEffect, useMemo, useState } from "react";
import { financeTopics } from "@/features/tutoring/config/topics";
import {
  LearnerProgressSnapshot,
  readProgress,
  toTopicProgress,
} from "@/features/tutoring/progress/progress-store";
import { ProgressSummaryCard } from "@/features/tutoring/components/progress-summary-card";

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function ProgressOverview() {
  const [snapshot, setSnapshot] = useState<LearnerProgressSnapshot>({ attempts: [] });

  useEffect(() => {
    setSnapshot(readProgress());
  }, []);

  const topicProgress = useMemo(
    () => toTopicProgress(snapshot, financeTopics.map((topic) => topic.id)),
    [snapshot]
  );

  const totals = useMemo(() => {
    const attempts = snapshot.attempts.length;
    const averageScore =
      attempts > 0
        ? snapshot.attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts
        : 0;
    const proficientTopics = topicProgress.filter((topic) => topic.mastery === "proficient").length;

    return { attempts, averageScore, proficientTopics };
  }, [snapshot, topicProgress]);

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <ProgressSummaryCard
          label="Total Attempts"
          value={String(totals.attempts)}
          caption="Across all topics"
        />
        <ProgressSummaryCard
          label="Average Score"
          value={toPercent(totals.averageScore)}
          caption="Rolling recent performance"
          tone="focus"
        />
        <ProgressSummaryCard
          label="Proficient Topics"
          value={`${totals.proficientTopics}/${financeTopics.length}`}
          caption="Topics with 80%+ average"
          tone="positive"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Topic mastery</h2>
        <div className="mt-4 space-y-3">
          {topicProgress.map((topic) => {
            const topicMeta = financeTopics.find((item) => item.id === topic.topicId);
            const progressPercent = Math.round(topic.averageScore * 100);

            return (
              <article key={topic.topicId} className="rounded-xl border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{topicMeta?.title ?? topic.topicId}</p>
                    <p className="text-xs text-slate-500">
                      {topic.attempts} attempts · {topic.mastery} mastery
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-700">{progressPercent}%</p>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900 transition-all"
                    style={{ width: `${Math.max(4, progressPercent)}%` }}
                  />
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
