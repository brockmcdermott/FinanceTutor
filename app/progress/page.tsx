import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { ProgressOverview } from "@/features/tutoring/components/progress-overview";

export default async function ProgressPage() {
  return ProtectedTutoringPage({
    currentPath: "/progress",
    title: "Progress",
    description:
      "Monitor attempts, average scores, and topic-level mastery as you work through finance concepts.",
    children: <ProgressOverview />,
  });
}
