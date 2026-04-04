import Link from "next/link";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { ReviewResultsPanel } from "@/features/tutoring/components/review-results-panel";

export default async function ReviewPage() {
  return ProtectedTutoringPage({
    currentPath: "/review",
    title: "Review / Results",
    description:
      "Look back at recent attempts, inspect feedback quality, and decide what to practice next.",
    children: (
      <>
        <ReviewResultsPanel />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Reflection prompt</h2>
          <p className="mt-2 text-sm text-slate-600">
            Choose one recent scenario where your score was below 80% and rewrite your explanation in two sentences.
          </p>
          <Link
            href="/practice"
            className="mt-4 inline-flex rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Start another practice round
          </Link>
        </section>
      </>
    ),
  });
}
