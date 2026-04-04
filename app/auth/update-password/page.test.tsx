import { render, screen } from "@testing-library/react";
import Page from "@/app/auth/update-password/page";

jest.mock("@/app/auth/update-password/_components/update-password-form", () => ({
  UpdatePasswordForm: () => (
    <div data-testid="update-password-form">UpdatePasswordForm</div>
  ),
}));

describe("Update password page", () => {
  it("renders UpdatePasswordForm", () => {
    render(<Page />);
    expect(screen.getByTestId("update-password-form")).toBeInTheDocument();
  });
});
