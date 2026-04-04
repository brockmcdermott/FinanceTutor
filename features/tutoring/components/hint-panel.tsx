export function HintPanel({
  hint,
  hintLevel,
}: {
  hint: string;
  hintLevel?: number;
}) {
  return (
    <section className="rounded-xl border border-sky-200 bg-sky-50/70 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
        Hint{typeof hintLevel === "number" && hintLevel > 0 ? ` ${hintLevel}` : ""}
      </p>
      <p className="mt-1 text-sm leading-6 text-slate-700">{hint}</p>
    </section>
  );
}
