import { FeedbackResponse } from "@/features/tutoring/ai/types";

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

export function FeedbackCard({ feedback }: { feedback: FeedbackResponse }) {
  const statusTone =
    feedback.score >= 0.8
      ? "text-emerald-700 bg-emerald-50 border-emerald-200"
      : feedback.score >= 0.55
        ? "text-amber-700 bg-amber-50 border-amber-200"
        : "text-rose-700 bg-rose-50 border-rose-200";

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">AI Feedback</h3>
        <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusTone}`}>
          Score {toPercent(feedback.score)}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-700">{feedback.summary}</p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">Strengths</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {feedback.strengths.map((item) => (
              <li key={item} className="rounded-lg bg-slate-50 p-2.5">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Improvements</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {feedback.improvements.map((item) => (
              <li key={item} className="rounded-lg bg-slate-50 p-2.5">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
