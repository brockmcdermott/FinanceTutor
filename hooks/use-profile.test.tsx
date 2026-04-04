import { renderHook, waitFor } from "@testing-library/react";
import { useProfile } from "@/hooks/use-profile";
import { ProfileProvider } from "@/contexts/profile-context";

jest.mock("@/hooks/use-auth", () => ({
  useAuth: () => ({ user: { id: "1" } }),
}));

const mockProfile = {
  profile_picture_url: null,
  first_name: "John",
  last_name: "Doe",
  created_at: "2025-01-01T00:00:00Z",
};

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({ data: mockProfile, error: null }),
        }),
      }),
    }),
  }),
}));

describe("useProfile", () => {
  it("returns profile from context when inside ProfileProvider", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ProfileProvider>{children}</ProfileProvider>
    );
    const { result } = renderHook(() => useProfile(), { wrapper });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.profile).toEqual(mockProfile);
      expect(result.current.error).toBeNull();
    });
  });

  it("throws when used outside ProfileProvider", () => {
    expect(() => renderHook(() => useProfile())).toThrow(
      "useProfileContext must be used within ProfileProvider"
    );
  });
});
