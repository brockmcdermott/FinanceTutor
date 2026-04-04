import { requireAuth } from "@/lib/auth";
import { TutoringAppShell } from "@/features/tutoring/components/tutoring-app-shell";

export async function ProtectedTutoringPage({
  currentPath,
  title,
  description,
  children,
}: {
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  return (
    <TutoringAppShell
      currentPath={currentPath}
      title={title}
      description={description}
      userEmail={user.email ?? "Learner"}
    >
      {children}
    </TutoringAppShell>
  );
}
