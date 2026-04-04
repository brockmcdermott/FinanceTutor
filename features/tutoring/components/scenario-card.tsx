import { TopicBadge } from "@/features/tutoring/components/topic-badge";
import { FinanceScenario } from "@/features/tutoring/types";

export function ScenarioCard({ scenario }: { scenario: FinanceScenario }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <TopicBadge
          variant={scenario.difficulty === "foundation" ? "foundation" : "intermediate"}
        >
          {scenario.difficulty}
        </TopicBadge>
        {scenario.conceptChecklist.map((concept) => (
          <TopicBadge key={concept}>{concept}</TopicBadge>
        ))}
      </div>

      <h2 className="mt-4 text-xl font-semibold text-slate-900">{scenario.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{scenario.context}</p>

      <div className="mt-4 rounded-xl bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-900">Prompt</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{scenario.prompt}</p>
      </div>

      <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4">
        <p className="text-sm font-medium text-slate-900">Written reflection</p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{scenario.writtenPrompt}</p>
      </div>
    </section>
  );
}
