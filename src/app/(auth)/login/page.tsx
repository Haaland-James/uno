"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthHeader } from "@/components/layout/AuthHeader";
import { requestOtp } from "@/lib/authClient";

export default function LoginPage() {
  const router = useRouter();
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

    const params = new URLSearchParams({ email, mode: "LOGIN" });
    if (result.devCode) params.set("devCode", result.devCode);
    router.push(`/verify?${params.toString()}`);
  }

  return (
    <>
      <AuthHeader mode="login" />

      <div className="flex flex-1 items-center justify-center px-5 py-16 md:py-24">
        <div className="w-full max-w-[380px]">
          <h1 className="mb-10 text-[32px] font-semibold leading-tight text-[#161515] md:mb-12 md:text-[36px]">
            Sign in
          </h1>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
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
              className="mt-2 h-[50px] w-full rounded-[25px] bg-[#af2525] text-[16px] font-semibold text-white transition-colors hover:bg-[#93191d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? "Sending code…" : "Continue"}
            </button>
          </form>

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
