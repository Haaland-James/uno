"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Heart, User, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
	{ href: "/feed", label: "Home", icon: Home },
	{ href: "/search", label: "Search", icon: Search },
	{ href: "/favourites", label: "Saved", icon: Heart },
	{ href: "/profile", label: "Profile", icon: User },
];

export function MobileNav() {
	const pathname = usePathname();

	return (
		<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 safe-area-bottom">
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
								"flex flex-col items-center justify-center gap-0.5 py-2 px-3 min-h-touch transition-colors duration-200",
								isActive
									? "text-uno-red"
									: "text-content-muted hover:text-content-secondary"
							)}
						>
							<div className="relative">
								<Icon
									className={cn("h-5 w-5", isActive && "stroke-[2.5px]")}
								/>
								{isActive && (
									<span className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-uno-red" />
								)}
							</div>
							<span className="text-[10px] font-medium leading-none">
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
