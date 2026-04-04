import Link from "next/link";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { TopicBadge } from "@/features/tutoring/components/topic-badge";
import { financeTopics } from "@/features/tutoring/config/topics";

export default async function TopicsPage() {
  return ProtectedTutoringPage({
    currentPath: "/topics",
    title: "Topics",
    description:
      "Explore foundational business finance concepts with scenario-driven prompts and stepwise feedback.",
    children: (
      <section className="grid gap-4 sm:grid-cols-2">
        {financeTopics.map((topic) => (
          <article key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{topic.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{topic.summary}</p>
              </div>
              <TopicBadge>#{topic.order}</TopicBadge>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {topic.tags.map((tag) => (
                <TopicBadge key={tag}>{tag}</TopicBadge>
              ))}
            </div>

            <p className="mt-4 text-sm text-slate-600">
              {topic.scenarios.length} scenario{topic.scenarios.length === 1 ? "" : "s"} configured.
            </p>

            <Link
              href={`/practice?topic=${topic.id}`}
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Practice this topic
            </Link>
          </article>
        ))}
      </section>
    ),
  });
}
