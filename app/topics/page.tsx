import Link from "next/link";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { TopicBadge } from "@/features/tutoring/components/topic-badge";
import { fetchAvailableTopics, fetchScenariosByFilters } from "@/features/tutoring/data/server";

export default async function TopicsPage() {
  const [topics, scenarios] = await Promise.all([
    fetchAvailableTopics(),
    fetchScenariosByFilters(),
  ]);

  const scenarioCountByTopic = scenarios.reduce<Record<string, number>>((accumulator, scenario) => {
    accumulator[scenario.topic.id] = (accumulator[scenario.topic.id] ?? 0) + 1;
    return accumulator;
  }, {});

  return ProtectedTutoringPage({
    currentPath: "/topics",
    title: "Topics",
    description:
      "Explore foundational business finance concepts with scenario-driven prompts and stepwise feedback.",
    children: (
      <section className="grid gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <article key={topic.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{topic.title}</h2>
                <p className="mt-1 text-sm text-slate-600">{topic.summary ?? "Scenario-based finance practice."}</p>
              </div>
              <TopicBadge>#{topic.displayOrder}</TopicBadge>
            </div>

            <p className="mt-4 text-sm text-slate-600">
              {scenarioCountByTopic[topic.id] ?? 0} scenario
              {(scenarioCountByTopic[topic.id] ?? 0) === 1 ? "" : "s"} configured.
            </p>

            <Link
              href={`/practice?topic=${topic.slug}`}
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
