import Link from "next/link";
import { tutoringNavItems } from "@/features/tutoring/navigation";
import { cn } from "@/lib/utils";

function isActiveRoute(currentPath: string, itemPath: string) {
  return currentPath === itemPath;
}

export function TutoringAppShell({
  title,
  description,
  currentPath,
  userEmail,
  children,
}: {
  title: string;
  description: string;
  currentPath: string;
  userEmail: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-lg shadow-slate-200/70 backdrop-blur-sm">
        <div className="border-b border-slate-200 bg-gradient-to-r from-slate-100 via-white to-sky-50 px-4 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                Finance Tutor Prototype
              </p>
              <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">{description}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right">
              <p className="text-[11px] uppercase tracking-wide text-slate-500">Learner</p>
              <p className="text-sm font-medium text-slate-900">{userEmail}</p>
            </div>
          </div>

          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {tutoringNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition",
                  isActiveRoute(currentPath, item.href)
                    ? "bg-slate-900 text-white"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="grid lg:grid-cols-[260px_1fr]">
          <aside className="hidden border-r border-slate-200 bg-slate-50 p-4 lg:block">
            <nav className="space-y-2">
              {tutoringNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block rounded-xl border px-3 py-2.5 transition",
                    isActiveRoute(currentPath, item.href)
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-100"
                  )}
                >
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p
                    className={cn(
                      "mt-1 text-xs",
                      isActiveRoute(currentPath, item.href) ? "text-slate-200" : "text-slate-500"
                    )}
                  >
                    {item.description}
                  </p>
                </Link>
              ))}
            </nav>

            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Account
              </p>
              <Link href="/profile" className="mt-2 block text-sm font-medium text-slate-900 hover:underline">
                View profile
              </Link>
            </div>
          </aside>

          <main className="space-y-6 p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
