import { defaultTopicId, financeTopics } from "@/features/tutoring/config/topics";
import { PracticeSessionWorkspace } from "@/features/tutoring/components/practice-session-workspace";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";

export default async function PracticePage() {
  return ProtectedTutoringPage({
    currentPath: "/practice",
    title: "Practice Session",
    description:
      "Solve realistic scenarios with numeric calculations and short written explanations. Feedback adapts your next step.",
    children: <PracticeSessionWorkspace topics={financeTopics} initialTopicId={defaultTopicId} />,
  });
}
