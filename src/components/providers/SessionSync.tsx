"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/stores/userStore";
import type { Role } from "@/types";

/**
 * Bridges NextAuth's session into the existing Zustand userStore.
 * Lets all existing `useUserStore((s) => s.user)` callers keep working
 * without touching every component.
 */
export function SessionSync() {
  const { data: session, status } = useSession();
  const setUser = useUserStore((s) => s.setUser);
  const setLoading = useUserStore((s) => s.setLoading);

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      setUser({
        id: session.user.id,
        email: session.user.email ?? "",
        emailVerified: true,
        phone: null,
        phoneVerified: false,
        name: session.user.name ?? "",
        photo: session.user.image ?? null,
        role: (session.user.role ?? "RENTER") as Role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } else {
      setUser(null);
    }
  }, [session, status, setUser, setLoading]);

  return null;
}
