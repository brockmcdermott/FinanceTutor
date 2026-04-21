import { renderHook, act } from "@testing-library/react";
import { useLogin } from "@/hooks/use-login";

const mockReplace = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, refresh: mockRefresh }),
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

  it("calls signInWithPassword and navigates to dashboard by default on success", async () => {
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
    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
    expect(mockRefresh).toHaveBeenCalled();
    expect(result.current.error).toBeNull();
  });

  it("navigates to a safe redirect destination when provided", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: "user@example.com",
        password: "password123",
        redirectTo: "/practice?topic=inventory-turnover",
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/practice?topic=inventory-turnover");
  });

  it("falls back to dashboard for an unsafe redirect destination", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useLogin());

    await act(async () => {
      await result.current.login({
        email: "user@example.com",
        password: "password123",
        redirectTo: "https://malicious.example",
      });
    });

    expect(mockReplace).toHaveBeenCalledWith("/dashboard");
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
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
