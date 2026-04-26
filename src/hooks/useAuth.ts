"use client";

import { useSession, signIn } from "next-auth/react";
import { signOutAndToast } from "@/lib/auth-actions";

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
    signOut: () => signOutAndToast(),
    /** Low-level helper — most pages should use the request-otp + verify flow instead. */
    signIn,
  };
}
