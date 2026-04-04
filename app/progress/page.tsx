import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { ProgressDashboard } from "@/features/tutoring/components/progress-dashboard";
import { fetchLearnerProgressDashboard } from "@/features/tutoring/data/server";

export default async function ProgressPage() {
  const dashboard = await fetchLearnerProgressDashboard();

  return ProtectedTutoringPage({
    currentPath: "/progress",
    title: "Progress",
    description:
      "Monitor attempts, average scores, and topic-level mastery as you work through finance concepts.",
    children: <ProgressDashboard dashboard={dashboard} />,
  });
}
