"use client";

import { createClient } from "@/lib/supabase/client";
import { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

/**
 * React hook to get the currently authenticated user in Client Components.
 * Returns the user object and a loading state.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, loading } = useAuth();
 *   
 *   if (loading) return <div>Loading...</div>;
 *   if (!user) return <div>Not authenticated</div>;
 *   
 *   return <div>Hello, {user.email}</div>;
 * }
 * ```
 */
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    try {
      const supabase = createClient();

      // Get initial session
      supabase.auth
        .getUser()
        .then(({ data: { user } }) => {
          if (!isMounted) {
            return;
          }
          setUser(user);
          setLoading(false);
        })
        .catch(() => {
          if (!isMounted) {
            return;
          }
          setUser(null);
          setLoading(false);
        });

      // Listen for auth changes
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!isMounted) {
          return;
        }
        setUser(session?.user ?? null);
        setLoading(false);
      });

      unsubscribe = () => subscription.unsubscribe();
    } catch {
      if (isMounted) {
        setUser(null);
        setLoading(false);
      }
    }

    return () => {
      isMounted = false;
      unsubscribe?.();
    };
  }, []);

  return { user, loading };
}
