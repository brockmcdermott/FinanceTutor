import { cn } from "@/lib/utils";

export function ProgressSummaryCard({
  label,
  value,
  caption,
  tone = "neutral",
}: {
  label: string;
  value: string;
  caption: string;
  tone?: "neutral" | "positive" | "focus";
}) {
  const toneStyles =
    tone === "positive"
      ? "border-emerald-200 bg-emerald-50"
      : tone === "focus"
        ? "border-sky-200 bg-sky-50"
        : "border-slate-200 bg-white";

  return (
    <article className={cn("rounded-2xl border p-4 shadow-sm sm:p-5", toneStyles)}>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-600">{caption}</p>
    </article>
  );
}
