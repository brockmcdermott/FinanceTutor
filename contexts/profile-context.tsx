"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Profile = {
  profile_picture_url: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at?: string | null;
};

type ProfileContextValue = {
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (partial: Partial<Profile>) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback((partial: Partial<Profile>) => {
    setProfile((prev) => (prev ? { ...prev, ...partial } : null));
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return () => {
        isMounted = false;
      };
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      (async () => {
        try {
          const { data, error: fetchError } = await supabase
            .from("profiles")
            .select("profile_picture_url, first_name, last_name, created_at")
            .eq("user_id", user.id)
            .single();

          if (!isMounted) {
            return;
          }
          setProfile(data ?? null);
          setError(fetchError?.message ?? null);
          setLoading(false);
        } catch (fetchError: unknown) {
          if (!isMounted) {
            return;
          }
          setProfile(null);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Unable to load profile."
          );
          setLoading(false);
        }
      })();
    } catch (clientError: unknown) {
      if (isMounted) {
        setProfile(null);
        setError(
          clientError instanceof Error
            ? clientError.message
            : "Unable to initialize profile loading."
        );
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const value: ProfileContextValue = {
    profile,
    loading,
    error,
    updateProfile,
  };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfileContext(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error("useProfileContext must be used within ProfileProvider");
  }
  return ctx;
}
