"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useProfile } from "@/hooks/use-profile";
import { Avatar, getInitials } from "@/components/avatar";
import { LogoutButton } from "./logout-button";

export function AuthButton() {
  const { user, loading } = useAuth();
  const { profile } = useProfile();

  if (loading) {
    return (
      <div className="flex items-center gap-4">
        <span className="h-9 w-40 animate-pulse rounded-xl bg-slate-200" />
      </div>
    );
  }

  return user ? (
    <div className="flex items-center gap-3">
      <Avatar
        imageUrl={profile?.profile_picture_url ?? null}
        initials={getInitials(
          profile?.first_name ?? null,
          profile?.last_name ?? null,
          user.email
        )}
        size="sm"
      />
      <span className="hidden text-sm text-slate-700 sm:inline">{user.email}</span>
      <LogoutButton />
    </div>
  ) : (
    <div className="flex gap-2">
      <Link
        href="/auth/login"
        className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        Sign in
      </Link>
      <Link
        href="/auth/sign-up"
        className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        Sign up
      </Link>
    </div>
  );
}
