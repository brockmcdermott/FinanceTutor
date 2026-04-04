import { cn } from "@/lib/utils";

type TopicBadgeVariant = "default" | "foundation" | "intermediate";

const variantClasses: Record<TopicBadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700",
  foundation: "bg-emerald-100 text-emerald-700",
  intermediate: "bg-sky-100 text-sky-700",
};

export function TopicBadge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: TopicBadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
