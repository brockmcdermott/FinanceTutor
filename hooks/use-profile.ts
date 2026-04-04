"use client";

import {
  useProfileContext,
  type Profile,
} from "@/contexts/profile-context";

export type { Profile };

export function useProfile() {
  const { profile, loading, error } = useProfileContext();
  return { profile, loading, error };
}
