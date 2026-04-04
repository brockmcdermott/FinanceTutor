import { render, screen, fireEvent } from "@testing-library/react";
import { LogoutButton } from "@/components/logout-button";

const mockLogout = jest.fn();
jest.mock("@/hooks/use-logout", () => ({
  useLogout: () => ({ logout: mockLogout }),
}));

describe("LogoutButton", () => {
  beforeEach(() => {
    mockLogout.mockClear();
  });

  it("renders Logout button", () => {
    render(<LogoutButton />);
    expect(screen.getByRole("button", { name: "Logout" })).toBeInTheDocument();
  });

  it("calls logout when clicked", () => {
    render(<LogoutButton />);
    fireEvent.click(screen.getByRole("button", { name: "Logout" }));
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
