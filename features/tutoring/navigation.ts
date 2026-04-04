export interface TutoringNavItem {
  href: string;
  label: string;
  description: string;
}

export const tutoringNavItems: TutoringNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Overview and quick actions",
  },
  {
    href: "/topics",
    label: "Topics",
    description: "Finance concepts to practice",
  },
  {
    href: "/practice",
    label: "Practice Session",
    description: "Scenario-based problem solving",
  },
  {
    href: "/review",
    label: "Review / Results",
    description: "Session feedback and reflection",
  },
  {
    href: "/progress",
    label: "Progress",
    description: "Mastery and completion trends",
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Learning and AI preferences",
  },
];
