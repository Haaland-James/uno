"use client";

import { signOutAndToast } from "@/lib/auth-actions";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { X, Building2, ShoppingBag, FileText, Briefcase, Home, MapPin, LogIn, UserPlus, LogOut, User as UserIcon, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthModalStore } from "@/stores/authModalStore";

interface Props {
  open: boolean;
  onClose: () => void;
}

const BROWSE_LINKS = [
  { label: "For Rent", href: "/properties/rent", icon: Home },
  { label: "For Sale", href: "/properties/sale", icon: ShoppingBag },
  { label: "For Lease", href: "/properties/lease", icon: FileText },
  { label: "Commercial", href: "/properties?type=COMMERCIAL", icon: Building2 },
  { label: "Land", href: "/properties?type=LAND", icon: MapPin },
];

const FOOTER_LINKS = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Help", href: "/help" },
  { label: "About", href: "/about" },
];

export function GuestMobileDrawer({ open, onClose }: Props) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const openLogin = useAuthModalStore((s) => s.openLogin);
  const openSignup = useAuthModalStore((s) => s.openSignup);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden
        className={cn(
          "fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />
      <aside
        role="dialog"
        aria-modal
        aria-label="Menu"
        className={cn(
          "fixed right-0 top-0 z-[70] flex h-full w-[85%] max-w-[340px] flex-col bg-[#fbfbfb] shadow-2xl transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 px-5">
          <span className="text-[18px] font-semibold text-black">Menu</span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
          >
            <X size={22} strokeWidth={1.8} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          {/* Auth state */}
          {isAuthed ? (
            <div className="mb-4 rounded-[12px] bg-white border border-black/5 p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#af2525] text-[14px] font-semibold text-white">
                  {(session?.user?.name ?? "U").slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-semibold text-black">{session?.user?.name}</div>
                  <div className="truncate text-[12px] text-black/50">{session?.user?.email}</div>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link href="/feed" onClick={onClose} className="flex items-center justify-center gap-1.5 rounded-full bg-[#af2525] py-2 text-[13px] font-medium text-white">
                  Feed
                </Link>
                <Link href="/profile" onClick={onClose} className="flex items-center justify-center gap-1.5 rounded-full border border-black/15 py-2 text-[13px] font-medium text-black">
                  <UserIcon size={14} /> Profile
                </Link>
              </div>
            </div>
          ) : (
            <div className="mb-4 grid grid-cols-2 gap-2">
              <button
                onClick={() => { onClose(); openLogin(); }}
                className="flex items-center justify-center gap-1.5 rounded-full border border-black/15 bg-white py-2.5 text-[14px] font-medium text-black"
              >
                <LogIn size={15} /> Sign in
              </button>
              <button
                onClick={() => { onClose(); openSignup(); }}
                className="flex items-center justify-center gap-1.5 rounded-full bg-[#af2525] py-2.5 text-[14px] font-medium text-white"
              >
                <UserPlus size={15} /> Sign up
              </button>
            </div>
          )}

          {/* Browse */}
          <div className="text-[11px] font-semibold uppercase tracking-wider text-black/40 px-3 mb-2">Browse</div>
          <nav className="flex flex-col gap-1 mb-4">
            {BROWSE_LINKS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-[12px] px-3 py-3 transition-colors",
                    isActive ? "bg-[#fff5f5] text-[#af2525]" : "text-black hover:bg-black/5"
                  )}
                >
                  <Icon size={18} />
                  <span className="text-[15px] font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Authed-only quick links */}
          {isAuthed && (
            <>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-black/40 px-3 mb-2">Your stuff</div>
              <nav className="flex flex-col gap-1 mb-4">
                <Link href="/favourites" onClick={onClose} className="flex items-center gap-3 rounded-[12px] px-3 py-3 hover:bg-black/5">
                  <Heart size={18} /> <span className="text-[15px] font-medium">Favourites</span>
                </Link>
                <Link href="/listing/properties/new" onClick={onClose} className="flex items-center gap-3 rounded-[12px] px-3 py-3 hover:bg-black/5">
                  <Briefcase size={18} /> <span className="text-[15px] font-medium">List a Property</span>
                </Link>
                <button
                  onClick={() => { onClose(); signOutAndToast(); }}
                  className="flex items-center gap-3 rounded-[12px] px-3 py-3 text-left hover:bg-black/5"
                >
                  <LogOut size={18} /> <span className="text-[15px] font-medium">Sign out</span>
                </button>
              </nav>
            </>
          )}
        </div>

        {/* Footer links */}
        <div className="shrink-0 border-t border-black/10 px-5 py-4 flex flex-wrap gap-x-4 gap-y-1">
          {FOOTER_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={onClose} className="text-[12px] text-black/50 hover:text-black">
              {l.label}
            </Link>
          ))}
        </div>
      </aside>
    </>
  );
}
