import { renderHook, act } from "@testing-library/react";
import { useLogout } from "@/hooks/use-logout";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignOut = jest.fn();
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signOut: () => mockSignOut(),
    },
  }),
}));

describe("useLogout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSignOut.mockResolvedValue(undefined);
  });

  it("calls signOut and router.push when logout is called", async () => {
    const { result } = renderHook(() => useLogout());

    await act(async () => {
      await result.current.logout();
    });

    expect(mockSignOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/auth/login");
  });
});
