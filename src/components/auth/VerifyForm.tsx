"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { requestOtp, verifyOtpAndSignIn } from "@/lib/authClient";

interface VerifyFormProps {
  email: string;
  mode: "SIGNUP" | "LOGIN";
  name?: string;
  phone?: string;
  /** Code captured from the previous step (only set in dev). Pre-fills the input. */
  initialDevCode?: string;
  /** Called when verification succeeds and the session is established. */
  onSuccess: () => void;
}

export function VerifyForm({
  email,
  mode,
  name,
  phone,
  initialDevCode,
  onSuccess,
}: VerifyFormProps) {
  const [code, setCode] = useState(initialDevCode ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resentBanner, setResentBanner] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (initialDevCode && !code) setCode(initialDevCode);
  }, [initialDevCode, code]);

  useEffect(() => {
    if (mode !== "LOGIN") return;
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

      onSuccess();
      return;
    }

    const result = await verifyOtpAndSignIn({
      email,
      code,
      purpose: mode,
      name,
      phone,
    });

    if (!result.ok) {
      setError(result.error ?? "Verification failed");
      setSubmitting(false);
      return;
    }

    onSuccess();
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
    <form className="flex flex-col" onSubmit={handleSubmit}>
      <h2 className="mb-2 text-center text-[28px] font-semibold leading-tight text-[#161515] md:text-[32px]">
        Let&apos;s Make Sure
        <br />
        you&apos;re Legit
      </h2>
      <p className="mb-6 text-center text-[14px] text-[rgba(10,10,10,0.4)]">
        Please verify your email address
      </p>

      <div className="mb-5 flex h-[50px] w-full items-center rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-[#faf9f9] px-5">
        <span className="text-[15px] text-[#161515]">{email}</span>
      </div>

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
        className="mt-3 flex h-[50px] w-full items-center justify-center gap-2 rounded-[25px] bg-[#af2525] text-[16px] font-semibold text-white transition-colors hover:bg-[#93191d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {usePassword ? "Signing in…" : "Verifying…"}
          </>
        ) : usePassword ? (
          "Sign In"
        ) : (
          "Confirm Verification"
        )}
      </button>

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
    </form>
  );
}
