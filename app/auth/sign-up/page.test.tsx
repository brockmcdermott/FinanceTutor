import { render, screen } from "@testing-library/react";
import Page from "@/app/auth/sign-up/page";

jest.mock("@/app/auth/sign-up/_components/sign-up-form", () => ({
  SignUpForm: () => <div data-testid="sign-up-form">SignUpForm</div>,
}));

describe("Sign up page", () => {
  it("renders SignUpForm", () => {
    render(<Page />);
    expect(screen.getByTestId("sign-up-form")).toBeInTheDocument();
  });
});
