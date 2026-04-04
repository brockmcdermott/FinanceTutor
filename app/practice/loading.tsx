export default function PracticeLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="animate-pulse space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-8 w-48 rounded bg-slate-200" />
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-56 rounded-2xl bg-slate-100" />
      </div>
    </div>
  );
}
