"use client";

import Link from "next/link";
import { Search, Home, ChevronDown, Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserStore } from "@/stores/userStore";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

export function Header({ className }: { className?: string }) {
  const user = useUserStore((s) => s.user);
  const initials = user?.name ? getInitials(user.name) : "U";
  const firstName = user?.name?.split(" ")[0] ?? "Account";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-black/10 bg-[#fbfbfb]",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-10">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-1.5">
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

        {/* Search — desktop only */}
        <div className="hidden h-12 w-[434px] items-center rounded-[40px] border border-[rgba(186,186,186,0.65)] px-6 md:flex">
          <div className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full bg-[#af2525]">
            <Search className="h-[14px] w-[14px] text-white" strokeWidth={2.5} />
          </div>
          <input
            type="text"
            placeholder="City, Address, ZIP"
            className="ml-2 flex-1 bg-transparent text-[16px] font-normal text-black outline-none placeholder:text-[rgba(10,10,10,0.4)]"
          />
        </div>

        {/* User info — desktop only */}
        <div className="hidden items-center gap-2 md:flex">
          <span className="text-[16px] font-normal text-black">{firstName}</span>
          <div className="flex items-center gap-px">
            <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#af2525]">
              <span className="text-[15px] font-normal tracking-[-0.3px] text-white">
                {initials}
              </span>
            </div>
            <ChevronDown className="h-6 w-6 text-black" strokeWidth={1.5} />
          </div>
        </div>

        {/* Mobile right */}
        <div className="flex items-center gap-3 md:hidden">
          <Link
            href="/search"
            className="text-[14px] font-normal tracking-[-0.28px] text-black/60"
          >
            Search
          </Link>
          <button aria-label="Open menu" className="flex h-6 w-6 items-center justify-center">
            <Menu className="h-6 w-6 text-black" strokeWidth={1.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
