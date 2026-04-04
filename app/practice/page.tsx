import { PracticeSessionWorkspace } from "@/features/tutoring/components/practice-session-workspace";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { fetchAvailableTopics, fetchScenariosByFilters } from "@/features/tutoring/data/server";

export default async function PracticePage() {
  const [topics, scenarios] = await Promise.all([
    fetchAvailableTopics(),
    fetchScenariosByFilters(),
  ]);

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
}
