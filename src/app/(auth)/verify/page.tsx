"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthHeader } from "@/components/layout/AuthHeader";

function VerifyForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const [code, setCode] = useState("");

  return (
    <>
      <AuthHeader mode="verify" />

      <div className="flex flex-1 items-center justify-center px-5 py-16 md:py-24">
        <div className="w-full max-w-[380px]">
          {/* Heading */}
          <h1 className="mb-3 text-center text-[32px] font-semibold leading-tight text-[#161515] md:text-[36px]">
            Let&apos;s Make Sure
            <br />
            you&apos;re Legit
          </h1>

          {/* Subtitle */}
          <p className="mb-8 text-center text-[14px] text-[rgba(10,10,10,0.4)]">
            Please verify your email address
          </p>

          {/* Email display */}
          <div className="mb-6 flex h-[50px] w-full items-center rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-[#faf9f9] px-5">
            <span className="text-[15px] text-[rgba(10,10,10,0.4)]">
              {email || "your@email.com"}
            </span>
          </div>

          {/* Code instruction */}
          <p className="mb-3 text-[13px] leading-relaxed text-[rgba(10,10,10,0.4)]">
            Enter verification code we sent to your email address
          </p>

          {/* Code input */}
          <form
            className="flex flex-col"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="text"
              placeholder="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              className="mb-6 h-[50px] w-full rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-center text-[18px] tracking-[0.3em] text-[#161515] placeholder:text-[rgba(10,10,10,0.4)] placeholder:tracking-normal focus:border-[#af2525] focus:outline-none focus:ring-1 focus:ring-[#af2525]"
            />

            {/* Confirm Button */}
            <button
              type="submit"
              className="h-[50px] w-full rounded-[25px] bg-[#af2525] text-[16px] font-semibold text-white transition-colors hover:bg-[#93191d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2"
            >
              Confirm Verification
            </button>
          </form>

          {/* Resend */}
          <div className="mt-5 text-center">
            <button
              type="button"
              className="text-[14px] font-medium text-[#af2525] underline transition-colors hover:text-[#93191d]"
            >
              Re-send verification code
            </button>
          </div>

          {/* Terms */}
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
