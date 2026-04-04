import Link from "next/link";
import { getTutoringAiMode } from "@/features/tutoring/ai/provider";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { ProgressSummaryCard } from "@/features/tutoring/components/progress-summary-card";
import { TopicBadge } from "@/features/tutoring/components/topic-badge";
import { fetchAvailableTopics } from "@/features/tutoring/data/server";

export default async function DashboardPage() {
  const topics = await fetchAvailableTopics();
  const aiMode = getTutoringAiMode();

  return ProtectedTutoringPage({
    currentPath: "/dashboard",
    title: "Home Dashboard",
    description:
      "Start a finance practice session, review recent outcomes, and continue building core accounting intuition.",
    children: (
      <>
        <section className="grid gap-3 sm:grid-cols-3">
          <ProgressSummaryCard
            label="Topics Available"
            value={String(topics.length)}
            caption="Config-driven and easy to extend"
            tone="focus"
          />
          <ProgressSummaryCard
            label="Practice Mode"
            value={aiMode === "mock" ? "Mock" : "Real"}
            caption="Switchable with env configuration"
          />
          <ProgressSummaryCard
            label="Session Format"
            value="Mixed"
            caption="Numeric + written responses"
            tone="positive"
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Continue learning</h2>
              <p className="mt-1 text-sm text-slate-600">
                Pick a topic and launch adaptive scenario practice.
              </p>
            </div>
            <Link
              href="/practice"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Start practice session
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {topics.map((topic) => (
              <TopicBadge key={topic.id}>{topic.title}</TopicBadge>
            ))}
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <Link
            href="/review"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-sm font-semibold text-slate-900">Review / Results</p>
            <p className="mt-1 text-sm text-slate-600">Inspect your latest feedback and submission history.</p>
          </Link>
          <Link
            href="/progress"
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300"
          >
            <p className="text-sm font-semibold text-slate-900">Progress</p>
            <p className="mt-1 text-sm text-slate-600">Track mastery and attempts by finance topic.</p>
          </Link>
        </section>
      </>
    ),
  });
}
