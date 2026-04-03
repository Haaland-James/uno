"use client";

import Link from "next/link";
import { Home, Menu } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Buy", href: "/search?purpose=buy" },
  { label: "Rent", href: "/feed" },
  { label: "Commercial", href: "/search?purpose=commercial" },
];

export function GuestHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-black/10 bg-[#fbfbfb]",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-10">
        {/* Logo — smaller on mobile (29px), full-size on desktop (38px) */}
        <Link href="/" className="flex items-center gap-1.5">
          <div className="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#f5d0d0] md:h-[38px] md:w-[38px]">
            <Home
              className="h-[14px] w-[14px] text-[#af2525] md:h-[18px] md:w-[18px]"
              strokeWidth={2.5}
            />
          </div>
          <span className="text-[22px] font-normal leading-none text-[#af2525] md:text-[28px]">
            uno
          </span>
        </Link>

        {/* Centre nav — desktop only */}
        <nav className="hidden items-center gap-[62px] rounded-[45px] bg-[rgba(238,238,238,0.2)] px-[67px] py-3 backdrop-blur-sm md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[16px] font-normal text-black transition-colors hover:text-[#af2525]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — desktop: pill CTA / mobile: "Sign In" text + hamburger */}
        <Link
          href="/login"
          className="hidden h-[41px] items-center justify-center rounded-full bg-[#af2525] px-7 text-[15px] font-normal tracking-[-0.3px] text-white transition-colors hover:bg-[#93191d] md:flex"
        >
          Join / Sign In
        </Link>

        <div className="flex items-center md:hidden">
          <Link
            href="/login"
            className="flex h-7 items-center px-[18px] text-[14px] font-normal tracking-[-0.28px] text-black/60"
          >
            Sign In
          </Link>
          <button
            aria-label="Open menu"
            className="flex h-6 w-6 items-center justify-center"
          >
            <Menu className="h-6 w-6 text-black" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
