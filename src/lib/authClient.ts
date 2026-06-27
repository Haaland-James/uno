"use client";

import { signIn } from "next-auth/react";

interface RequestOtpArgs {
  email: string;
  purpose: "SIGNUP" | "LOGIN";
  name?: string;
  phone?: string;
  agentOnly?: boolean;
}

interface RequestOtpResponse {
  ok: boolean;
  error?: string;
  /** Only present in dev — the OTP code, so we can skip the inbox while testing */
  devCode?: string;
}

export async function requestOtp(args: RequestOtpArgs): Promise<RequestOtpResponse> {
  const res = await fetch("/api/auth/request-otp", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(args),
  });
  const json = await res.json();
  if (!res.ok) {
    return { ok: false, error: json.error?.message ?? "Something went wrong" };
  }
  return { ok: true, devCode: json.data?.devCode };
}

interface VerifyOtpArgs {
  email: string;
  code: string;
  purpose: "SIGNUP" | "LOGIN";
  name?: string;
  phone?: string;
  callbackUrl?: string;
}

interface VerifyOtpResponse {
  ok: boolean;
  error?: string;
  url?: string;
}

export async function verifyOtpAndSignIn(args: VerifyOtpArgs): Promise<VerifyOtpResponse> {
  const result = await signIn("otp", {
    email: args.email,
    code: args.code,
    purpose: args.purpose,
    name: args.name ?? "",
    phone: args.phone ?? "",
    redirect: false,
    callbackUrl: args.callbackUrl ?? "/",
  });

  if (!result) return { ok: false, error: "No response from auth server" };
  if (result.error) {
    return {
      ok: false,
      error:
        result.error === "CredentialsSignin"
          ? "Invalid or expired code. Try again or request a new one."
          : result.error,
    };
  }
  return { ok: true, url: result.url ?? "/" };
}
