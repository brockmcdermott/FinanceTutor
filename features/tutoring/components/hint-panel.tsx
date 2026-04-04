export function HintPanel({ hint }: { hint: string }) {
  return (
    <details className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer list-none text-sm font-medium text-slate-900">
        Need a hint?
      </summary>
      <p className="mt-3 text-sm leading-6 text-slate-600">{hint}</p>
    </details>
  );
}
