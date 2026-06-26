"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { requestOtp, verifyOtpAndSignIn } from "@/lib/authClient";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const mode = (searchParams.get("mode") ?? "LOGIN") as "SIGNUP" | "LOGIN";
  const name = searchParams.get("name") ?? undefined;
  const phone = searchParams.get("phone") ?? undefined;
  // Default landing after auth: /feed (the authed home).
  // Honour an explicit ?callbackUrl=… (set by middleware on protected-route bounces).
  const callbackUrl = searchParams.get("callbackUrl") ?? "/feed";
  const devCode = searchParams.get("devCode");

  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentBanner, setResentBanner] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (devCode && !code) setCode(devCode);
  }, [devCode, code]);

  useEffect(() => {
    if (mode !== "LOGIN" || !email) return;
    fetch("/api/auth/has-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then((r) => r.json())
      .then((d) => setHasPassword(d.hasPassword))
      .catch(() => {});
  }, [email, mode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Missing email — start over from sign up.");
      return;
    }
    setSubmitting(true);
    setError(null);

    if (usePassword) {
      const result = await signIn("password", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid password");
        setSubmitting(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
      return;
    }

    const result = await verifyOtpAndSignIn({
      email,
      code,
      purpose: mode,
      name,
      phone,
      callbackUrl,
    });

    if (!result.ok) {
      setError(result.error ?? "Verification failed");
      setSubmitting(false);
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setResentBanner(null);

    const result = await requestOtp({ email, purpose: mode, name, phone });

    if (!result.ok) {
      setError(result.error ?? "Could not resend code");
    } else {
      setResentBanner(
        result.devCode
          ? `New code sent. (Dev: ${result.devCode})`
          : "New code sent. Check your inbox."
      );
      if (result.devCode) setCode(result.devCode);
    }
    setResending(false);
  }

  return (
    <>
      <AuthHeader mode="verify" />

      <div className="flex flex-1 items-center justify-center px-5 py-16 md:py-24">
        <div className="w-full max-w-[380px]">
          <h1 className="mb-3 text-center text-[32px] font-semibold leading-tight text-[#161515] md:text-[36px]">
            Let&apos;s Make Sure
            <br />
            you&apos;re Legit
          </h1>

          <p className="mb-8 text-center text-[14px] text-[rgba(10,10,10,0.4)]">
            Please verify your email address
          </p>

          <div className="mb-6 flex h-[50px] w-full items-center rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-[#faf9f9] px-5">
            <span className="text-[15px] text-[#161515]">
              {email || "your@email.com"}
            </span>
          </div>

          <form className="flex flex-col" onSubmit={handleSubmit}>
            {usePassword ? (
              <>
                <p className="mb-3 text-[13px] leading-relaxed text-[rgba(10,10,10,0.4)]">
                  Enter your password
                </p>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  className="mb-2 h-[50px] w-full rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-[15px] text-[#161515] placeholder:text-[rgba(10,10,10,0.4)] focus:border-[#af2525] focus:outline-none focus:ring-1 focus:ring-[#af2525] disabled:opacity-60"
                />
              </>
            ) : (
              <>
                <p className="mb-3 text-[13px] leading-relaxed text-[rgba(10,10,10,0.4)]">
                  Enter the 6-digit code we sent to your email
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="••••••"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  maxLength={6}
                  disabled={submitting}
                  className="mb-2 h-[50px] w-full rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-center text-[18px] tracking-[0.3em] text-[#161515] placeholder:text-[rgba(10,10,10,0.4)] placeholder:tracking-normal focus:border-[#af2525] focus:outline-none focus:ring-1 focus:ring-[#af2525] disabled:opacity-60"
                />
              </>
            )}

            {error && (
              <p className="mb-3 text-center text-[13px] text-[#af2525]" role="alert">
                {error}
              </p>
            )}
            {resentBanner && !usePassword && (
              <p className="mb-3 text-center text-[13px] text-green-700">{resentBanner}</p>
            )}

            <button
              type="submit"
              disabled={submitting || (usePassword ? !password : code.length !== 6)}
              className="mt-3 h-[50px] w-full rounded-[25px] bg-[#af2525] text-[16px] font-semibold text-white transition-colors hover:bg-[#93191d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? usePassword ? "Signing in…" : "Verifying…"
                : usePassword ? "Sign In" : "Confirm Verification"}
            </button>
          </form>

          <div className="mt-5 flex flex-col items-center gap-2">
            {!usePassword && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[14px] font-medium text-[#af2525] underline transition-colors hover:text-[#93191d] disabled:opacity-60"
              >
                {resending ? "Sending…" : "Re-send verification code"}
              </button>
            )}

            {hasPassword && (
              <button
                type="button"
                onClick={() => {
                  setUsePassword((v) => !v);
                  setError(null);
                }}
                className="text-[14px] font-medium text-[#161515]/60 hover:text-[#161515] transition-colors"
              >
                {usePassword ? "Use verification code instead" : "Use password instead"}
              </button>
            )}
          </div>

          <p className="mt-6 text-center text-[12px] leading-relaxed text-[rgba(10,10,10,0.4)]">
            By confirming your verification, you agree to Uno&apos;s{" "}
            <Link href="/terms" className="underline">
              Terms of Use
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </div>
    </>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
