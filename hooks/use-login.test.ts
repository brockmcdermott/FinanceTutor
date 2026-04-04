import { renderHook, act } from "@testing-library/react";
import { useLogin } from "@/hooks/use-login";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignInWithPassword = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: (params: unknown) => mockSignInWithPassword(params),
    },
  }),
}));

describe("useLogin", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls signInWithPassword and router.push on success", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: "user@example.com",
        password: "password123",
      });
    });

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
    });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(result.current.error).toBeNull();
  });

  it("sets error on signIn failure", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid credentials" },
    });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: "user@example.com",
        password: "wrong",
      });
    });

    expect(result.current.error).toBe("An error occurred");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
