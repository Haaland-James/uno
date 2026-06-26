"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { requestOtp } from "@/lib/authClient";

type LoginMode = "otp" | "password";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/feed";
  const deactivatedError = searchParams.get("error") === "deactivated";

  const [mode, setMode] = useState<LoginMode>("otp");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(
    deactivatedError ? "This account has been deactivated." : null
  );

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await requestOtp({ email, purpose: "LOGIN" });

    if (!result.ok) {
      setError(result.error ?? "Could not send code");
      setSubmitting(false);
      return;
    }

    const params = new URLSearchParams({ email, mode: "LOGIN" });
    if (result.devCode) params.set("devCode", result.devCode);
    router.push(`/verify?${params.toString()}`);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await signIn("password", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setSubmitting(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  const inputClass =
    "h-[50px] w-full rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-[15px] text-[#161515] placeholder:text-[rgba(10,10,10,0.4)] focus:border-[#af2525] focus:outline-none focus:ring-1 focus:ring-[#af2525] disabled:opacity-60";

  return (
    <>
      <AuthHeader mode="login" />

      <div className="flex flex-1 items-center justify-center px-5 py-16 md:py-24">
        <div className="w-full max-w-[380px]">
          <h1 className="mb-10 text-[32px] font-semibold leading-tight text-[#161515] md:mb-12 md:text-[36px]">
            Sign in
          </h1>

          {mode === "otp" ? (
            <form className="flex flex-col gap-4" onSubmit={handleOtpSubmit}>
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className={inputClass}
              />

              {error && (
                <p className="px-2 text-[13px] text-[#af2525]" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !email}
                className="mt-2 h-[50px] w-full rounded-[25px] bg-[#af2525] text-[16px] font-semibold text-white transition-colors hover:bg-[#93191d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Sending code…" : "Continue"}
              </button>
            </form>
          ) : (
            <form className="flex flex-col gap-4" onSubmit={handlePasswordSubmit}>
              <input
                type="email"
                required
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                className={inputClass}
              />
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={submitting}
                className={inputClass}
              />

              {error && (
                <p className="px-2 text-[13px] text-[#af2525]" role="alert">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="mt-2 h-[50px] w-full rounded-[25px] bg-[#af2525] text-[16px] font-semibold text-white transition-colors hover:bg-[#93191d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Signing in…" : "Sign In"}
              </button>
            </form>
          )}

          {/* Password login toggle — disabled for now
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === "otp" ? "password" : "otp"));
              setError(null);
            }}
            className="mt-4 text-[14px] font-medium text-[#af2525] hover:underline"
          >
            {mode === "otp"
              ? "Sign in with password instead"
              : "Sign in with email code instead"}
          </button>
          */}

          <div className="mt-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[rgba(186,186,186,0.4)]" />
            <span className="text-[13px] text-[rgba(10,10,10,0.4)]">or</span>
            <div className="h-px flex-1 bg-[rgba(186,186,186,0.4)]" />
          </div>

          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="mt-6 flex h-[50px] w-full items-center justify-center gap-3 rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white text-[15px] font-medium text-[#161515] transition-colors hover:bg-[#f9f9f9]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-5 text-[14px] text-[#161515]">
            New to UNO?{" "}
            <Link
              href="/signup"
              className="font-semibold text-[#af2525] hover:underline"
            >
              Create Account
            </Link>
          </p>

          <p className="mt-6 text-center text-[12px] leading-relaxed text-[rgba(10,10,10,0.4)]">
            By signing in you agree to Uno&apos;s{" "}
            <Link href="/terms" className="underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
