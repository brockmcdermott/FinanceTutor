"use client";

import { useLogout } from "@/hooks/use-logout";

export function LogoutButton() {
  const { logout } = useLogout();

  return (
    <button
      onClick={logout}
      className="border rounded px-3 py-1 text-sm hover:bg-gray-100"
    >
      Logout
    </button>
  );
}
