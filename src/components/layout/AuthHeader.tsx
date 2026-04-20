"use client";

import Link from "next/link";
import { Home } from "lucide-react";
import { cn } from "@/lib/utils";

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
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#f5d0d0]">
            <Home className="h-[18px] w-[18px] text-[#af2525]" strokeWidth={2.5} />
          </div>
          <span className="text-[28px] font-normal leading-none text-[#af2525]">
            uno
          </span>
        </Link>
      </div>

      {/* Mobile: logo left, auth link right */}
      <div className="mx-auto flex h-16 items-center justify-between px-4 md:hidden">
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#f5d0d0]">
            <Home className="h-[14px] w-[14px] text-[#af2525]" strokeWidth={2.5} />
          </div>
          <span className="text-[22px] font-normal leading-none text-[#af2525]">
            uno
          </span>
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
