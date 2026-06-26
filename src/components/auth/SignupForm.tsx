"use client";

import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { ChevronDown, Loader2 } from "lucide-react";
import { requestOtp } from "@/lib/authClient";

const COUNTRY_CODES = [
  { code: "+234", country: "NG", flag: "🇳🇬" },
  { code: "+1", country: "US", flag: "🇺🇸" },
  { code: "+44", country: "GB", flag: "🇬🇧" },
  { code: "+233", country: "GH", flag: "🇬🇭" },
  { code: "+254", country: "KE", flag: "🇰🇪" },
  { code: "+27", country: "ZA", flag: "🇿🇦" },
];

interface SignupFormProps {
  onCodeSent: (args: { email: string; name: string; phone?: string; devCode?: string }) => void;
  onSwitchToLogin?: () => void;
}

export function SignupForm({ onCodeSent, onSwitchToLogin }: SignupFormProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCode, setSelectedCode] = useState(COUNTRY_CODES[0]);
  const [codeOpen, setCodeOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setCodeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
    if (!fullName) {
      setError("Please enter your name");
      return;
    }
    const fullPhone = phone.trim() ? `${selectedCode.code}${phone.trim().replace(/^0/, "")}` : "";

    setSubmitting(true);
    const result = await requestOtp({
      email,
      purpose: "SIGNUP",
      name: fullName,
      phone: fullPhone || undefined,
    });

    if (!result.ok) {
      setError(result.error ?? "Could not send code");
      setSubmitting(false);
      return;
    }

    onCodeSent({ email, name: fullName, phone: fullPhone || undefined, devCode: result.devCode });
  }

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <h2 className="mb-1 text-[28px] font-semibold leading-tight text-[#161515] md:text-[32px]">
        Create Account
      </h2>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="text"
          required
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          disabled={submitting}
          className="h-[50px] w-full rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-[15px] text-[#161515] placeholder:text-[rgba(10,10,10,0.4)] focus:border-[#af2525] focus:outline-none focus:ring-1 focus:ring-[#af2525] disabled:opacity-60"
        />
        <input
          type="text"
          required
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          disabled={submitting}
          className="h-[50px] w-full rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-[15px] text-[#161515] placeholder:text-[rgba(10,10,10,0.4)] focus:border-[#af2525] focus:outline-none focus:ring-1 focus:ring-[#af2525] disabled:opacity-60"
        />
      </div>

      <input
        type="email"
        required
        placeholder="Email Address"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={submitting}
        className="h-[50px] w-full rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white px-5 text-[15px] text-[#161515] placeholder:text-[rgba(10,10,10,0.4)] focus:border-[#af2525] focus:outline-none focus:ring-1 focus:ring-[#af2525] disabled:opacity-60"
      />

      <div className="relative flex h-[50px] w-full items-center rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white focus-within:border-[#af2525] focus-within:ring-1 focus-within:ring-[#af2525]">
        <div ref={dropdownRef} className="relative">
          <button
            type="button"
            onClick={() => setCodeOpen(!codeOpen)}
            className="flex items-center gap-1 pl-5 pr-2 text-[15px] text-[#161515]"
          >
            <span>{selectedCode.flag}</span>
            <span>{selectedCode.code}</span>
            <ChevronDown className="h-3.5 w-3.5 text-[rgba(10,10,10,0.4)]" />
          </button>
          {codeOpen && (
            <div className="absolute left-2 top-[calc(100%+8px)] z-50 w-[180px] rounded-[12px] border border-[rgba(186,186,186,0.65)] bg-white py-1 shadow-modal">
              {COUNTRY_CODES.map((item) => (
                <button
                  key={item.code}
                  type="button"
                  onClick={() => {
                    setSelectedCode(item);
                    setCodeOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-[14px] text-[#161515] transition-colors hover:bg-[#faf9f9]"
                >
                  <span>{item.flag}</span>
                  <span>{item.country}</span>
                  <span className="text-[rgba(10,10,10,0.4)]">{item.code}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="h-[24px] w-px bg-[rgba(186,186,186,0.65)]" />
        <input
          type="tel"
          placeholder="Phone Number (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={submitting}
          className="h-full flex-1 rounded-r-[25px] bg-transparent px-3 text-[15px] text-[#161515] placeholder:text-[rgba(10,10,10,0.4)] focus:outline-none disabled:opacity-60"
        />
      </div>

      {error && (
        <p className="px-2 text-[13px] text-[#af2525]" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !email || !firstName || !lastName}
        className="mt-1 flex h-[50px] w-full items-center justify-center gap-2 rounded-[25px] bg-[#af2525] text-[16px] font-semibold text-white transition-colors hover:bg-[#93191d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating account…
          </>
        ) : (
          "Continue"
        )}
      </button>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-[rgba(186,186,186,0.4)]" />
        <span className="text-[13px] text-[rgba(10,10,10,0.4)]">or</span>
        <div className="h-px flex-1 bg-[rgba(186,186,186,0.4)]" />
      </div>

      <button
        type="button"
        onClick={() => signIn("google", { callbackUrl: window.location.href })}
        className="flex h-[50px] w-full items-center justify-center gap-3 rounded-[25px] border border-[rgba(186,186,186,0.65)] bg-white text-[15px] font-medium text-[#161515] transition-colors hover:bg-[#f9f9f9]"
      >
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Continue with Google
      </button>

      {onSwitchToLogin && (
        <p className="mt-2 text-center text-[14px] text-[#161515]">
          Already have an Account?{" "}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-semibold text-[#af2525] hover:underline"
          >
            Sign in
          </button>
        </p>
      )}
    </form>
  );
}
