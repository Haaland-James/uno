"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Search,
  Home,
  ChevronDown,
  ChevronLeft,
  Menu,
  Building2,
  Users,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "next-auth/react";
import { useUserStore } from "@/stores/userStore";
import { useHeaderStore } from "@/stores/headerStore";
import { MobileDrawer } from "@/components/layout/MobileDrawer";

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

const dropdownItems = [
  { label: "List Properties", href: "/landlord", icon: Building2 },
  { label: "Referrals", href: "/referrals", icon: Users },
  { label: "Help & Support", href: "/help", icon: HelpCircle },
];

export function Header({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const isPropertyDetail = pathname?.startsWith("/property/") ?? false;
  const user = useUserStore((s) => s.user);
  const logout = () => signOut({ callbackUrl: "/" });
  const showSearch = useHeaderStore((s) => s.showSearch);

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/find");
    }
  };

  const initials = user?.name ? getInitials(user.name) : "U";
  const firstName = user?.name?.split(" ")[0] ?? "Account";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [dropdownOpen]);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-black/10 bg-[#fbfbfb]",
        className
      )}
    >
      <div className="flex h-16 w-full items-center">
        {/* Left section — aligned with sidebar width (250px) on desktop */}
        <div className="flex h-full items-center px-4 md:px-6 lg:w-[250px] lg:px-[28px] lg:shrink-0">
          {isPropertyDetail && (
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5 md:hidden"
            >
              <ChevronLeft className="h-6 w-6 text-black" strokeWidth={2} />
            </button>
          )}
          <Link
            href="/find"
            className={cn(
              "items-center gap-1.5",
              isPropertyDetail ? "hidden md:flex" : "flex"
            )}
          >
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
        </div>

        {/* Right section — over main content area */}
        <div className="flex h-full flex-1 items-center justify-between px-4 md:px-8 lg:px-10">
          {/* Search — appears only when showSearch is true (desktop) */}
          <div
            className={cn(
              "hidden md:flex h-12 items-center rounded-[40px] border border-[rgba(186,186,186,0.65)] bg-white px-6 transition-all duration-300",
              showSearch
                ? "w-[434px] opacity-100"
                : "pointer-events-none w-0 border-transparent px-0 opacity-0"
            )}
          >
            <div className="flex h-[25px] w-[25px] shrink-0 items-center justify-center rounded-full bg-[#af2525]">
              <Search className="h-[14px] w-[14px] text-white" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              placeholder="City, Address, ZIP"
              className="ml-2 flex-1 bg-transparent text-[16px] font-normal text-black outline-none placeholder:text-[rgba(10,10,10,0.4)]"
            />
          </div>

          {/* Spacer to keep user section right-aligned when search is hidden */}
          {!showSearch && <div className="hidden md:block flex-1" />}

          {/* User info + dropdown — desktop only */}
          <div className="relative hidden items-center gap-2 md:flex" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex cursor-pointer items-center gap-2"
            >
              <span className="text-[16px] font-normal text-black">{firstName}</span>
              <div className="flex items-center gap-px">
                <div className="relative flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-full bg-[#af2525]">
                  {user?.photo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={user.photo}
                      alt={user.name ?? "Profile"}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[15px] font-normal tracking-[-0.3px] text-white">
                      {initials}
                    </span>
                  )}
                </div>
                <ChevronDown
                  className={cn(
                    "h-6 w-6 text-black transition-transform duration-200",
                    dropdownOpen && "rotate-180"
                  )}
                  strokeWidth={1.5}
                />
              </div>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[220px] rounded-[12px] border border-black/10 bg-white py-2 shadow-[0px_4px_17px_0px_rgba(0,0,0,0.1)]">
                {dropdownItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[15px] font-normal text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5]"
                    >
                      <Icon size={18} className="text-black/50" strokeWidth={1.5} />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="mx-4 my-1 border-t border-black/10" />

                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    logout();
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-[15px] font-normal text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5]"
                >
                  <LogOut size={18} className="text-black/50" strokeWidth={1.5} />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          {/* Mobile right — contextual search + hamburger */}
          <div className="ml-auto flex flex-1 items-center justify-end gap-3 md:hidden">
            <div
              className={cn(
                "flex h-10 items-center rounded-[40px] border border-[rgba(186,186,186,0.65)] bg-white transition-all duration-300",
                showSearch
                  ? "flex-1 max-w-[260px] px-3 opacity-100"
                  : "pointer-events-none w-0 border-transparent px-0 opacity-0"
              )}
            >
              <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full bg-[#af2525]">
                <Search className="h-[12px] w-[12px] text-white" strokeWidth={2.5} />
              </div>
              <input
                type="text"
                placeholder="Search location"
                className="ml-2 w-full min-w-0 bg-transparent text-[14px] font-normal text-black outline-none placeholder:text-[rgba(10,10,10,0.4)]"
              />
            </div>
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5"
            >
              <Menu className="h-6 w-6 text-black" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </header>
  );
}
