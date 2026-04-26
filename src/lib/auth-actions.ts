"use client";

import { signOut } from "next-auth/react";
import { toast } from "@/stores/toastStore";

/**
 * Signs the user out and shows a confirmation toast.
 * Uses `redirect: false` + manual navigation so the toast survives the
 * transition (callbackUrl-based signOut does a hard reload that clears
 * client state including the toast queue).
 */
export async function signOutAndToast(redirectTo = "/") {
  await signOut({ redirect: false });
  toast.success("Signed out");
  // Soft navigation — preserves toast & client state
  if (typeof window !== "undefined") {
    window.location.assign(redirectTo);
  }
}
