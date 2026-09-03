"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/shared/Logo";

interface AuthHeaderProps {
  /** Which page we're on — determines the opposite link shown */
  mode: "login" | "signup" | "verify";
  className?: string;
}

export function AuthHeader({ mode, className }: AuthHeaderProps) {
  const linkHref = mode === "login" ? "/signup" : "/login";
  const linkLabel = mode === "login" ? "Sign up" : "Sign In";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-black/10 bg-[#fbfbfb]",
        className
      )}
    >
      {/* Desktop: centered logo only */}
      <div className="mx-auto hidden h-16 max-w-[1440px] items-center justify-center px-10 md:flex">
        <Link href="/" className="flex items-center">
          <Logo className="h-8 w-auto" />
        </Link>
      </div>

      {/* Mobile: logo left, auth link right */}
      <div className="mx-auto flex h-16 items-center justify-between px-4 md:hidden">
        <Link href="/" className="flex items-center">
          <Logo className="h-6 w-auto" />
        </Link>

        {mode !== "verify" && (
          <Link
            href={linkHref}
            className="text-[14px] font-medium text-black/60 transition-colors hover:text-[#af2525]"
          >
            {linkLabel}
          </Link>
        )}
      </div>
    </header>
  );
}
