import { FeedbackResponse } from "@/features/tutoring/ai/types";
import { TopicBadge } from "@/features/tutoring/components/topic-badge";

function toPercent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function toReadableTag(tag: string) {
  return tag.replaceAll("_", " ");
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
        <h3 className="text-lg font-semibold text-slate-900">Tutor feedback</h3>
        <div className={`rounded-full border px-3 py-1 text-sm font-semibold ${statusTone}`}>
          Score {toPercent(feedback.score)}
        </div>
      </div>

      <p className="mt-3 text-sm leading-6 text-slate-700">{feedback.summary}</p>

      {feedback.misconceptionTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {feedback.misconceptionTags.map((tag) => (
            <TopicBadge key={tag}>{toReadableTag(tag)}</TopicBadge>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm font-semibold text-slate-900">What went well</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {feedback.strengths.map((item) => (
              <li key={item} className="rounded-lg bg-slate-50 p-2.5">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">Where to improve</p>
          <ul className="mt-2 space-y-2 text-sm text-slate-600">
            {feedback.improvements.map((item) => (
              <li key={item} className="rounded-lg bg-slate-50 p-2.5">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">Follow-up guidance</p>
        <p className="mt-1 text-sm text-slate-700">{feedback.hint}</p>
        <p className="mt-2 text-sm text-slate-600">{feedback.followUpQuestion}</p>
      </div>

      <div className="mt-4 space-y-3">
        {feedback.questionFeedback.map((question) => (
          <article key={question.questionId} className="rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{question.prompt}</p>
              <TopicBadge variant={question.isCorrect ? "intermediate" : "foundation"}>
                {question.isCorrect ? "Correct" : "Needs revision"}
              </TopicBadge>
            </div>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Correct:</span> {question.whatWasCorrect}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Gap:</span> {question.whatWasWrong}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Why:</span> {question.whyItWasWrong}
            </p>
            <p className="mt-1 text-sm text-slate-700">
              <span className="font-medium text-slate-900">Hint:</span> {question.hint}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
