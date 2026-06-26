"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useUserStore } from "@/stores/userStore";
import { onAuthChange } from "@/lib/auth-sync";
import type { Role } from "@/types";

/**
 * Bridges NextAuth's session into the existing Zustand userStore + listens
 * for cross-tab auth events so a sign-out in one tab is reflected in
 * every other tab immediately.
 */
export function SessionSync() {
  const { data: session, status, update } = useSession();
  const setUser = useUserStore((s) => s.setUser);
  const updateUser = useUserStore((s) => s.updateUser);
  const setLoading = useUserStore((s) => s.setLoading);

  // Cross-tab sync: when any other tab signs in or out, force this tab's
  // session to refetch. signed-out auth changes hard-reload to /properties so
  // the user lands on a public page (won't get bounced to /login from a
  // protected route they happened to be viewing).
  useEffect(() => {
    return onAuthChange((event) => {
      if (event.type === "signed-out") {
        if (typeof window !== "undefined") {
          window.location.assign("/");
        }
        return;
      }
      // signed-in elsewhere — refresh THIS tab's session cache
      update();
    });
  }, [update]);

  useEffect(() => {
    if (status === "loading") {
      setLoading(true);
      return;
    }

    if (status === "authenticated" && session?.user) {
      const currentUser = useUserStore.getState().user;
      const sessionData = {
        id: session.user.id,
        email: session.user.email ?? "",
        emailVerified: true,
        name: session.user.name ?? "",
        photo: session.user.image ?? null,
        role: (session.user.role ?? "RENTER") as Role,
      };

      if (currentUser?.id === session.user.id) {
        updateUser(sessionData);
      } else {
        setUser({
          ...sessionData,
          phone: null,
          phoneVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } else {
      setUser(null);
    }
  }, [session, status, setUser, updateUser, setLoading]);

  return null;
}
