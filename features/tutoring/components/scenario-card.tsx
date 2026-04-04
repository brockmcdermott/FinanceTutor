import { TopicBadge } from "@/features/tutoring/components/topic-badge";
import { ScenarioRecord } from "@/features/tutoring/data/types";

function toDifficultyLabel(level: string) {
  return level.replaceAll("-", " ");
}

export function ScenarioCard({ scenario }: { scenario: ScenarioRecord }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <TopicBadge variant={scenario.difficultyLevel === "foundation" ? "foundation" : "intermediate"}>
          {toDifficultyLabel(scenario.difficultyLevel)}
        </TopicBadge>
        {scenario.skills.map((skill) => (
          <TopicBadge key={skill.id}>{skill.name}</TopicBadge>
        ))}
      </div>

      <h2 className="mt-4 text-xl font-semibold text-slate-900">{scenario.title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{scenario.businessContext}</p>

      <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-slate-300 p-4 sm:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Topic</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{scenario.topic.title}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Questions</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">{scenario.questions.length}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Estimated time</p>
          <p className="mt-1 text-sm font-semibold text-slate-900">
            {scenario.estimatedMinutes ? `${scenario.estimatedMinutes} min` : "Flexible"}
          </p>
        </div>
      </div>
    </section>
  );
}
