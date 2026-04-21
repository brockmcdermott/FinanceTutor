"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type LoginParams = {
  email: string;
  password: string;
  redirectTo?: string | null;
};

function resolvePostLoginPath(redirectTo?: string | null) {
  if (!redirectTo) {
    return "/dashboard";
  }

  // Prevent open redirects while allowing in-app paths and query strings.
  if (!redirectTo.startsWith("/") || redirectTo.startsWith("//")) {
    return "/dashboard";
  }

  return redirectTo;
}

export function useLogin() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function login(params: LoginParams) {
    const { email, password, redirectTo } = params;

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (signInError) throw signInError;
      router.replace(resolvePostLoginPath(redirectTo));
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return { login, isLoading, error };
}
