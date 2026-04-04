import { renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockUser = { id: "1", email: "user@example.com" };
const mockGetUser = jest.fn();
const mockOnAuthStateChange = jest.fn();

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: () => mockGetUser(),
      onAuthStateChange: (callback: (event: string, session: { user: unknown } | null) => void) => {
        const sub = { unsubscribe: jest.fn() };
        mockOnAuthStateChange.mockImplementation(() => {
          callback("INITIAL_SESSION", { user: mockUser });
        });
        return { data: { subscription: sub } };
      },
    },
  }),
}));

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockOnAuthStateChange.mockImplementation(() => {});
  });

  it("starts with loading true then resolves to user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });
    const { result } = renderHook(() => useAuth());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual(mockUser);
  });

  it("returns null user when getUser returns no user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { result } = renderHook(() => useAuth());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toBeNull();
  });
});
