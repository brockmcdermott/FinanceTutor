import { getTutoringAiMode } from "@/features/tutoring/ai/provider";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { ProgressSummaryCard } from "@/features/tutoring/components/progress-summary-card";

export default async function SettingsPage() {
  const aiMode = getTutoringAiMode();
  const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY);

  return ProtectedTutoringPage({
    currentPath: "/settings",
    title: "Settings",
    description:
      "Configure tutoring behavior and environment-backed AI settings for mock or real provider modes.",
    children: (
      <>
        <section className="grid gap-3 sm:grid-cols-2">
          <ProgressSummaryCard
            label="AI Provider Mode"
            value={aiMode === "mock" ? "mock" : "real"}
            caption="Controlled by TUTORING_AI_MODE"
            tone="focus"
          />
          <ProgressSummaryCard
            label="OpenAI Key"
            value={hasOpenAiKey ? "Present" : "Not set"}
            caption="Optional until real mode wiring is complete"
            tone={hasOpenAiKey ? "positive" : "neutral"}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-slate-900">Learning preferences</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Default response style</p>
              <select className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                <option>Coaching (balanced)</option>
                <option>Hint-first</option>
                <option>Direct explanation</option>
              </select>
            </label>
            <label className="rounded-xl border border-slate-200 p-3 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">Difficulty ramp</p>
              <select className="mt-2 w-full rounded-lg border border-slate-300 px-2 py-2 text-sm">
                <option>Adaptive</option>
                <option>Manual</option>
                <option>Fixed foundation</option>
              </select>
            </label>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            These controls are UI scaffolding for future persistence and profile-level customization.
          </p>
        </section>
      </>
    ),
  });
}
