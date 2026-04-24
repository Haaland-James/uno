"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Home, Menu, ChevronDown, LogOut, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/stores/authModalStore";

const NAV_LINKS = [
  { label: "Buy", href: "/search?purpose=buy" },
  { label: "Rent", href: "/feed" },
  { label: "Commercial", href: "/search?purpose=commercial" },
];

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function GuestHeader({ className }: { className?: string }) {
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const openLogin = useAuthModalStore((s) => s.openLogin);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menuOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-black/10 bg-[#fbfbfb]",
        className
      )}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 md:px-10">
        {/* Logo */}
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

        {/* Right — desktop */}
        <div className="hidden md:block">
          {isAuthed ? (
            <div ref={menuRef} className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                className="flex h-[41px] items-center gap-2 rounded-full border border-black/10 bg-white px-3 transition-colors hover:bg-[#faf9f9]"
              >
                <span className="text-[14px] font-medium text-black/70">Account</span>
                <span className="flex h-[28px] w-[28px] items-center justify-center rounded-full bg-[#af2525] text-[12px] font-semibold text-white">
                  {getInitials(session?.user?.name)}
                </span>
                <ChevronDown size={14} className="text-black/40" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-[200px] overflow-hidden rounded-[12px] border border-black/10 bg-white shadow-lg">
                  <Link
                    href="/feed"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-[14px] text-black/80 transition-colors hover:bg-[#faf9f9]"
                  >
                    Go to Feed
                  </Link>
                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-[14px] text-black/80 transition-colors hover:bg-[#faf9f9]"
                  >
                    <UserIcon size={16} className="text-black/50" />
                    Profile
                  </Link>
                  <div className="border-t border-black/5" />
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      signOut({ callbackUrl: "/" });
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-black/80 transition-colors hover:bg-[#faf9f9]"
                  >
                    <LogOut size={16} className="text-black/50" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openLogin()}
              className="flex h-[41px] items-center justify-center rounded-full bg-[#af2525] px-7 text-[15px] font-normal tracking-[-0.3px] text-white transition-colors hover:bg-[#93191d]"
            >
              Join / Sign In
            </button>
          )}
        </div>

        {/* Right — mobile */}
        <div className="flex items-center gap-[12px] md:hidden">
          {isAuthed ? (
            <Link href="/feed" className="flex items-center gap-2">
              <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#af2525] text-[12px] font-semibold text-white">
                {getInitials(session?.user?.name)}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => openLogin()}
              className="text-[14px] font-normal tracking-[-0.28px] text-black/60"
            >
              Sign In
            </button>
          )}
          <button
            aria-label="Open menu"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#af2525]"
          >
            <Menu className="h-[16px] w-[16px] text-white" strokeWidth={2} />
          </button>
        </div>
      </div>
    </header>
  );
}
