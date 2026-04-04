import { render, screen } from "@testing-library/react";
import Home from "@/app/page";

describe("Home page", () => {
  it("renders the finance tutor hero heading", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", {
        name: /Scenario-based AI tutoring for business finance and accounting foundations/i,
      })
    ).toBeInTheDocument();
  });
});
