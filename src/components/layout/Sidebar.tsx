"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Rss, Heart, BookmarkCheck, Home, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  iconBg: string;
}

const navItems: NavItem[] = [
  {
    label: "Find",
    href: "/search",
    icon: <Search size={18} strokeWidth={2} />,
    iconBg: "#ffcfcf",
  },
  {
    label: "Your feed",
    href: "/feed",
    icon: <Rss size={18} strokeWidth={2} />,
    iconBg: "#68e382",
  },
  {
    label: "Favourites",
    href: "/favourites",
    icon: <Heart size={18} strokeWidth={2} />,
    iconBg: "#e36868",
  },
  {
    label: "Saved Searches",
    href: "/saved-searches",
    icon: <BookmarkCheck size={18} strokeWidth={2} />,
    iconBg: "#db8ff6",
  },
  {
    label: "My House",
    href: "/profile",
    icon: <Home size={18} strokeWidth={2} />,
    iconBg: "#dd6bb1",
  },
  {
    label: "Profile",
    href: "/profile",
    icon: <User size={18} strokeWidth={2} />,
    iconBg: "#81cdc8",
  },
];

const footerLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Help", href: "/help" },
  { label: "About", href: "/about" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-[250px] h-full bg-[#fbfbfb] px-[14px] py-[35px] shrink-0">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={cn(
                "flex items-center gap-3 h-[52px] px-[14px] py-[8px] rounded-[50px] transition-colors",
                isActive ? "bg-[#fff1f1]" : "hover:bg-[#f5f5f5]"
              )}
            >
              <span
                className="inline-flex items-center justify-center w-[35px] h-[35px] rounded-[17.5px] shrink-0 text-white"
                style={{ backgroundColor: item.iconBg }}
              >
                {item.icon}
              </span>
              <span className="text-[20px] font-medium text-black font-sans leading-none">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-wrap gap-x-2 gap-y-1">
        {footerLinks.map((link, index) => (
          <span key={link.href} className="flex items-center">
            <Link
              href={link.href}
              className="text-[16px] font-medium text-black/60 hover:text-black transition-colors font-sans"
            >
              {link.label}
            </Link>
            {index < footerLinks.length - 1 && (
              <span className="ml-2 text-[16px] text-black/40">·</span>
            )}
          </span>
        ))}
      </div>
    </aside>
  );
}
