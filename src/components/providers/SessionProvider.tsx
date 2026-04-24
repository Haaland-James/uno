"use client";

import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { SessionSync } from "./SessionSync";
import { AuthModal } from "@/components/auth/AuthModal";

export function SessionProvider({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: Session | null;
}) {
  return (
    <NextAuthSessionProvider session={session}>
      <SessionSync />
      {children}
      <AuthModal />
    </NextAuthSessionProvider>
  );
}
