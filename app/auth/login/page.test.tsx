import { render, screen } from "@testing-library/react";
import Page from "@/app/auth/login/page";

jest.mock("@/app/auth/login/_components/login-form", () => ({
  LoginForm: () => <div data-testid="login-form">LoginForm</div>,
}));

describe("Login page", () => {
  it("renders LoginForm", () => {
    render(<Page />);
    expect(screen.getByTestId("login-form")).toBeInTheDocument();
    expect(screen.getByText("LoginForm")).toBeInTheDocument();
  });
});
