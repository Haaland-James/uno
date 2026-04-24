"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { requestOtp } from "@/lib/authClient";

interface LoginFormProps {
  /** Called once an OTP is successfully sent. Email + (in dev) the code are passed back. */
  onCodeSent: (args: { email: string; devCode?: string }) => void;
  onSwitchToSignup?: () => void;
}

export function LoginForm({ onCodeSent, onSwitchToSignup }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await requestOtp({ email, purpose: "LOGIN" });

    if (!result.ok) {
      setError(result.error ?? "Could not send code");
      setSubmitting(false);
      return;
    }

    onCodeSent({ email, devCode: result.devCode });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <h2 className="mb-2 text-[28px] font-semibold leading-tight text-[#161515] md:text-[32px]">
        Sign in
      </h2>

      <input
        type="email"
        required
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
        className="h-[50px] w-full rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-[15px] text-[#161515] placeholder:text-[rgba(10,10,10,0.4)] focus:border-[#af2525] focus:outline-none focus:ring-1 focus:ring-[#af2525] disabled:opacity-60"
      />

      {error && (
        <p className="px-2 text-[13px] text-[#af2525]" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !email}
        className="mt-1 flex h-[50px] w-full items-center justify-center gap-2 rounded-[25px] bg-[#af2525] text-[16px] font-semibold text-white transition-colors hover:bg-[#93191d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Sending code…
          </>
        ) : (
          "Continue"
        )}
      </button>

      {onSwitchToSignup && (
        <p className="mt-3 text-center text-[14px] text-[#161515]">
          New to UNO?{" "}
          <button
            type="button"
            onClick={onSwitchToSignup}
            className="font-semibold text-[#af2525] hover:underline"
          >
            Create Account
          </button>
        </p>
      )}
    </form>
  );
}
