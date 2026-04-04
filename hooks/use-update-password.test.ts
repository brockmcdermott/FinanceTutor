import { renderHook, act } from "@testing-library/react";
import { useUpdatePassword } from "@/hooks/use-update-password";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUpdateUser = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      updateUser: (params: { password: string }) => mockUpdateUser(params),
    },
  }),
}));

describe("useUpdatePassword", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls updateUser and router.push on success", async () => {
    mockUpdateUser.mockResolvedValue({ error: null });
    const { result } = renderHook(() => useUpdatePassword());

    await act(async () => {
      await result.current.updatePassword("newpassword123");
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      password: "newpassword123",
    });
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    expect(result.current.error).toBeNull();
  });

  it("sets error on failure", async () => {
    mockUpdateUser.mockResolvedValue({
      error: { message: "Password too weak" },
    });
    const { result } = renderHook(() => useUpdatePassword());

    await act(async () => {
      await result.current.updatePassword("weak");
    });

    expect(result.current.error).toBe("An error occurred");
    expect(mockPush).not.toHaveBeenCalled();
  });
});
