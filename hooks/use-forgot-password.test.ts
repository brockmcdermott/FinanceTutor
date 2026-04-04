import { renderHook, act } from "@testing-library/react";
import { useForgotPassword } from "@/hooks/use-forgot-password";

const mockResetPasswordForEmail = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      resetPasswordForEmail: (email: string, options: unknown) =>
        mockResetPasswordForEmail(email, options),
    },
  }),
}));

describe("useForgotPassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sets success when reset email is sent", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.sendResetEmail("user@example.com");
    });

    expect(mockResetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/update-password"),
      })
    );
    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("sets error on failure", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { message: "User not found" },
    });
    const { result } = renderHook(() => useForgotPassword());

    await act(async () => {
      await result.current.sendResetEmail("unknown@example.com");
    });

    expect(result.current.error).toBe("An error occurred");
    expect(result.current.success).toBe(false);
  });
});
