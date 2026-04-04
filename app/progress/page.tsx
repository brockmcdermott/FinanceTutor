import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { ProgressDashboard } from "@/features/tutoring/components/progress-dashboard";
import { fetchLearnerProgressDashboard } from "@/features/tutoring/data/server";

export default async function ProgressPage() {
  try {
    const dashboard = await fetchLearnerProgressDashboard();

    return ProtectedTutoringPage({
      currentPath: "/progress",
      title: "Progress",
      description:
        "Monitor attempts, average scores, and topic-level mastery as you work through finance concepts.",
      children: <ProgressDashboard dashboard={dashboard} />,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unable to load progress right now.";

    return ProtectedTutoringPage({
      currentPath: "/progress",
      title: "Progress",
      description:
        "Monitor attempts, average scores, and topic-level mastery as you work through finance concepts.",
      children: (
        <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-rose-900">Progress unavailable</h2>
          <p className="mt-2 text-sm text-rose-800">{errorMessage}</p>
        </section>
      ),
    });
  }
}
