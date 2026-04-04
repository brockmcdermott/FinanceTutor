import Link from "next/link";
import { PracticeSessionWorkspace } from "@/features/tutoring/components/practice-session-workspace";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { fetchAvailableTopics, fetchScenariosByFilters } from "@/features/tutoring/data/server";

export default async function PracticePage() {
  try {
    const [topics, scenarios] = await Promise.all([
      fetchAvailableTopics(),
      fetchScenariosByFilters(),
    ]);

    if (topics.length === 0 || scenarios.length === 0) {
      return ProtectedTutoringPage({
        currentPath: "/practice",
        title: "Practice Session",
        description:
          "Solve realistic scenarios with numeric calculations and short written explanations. Feedback adapts your next step.",
        children: (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-amber-900">No practice content found</h2>
            <p className="mt-2 text-sm text-amber-800">
              Your database has no active tutoring topics/scenarios yet. Run the seed to populate demo
              content.
            </p>
            <Link
              href="/topics"
              className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Open topics page
            </Link>
          </section>
        ),
      });
    }

    const initialTopicSlug = topics[0]?.slug ?? "";

    return ProtectedTutoringPage({
      currentPath: "/practice",
      title: "Practice Session",
      description:
        "Solve realistic scenarios with numeric calculations and short written explanations. Feedback adapts your next step.",
      children: (
        <PracticeSessionWorkspace
          topics={topics}
          scenarios={scenarios}
          initialTopicSlug={initialTopicSlug}
        />
      ),
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Unable to load practice content right now.";

    return ProtectedTutoringPage({
      currentPath: "/practice",
      title: "Practice Session",
      description:
        "Solve realistic scenarios with numeric calculations and short written explanations. Feedback adapts your next step.",
      children: (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-rose-900">Practice content unavailable</h2>
          <p className="mt-2 text-sm text-rose-800">{errorMessage}</p>
        </section>
      ),
    });
  }
}
