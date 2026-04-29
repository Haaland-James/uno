"use client";

import { signOut } from "next-auth/react";
import { toast } from "@/stores/toastStore";
import { broadcastAuthChange } from "./auth-sync";

/**
 * Signs the user out and shows a confirmation toast.
 * Uses `redirect: false` + manual navigation so the toast survives the
 * transition (callbackUrl-based signOut does a hard reload that clears
 * client state including the toast queue).
 *
 * Broadcasts to other tabs so they refetch their session and reflect
 * the signed-out state immediately (instead of staying stale until
 * they happen to focus / navigate / hit the default refetch interval).
 */
export async function signOutAndToast(redirectTo = "/") {
  await signOut({ redirect: false });
  broadcastAuthChange({ type: "signed-out" });
  toast.success("Signed out");
  // Soft navigation — preserves toast & client state
  if (typeof window !== "undefined") {
    window.location.assign(redirectTo);
  }
}
