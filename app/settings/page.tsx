import { getTutoringAiRuntimeStatus } from "@/features/tutoring/ai/provider";
import { ProtectedTutoringPage } from "@/features/tutoring/components/protected-tutoring-page";
import { ProgressSummaryCard } from "@/features/tutoring/components/progress-summary-card";

export default async function SettingsPage() {
  const aiStatus = getTutoringAiRuntimeStatus();

  return ProtectedTutoringPage({
    currentPath: "/settings",
    title: "Settings",
    description:
      "Configure tutoring behavior and environment-backed AI settings for mock or real provider modes.",
    children: (
      <>
        <section className="grid gap-3 sm:grid-cols-3">
          <ProgressSummaryCard
            label="AI Provider Mode"
            value={aiStatus.mode === "mock" ? "mock" : "real"}
            caption="Controlled by MOCK_AI and OPENAI_API_KEY"
            tone="focus"
          />
          <ProgressSummaryCard
            label="OpenAI Key"
            value={aiStatus.hasOpenAiKey ? "Present" : "Not set"}
            caption="Optional until real mode wiring is complete"
            tone={aiStatus.hasOpenAiKey ? "positive" : "neutral"}
          />
          <ProgressSummaryCard
            label="Mock AI Flag"
            value={aiStatus.mockEnabled ? "Enabled" : "Disabled"}
            caption="Use MOCK_AI=true for guaranteed demo behavior"
          />
        </section>

        {aiStatus.fallbackReason && (
          <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <p className="text-sm font-semibold text-amber-900">Runtime fallback</p>
            <p className="mt-1 text-sm text-amber-800">{aiStatus.fallbackReason}</p>
          </section>
        )}

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
