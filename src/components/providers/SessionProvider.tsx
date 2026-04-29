"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { SessionSync } from "./SessionSync";
import { AuthModal } from "@/components/auth/AuthModal";
import { Toaster } from "@/components/shared/Toaster";

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <NextAuthSessionProvider
      session={session}
      // Belt-and-suspenders cross-tab sync alongside the BroadcastChannel.
      // refetchOnWindowFocus is the default; making it explicit. Interval poll
      // every 5 min catches stale sessions on tabs that are open + visible.
      refetchOnWindowFocus
      refetchInterval={5 * 60}
    >
      <SessionSync />
      {children}
      <AuthModal />
      <Toaster />
    </NextAuthSessionProvider>
  );
}
