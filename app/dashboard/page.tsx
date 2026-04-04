import Link from "next/link";
import { getTutoringAiRuntimeStatus } from "@/features/tutoring/ai/provider";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { ProgressSummaryCard } from "@/features/tutoring/components/progress-summary-card";
import { TopicBadge } from "@/features/tutoring/components/topic-badge";
import {
  fetchAvailableTopics,
  fetchLearnerProgressDashboard,
} from "@/features/tutoring/data/server";

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export default async function DashboardPage() {
  const aiStatus = getTutoringAiRuntimeStatus();

  try {
    const [topics, learnerDashboard] = await Promise.all([
      fetchAvailableTopics(),
      fetchLearnerProgressDashboard(),
    ]);

    const recommendedTopic =
      learnerDashboard.topicMastery
        .filter((topic) => topic.recentAttempts > 0)
        .sort((left, right) => left.masteryScore - right.masteryScore)[0] ??
      learnerDashboard.topicMastery[0] ??
      null;

    return ProtectedTutoringPage({
      currentPath: "/dashboard",
      title: "Home Dashboard",
      description:
        "Track progress, continue your adaptive practice flow, and show your tutoring prototype in one clean walkthrough.",
      children: (
        <>
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-5 text-white shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">
              Welcome Back
            </p>
            <h2 className="mt-3 text-2xl font-semibold sm:text-3xl">
              Continue adaptive finance practice
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-200 sm:text-base">
              Your tutor combines numeric checking, explanation coaching, misconception tracking,
              and rule-based sequencing to pick what comes next.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href={recommendedTopic ? `/practice?topic=${recommendedTopic.topicSlug}` : "/practice"}
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
              >
                Continue learning
              </Link>
              <Link
                href="/review"
                className="rounded-xl border border-slate-400 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-slate-200"
              >
                Review latest results
              </Link>
            </div>
          </section>

          <section className="grid gap-3 sm:grid-cols-3">
            <ProgressSummaryCard
              label="Topics Available"
              value={String(topics.length)}
              caption="Seeded and ready for demo"
              tone="focus"
            />
            <ProgressSummaryCard
              label="Practice Mode"
              value={aiStatus.mode === "mock" ? "Mock" : "Real"}
              caption={aiStatus.mode === "real" ? aiStatus.configuredModel : "Fallback-safe mode"}
              tone={aiStatus.mode === "real" ? "positive" : "neutral"}
            />
            <ProgressSummaryCard
              label="Average Score"
              value={toPercent(learnerDashboard.averageRecentScore)}
              caption="Recent attempts"
              tone="positive"
            />
          </section>

          <section className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-slate-900">Topic overview</h3>
                <Link href="/topics" className="text-sm font-medium text-slate-700 hover:underline">
                  View all topics
                </Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {learnerDashboard.topicMastery.slice(0, 6).map((topic) => (
                  <article key={topic.topicId} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-900">{topic.topicTitle}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {topic.recentAttempts} attempts • {topic.masteryLevel}
                    </p>
                    <div className="mt-2 h-2 rounded-full bg-slate-100">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{ width: `${Math.max(5, Math.round(topic.masteryScore * 100))}%` }}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <h3 className="text-lg font-semibold text-slate-900">Recent activity</h3>
              <div className="mt-3 space-y-2">
                {learnerDashboard.recentlyPracticed.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-300 p-3 text-sm text-slate-600">
                    No recent attempts yet. Run one practice submission to populate activity.
                  </p>
                )}
                {learnerDashboard.recentlyPracticed.map((topic) => (
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
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Progress snapshot</p>
              <p className="mt-1 text-sm text-slate-600">
                Weakest skill signal:{" "}
                {learnerDashboard.weakSkills[0]?.skillName ??
                  learnerDashboard.weakSkills[0]?.skillSlug ??
                  "No weak skill identified yet"}
              </p>
              {learnerDashboard.weakSkills[0]?.misconceptionTags?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {learnerDashboard.weakSkills[0].misconceptionTags.slice(0, 2).map((tag) => (
                    <TopicBadge key={`weak-tag-${tag}`} variant="foundation">
                      {tag.replaceAll("_", " ")}
                    </TopicBadge>
                  ))}
                </div>
              ) : null}
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">Continue learning</p>
              <p className="mt-1 text-sm text-slate-600">
                {recommendedTopic
                  ? `Recommended focus: ${recommendedTopic.topicTitle}.`
                  : "Choose any topic to start your first adaptive session."}
              </p>
              <Link
                href={recommendedTopic ? `/practice?topic=${recommendedTopic.topicSlug}` : "/practice"}
                className="mt-3 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Start practice session
              </Link>
            </article>
          </section>
        </>
      ),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to load dashboard analytics right now.";

    return ProtectedTutoringPage({
      currentPath: "/dashboard",
      title: "Home Dashboard",
      description:
        "Start a finance practice session, review outcomes, and continue building accounting intuition.",
      children: (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-rose-900">Dashboard temporarily unavailable</h2>
          <p className="mt-2 text-sm text-rose-800">{errorMessage}</p>
          <Link
            href="/practice"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Open practice anyway
          </Link>
        </section>
      ),
    });
  }
}
