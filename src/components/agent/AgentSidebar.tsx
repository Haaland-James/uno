"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
	LayoutDashboard,
	Home,
	Users,
	UserCircle,
	LogOut,
	ExternalLink,
	X,
	Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAndToast } from "@/lib/auth-actions";

type NavItem = {
	href: string;
	label: string;
	icon: typeof LayoutDashboard;
};

const NAV: NavItem[] = [
	{ href: "/agent", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/agent/listings", label: "My Listings", icon: Home },
	{ href: "/agent/owners", label: "Property Owners", icon: Users },
	{ href: "/agent/profile", label: "My Profile", icon: UserCircle },
];

function isActive(pathname: string, href: string) {
	if (href === "/agent") return pathname === "/agent";
	return pathname === href || pathname.startsWith(`${href}/`);
}

function NavList({
	pathname,
	onNavigate,
}: {
	pathname: string;
	onNavigate?: () => void;
}) {
	return (
		<nav className="flex flex-col gap-0.5 px-2">
			{NAV.map((item) => {
				const active = isActive(pathname, item.href);
				const Icon = item.icon;
				return (
					<Link
						key={item.href}
						href={item.href}
						onClick={onNavigate}
						className={cn(
							"flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
							active
								? "bg-white/10 text-white border-l-2 border-uno-red pl-[10px]"
								: "text-white/70 hover:bg-white/5 hover:text-white"
						)}
					>
						<Icon className="h-4 w-4 shrink-0" />
						<span>{item.label}</span>
					</Link>
				);
			})}
		</nav>
	);
}

function SidebarFooter({ email }: { email: string | null | undefined }) {
	return (
		<div className="mt-auto flex flex-col gap-1 border-t border-white/10 p-3">
			{email && (
				<div className="px-2 py-2 text-xs text-white/60 truncate" title={email}>
					{email}
				</div>
			)}
			<Link
				href="/listing/properties/new"
				className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
			>
				<Home className="h-4 w-4" />
				New listing
			</Link>
			<Link
				href="/feed"
				className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors"
			>
				<ExternalLink className="h-4 w-4" />
				Back to site
			</Link>
			<button
				type="button"
				onClick={() => signOutAndToast("/agent/login")}
				className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/5 hover:text-white transition-colors text-left"
			>
				<LogOut className="h-4 w-4" />
				Sign out
			</button>
		</div>
	);
}

/**
 * Desktop sidebar — 240px, dark surface, sticky full-height.
 * Mirrors AdminSidebar so the two staff portals feel like one product.
 */
export function AgentSidebar({ email }: { email?: string | null }) {
	const pathname = usePathname();
	return (
		<aside className="hidden md:flex md:flex-col md:w-[240px] md:h-screen md:sticky md:top-0 bg-[#1a1717] text-white">
			<div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
				<div className="text-lg font-bold tracking-tight">
					UNO <span className="text-uno-red">Agents</span>
				</div>
			</div>
			<div className="flex-1 overflow-y-auto py-3">
				<NavList pathname={pathname} />
			</div>
			<SidebarFooter email={email} />
		</aside>
	);
}

export function AgentMobileMenu({ email }: { email?: string | null }) {
	const pathname = usePathname();
	const [open, setOpen] = useState(false);

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				aria-label="Open agent menu"
				className="md:hidden inline-flex items-center justify-center rounded-md p-2 text-white/80 hover:bg-white/10"
			>
				<Menu className="h-5 w-5" />
			</button>

			{open && (
				<div
					className="md:hidden fixed inset-0 z-50"
					role="dialog"
					aria-modal="true"
				>
					<button
						type="button"
						aria-label="Close menu"
						onClick={() => setOpen(false)}
						className="absolute inset-0 bg-black/50"
					/>
					<div className="absolute inset-y-0 left-0 flex w-[260px] flex-col bg-[#1a1717] text-white shadow-xl">
						<div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
							<div className="text-lg font-bold tracking-tight">
								UNO <span className="text-uno-red">Agents</span>
							</div>
							<button
								type="button"
								onClick={() => setOpen(false)}
								aria-label="Close menu"
								className="rounded-md p-1 text-white/80 hover:bg-white/10"
							>
								<X className="h-5 w-5" />
							</button>
						</div>
						<div className="flex-1 overflow-y-auto py-3">
							<NavList pathname={pathname} onNavigate={() => setOpen(false)} />
						</div>
						<SidebarFooter email={email} />
					</div>
				</div>
			)}
		</>
	);
}
