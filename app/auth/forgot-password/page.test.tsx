import { render, screen } from "@testing-library/react";
import Page from "@/app/auth/forgot-password/page";

jest.mock("@/app/auth/forgot-password/_components/forgot-password-form", () => ({
  ForgotPasswordForm: () => (
    <div data-testid="forgot-password-form">ForgotPasswordForm</div>
  ),
}));

describe("Forgot password page", () => {
  it("renders ForgotPasswordForm", () => {
    render(<Page />);
    expect(screen.getByTestId("forgot-password-form")).toBeInTheDocument();
  });
});
