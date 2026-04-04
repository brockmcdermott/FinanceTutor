import { ProgressSummaryCard } from "@/features/tutoring/components/progress-summary-card";
import { TopicBadge } from "@/features/tutoring/components/topic-badge";
import { LearnerProgressDashboard } from "@/features/tutoring/data/types";

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function trendLabel(direction: "improving" | "steady" | "declining") {
  if (direction === "improving") {
    return "Improving";
  }

  if (direction === "declining") {
    return "Needs attention";
  }

  return "Steady";
}

export function ProgressDashboard({ dashboard }: { dashboard: LearnerProgressDashboard }) {
  const improvingTopics = dashboard.topicMastery.filter(
    (topic) => topic.trendDirection === "improving"
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <ProgressSummaryCard
          label="Total Attempts"
          value={String(dashboard.totalAttempts)}
          caption="Stored in learner model tables"
        />
        <ProgressSummaryCard
          label="Average Score"
          value={toPercent(dashboard.averageRecentScore)}
          caption="Most recent scored attempts"
          tone="focus"
        />
        <ProgressSummaryCard
          label="Improving Topics"
          value={String(improvingTopics)}
          caption="Positive recent trend detected"
          tone="positive"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-slate-900">Topic mastery</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {dashboard.topicMastery.map((topic) => {
            const progressPercent = Math.round(topic.masteryScore * 100);

            return (
              <article key={topic.topicId} className="rounded-xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{topic.topicTitle}</p>
                    <p className="text-xs text-slate-500">
                      {topic.recentAttempts} attempts - {topic.masteryLevel}
                    </p>
                  </div>
                  <TopicBadge>{trendLabel(topic.trendDirection)}</TopicBadge>
                </div>
                <div className="mt-3 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-2 rounded-full bg-slate-900 transition-all"
                    style={{ width: `${Math.max(4, progressPercent)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">{progressPercent}% mastery confidence</p>
                {topic.weakTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {topic.weakTags.map((tag) => (
                      <TopicBadge key={`${topic.topicId}-${tag}`} variant="foundation">
                        {tag.replaceAll("_", " ")}
                      </TopicBadge>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">Recently practiced</h3>
          <div className="mt-3 space-y-2">
            {dashboard.recentlyPracticed.length === 0 && (
              <p className="text-sm text-slate-600">No completed attempts yet.</p>
            )}
            {dashboard.recentlyPracticed.map((topic) => (
              <div key={`recent-${topic.topicId}`} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">{topic.topicTitle}</p>
                <p className="text-xs text-slate-500">
                  Last practiced{" "}
                  {topic.lastPracticedAt ? new Date(topic.lastPracticedAt).toLocaleString() : "N/A"}
                </p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-base font-semibold text-slate-900">Weak areas to review</h3>
          <div className="mt-3 space-y-2">
            {dashboard.weakSkills.length === 0 && (
              <p className="text-sm text-slate-600">No weak skill signals yet.</p>
            )}
            {dashboard.weakSkills.map((skill) => (
              <div key={`weak-${skill.skillId}`} className="rounded-xl border border-slate-200 p-3">
                <p className="text-sm font-medium text-slate-900">
                  {skill.skillName ?? skill.skillSlug ?? skill.skillId}
                </p>
                <p className="text-xs text-slate-500">
                  Confidence {toPercent(skill.confidenceScore)} - {skill.masteryLevel}
                </p>
                {skill.misconceptionTags.length > 0 && (
                  <p className="mt-1 text-xs text-slate-600">
                    Watch for: {skill.misconceptionTags.slice(0, 2).join(", ").replaceAll("_", " ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
