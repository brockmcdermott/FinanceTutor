import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-12 text-white sm:px-10">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-200">Finance Teacher</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold leading-tight sm:text-5xl">
            Scenario-based AI tutoring for business finance and accounting foundations.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-slate-200 sm:text-base">
            Practice realistic finance problems, submit numeric and written answers, and get adaptive feedback.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              Open dashboard
            </Link>
            <Link
              href="/topics"
              className="rounded-xl border border-slate-400 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-slate-200"
            >
              Browse topics
            </Link>
          </div>
        </div>

        <div className="grid gap-4 px-6 py-8 sm:grid-cols-3 sm:px-10">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Guided practice</p>
            <p className="mt-1 text-sm text-slate-600">Work through realistic operating and investment scenarios.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Adaptive feedback</p>
            <p className="mt-1 text-sm text-slate-600">Get hints and next-question recommendations based on performance.</p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">Progress tracking</p>
            <p className="mt-1 text-sm text-slate-600">Review attempts and topic mastery over time.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
