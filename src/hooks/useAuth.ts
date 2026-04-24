"use client";

import { useSession, signIn, signOut } from "next-auth/react";

export function useAuth() {
  const { data: session, status } = useSession();

  const user = session?.user
    ? {
        id: session.user.id,
        email: session.user.email ?? "",
        name: session.user.name ?? "",
        role: session.user.role,
        photo: session.user.image ?? null,
      }
    : null;

  return {
    user,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    signOut: () => signOut({ callbackUrl: "/" }),
    /** Low-level helper — most pages should use the request-otp + verify flow instead. */
    signIn,
  };
}
