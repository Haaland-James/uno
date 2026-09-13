"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Rss, Heart, BookmarkCheck, Settings, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const guestItems = [
	{ href: "/find", label: "Search", icon: Search },
	{ href: "/favourites", label: "Favourites", icon: Heart },
	{ href: "/login", label: "Login", icon: LogIn },
];

const authItems = [
	{ href: "/find", label: "Search", icon: Search },
	{ href: "/feed", label: "Feed", icon: Rss },
	{ href: "/favourites", label: "Favourites", icon: Heart },
	{ href: "/saved-searches", label: "Saved", icon: BookmarkCheck },
	{ href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
	const pathname = usePathname();
	const { status } = useSession();
	const isAuthed = status === "authenticated";
	const navItems = isAuthed ? authItems : guestItems;

	const [visible, setVisible] = useState(true);
	const lastScrollY = useRef(0);
	const ticking = useRef(false);

	useEffect(() => {
		function onScroll() {
			if (ticking.current) return;
			ticking.current = true;
			requestAnimationFrame(() => {
				const currentY = window.scrollY;
				const delta = currentY - lastScrollY.current;
				if (delta > 0 && currentY > 80) {
					setVisible(false);
				} else if (delta < -3) {
					setVisible(true);
				}
				lastScrollY.current = currentY;
				ticking.current = false;
			});
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<nav
			className={cn(
				"md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[16px] border-t border-black/[0.06] shadow-[0_-4px_20px_rgba(0,0,0,0.08)] safe-area-bottom transition-transform duration-300",
				visible ? "translate-y-0" : "translate-y-full"
			)}
		>
			<div className="flex items-center justify-around px-2">
				{navItems.map((item) => {
					const isActive =
						pathname === item.href || pathname?.startsWith(`${item.href}/`);
					const Icon = item.icon;

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex flex-col items-center justify-center gap-1 py-2.5 px-3 min-h-touch transition-colors duration-200",
								isActive
									? "text-[#af2525]"
									: "text-black/40 hover:text-black/60"
							)}
						>
							<div className="relative">
								<Icon
									className={cn("h-6 w-6", isActive && "stroke-[2.5px]")}
								/>
								{isActive && (
									<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-[#af2525]" />
								)}
							</div>
							<span className="text-[11px] font-medium leading-none">
								{item.label}
							</span>
						</Link>
					);
				})}
			</div>

			{/* Safe area spacer for phones with home indicator */}
			<div className="h-safe-area-inset-bottom" />
		</nav>
	);
}
