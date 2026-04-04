import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

jest.mock("@/features/tutoring/ai/provider", () => ({
  getTutoringAiRuntimeStatus: jest.fn(() => ({
    mode: "mock",
    mockEnabled: true,
    requestedRealMode: false,
    hasOpenAiKey: false,
    configuredModel: "gpt-4.1-mini",
    fallbackReason: null,
  })),
}));

jest.mock("@/features/tutoring/data/server", () => ({
  fetchAvailableTopics: jest.fn(async () => [
    { id: "1", slug: "revenue", title: "Revenue Fundamentals" },
    { id: "2", slug: "gross-profit", title: "Gross Profit" },
  ]),
  fetchLearnerProgressDashboard: jest.fn(async () => ({
    topicMastery: [
      {
        topicId: "1",
        topicSlug: "revenue",
        topicTitle: "Revenue Fundamentals",
        masteryScore: 0.66,
        masteryLevel: "developing",
        recentAttempts: 2,
        trendDelta: 0.1,
        trendDirection: "improving",
        lastPracticedAt: "2026-04-03T16:00:00.000Z",
        weakTags: [],
      },
    ],
    recentlyPracticed: [
      {
        topicId: "1",
        topicSlug: "revenue",
        topicTitle: "Revenue Fundamentals",
        masteryScore: 0.66,
        masteryLevel: "developing",
        recentAttempts: 2,
        trendDelta: 0.1,
        trendDirection: "improving",
        lastPracticedAt: "2026-04-03T16:00:00.000Z",
        weakTags: [],
      },
    ],
    weakSkills: [],
    totalAttempts: 2,
    averageRecentScore: 0.66,
  })),
}));

jest.mock("@/features/tutoring/components/protected-tutoring-page", () => ({
  ProtectedTutoringPage: jest.fn(({ children }) => <div data-testid="tutoring-shell">{children}</div>),
}));

describe("Dashboard page", () => {
  it("renders dashboard content inside the protected shell", async () => {
    const content = await DashboardPage();
    render(content);

    expect(screen.getByTestId("tutoring-shell")).toBeInTheDocument();
    expect(screen.getByText("Topics Available")).toBeInTheDocument();
    expect(screen.getByText("Continue adaptive finance practice")).toBeInTheDocument();
  });

  it("shows recent activity and progress snapshot sections", async () => {
    const content = await DashboardPage();
    render(content);

    expect(screen.getByText("Recent activity")).toBeInTheDocument();
    expect(screen.getByText("Progress snapshot")).toBeInTheDocument();
  });
});
