import { render, screen } from "@testing-library/react";
import DashboardPage from "@/app/dashboard/page";

jest.mock("@/features/tutoring/ai/provider", () => ({
  getTutoringAiMode: jest.fn(() => "mock"),
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
    expect(screen.getByText("Start practice session")).toBeInTheDocument();
  });

  it("shows review and progress navigation cards", async () => {
    const content = await DashboardPage();
    render(content);

    expect(screen.getByText("Review / Results")).toBeInTheDocument();
    expect(screen.getByText("Progress")).toBeInTheDocument();
  });
});
