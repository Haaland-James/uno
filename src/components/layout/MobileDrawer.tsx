"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	X,
	Search,
	Rss,
	Heart,
	BookmarkCheck,
	Building2,
	Users,
	HelpCircle,
	LogOut,
	BarChart3,
	Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOutAndToast } from "@/lib/auth-actions";
import { useUserStore } from "@/stores/userStore";
import { useHasListings } from "@/hooks/useHasListings";

interface MobileDrawerProps {
	open: boolean;
	onClose: () => void;
}

interface NavItem {
	label: string;
	href: string;
	icon: React.ReactNode;
	iconBg: string;
}

const navItems: NavItem[] = [
	{
		label: "Find",
		href: "/find",
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
		label: "Settings",
		href: "/profile",
		icon: <Settings size={18} strokeWidth={2} />,
		iconBg: "#81cdc8",
	},
];

const listingNavItems: NavItem[] = [
	{
		label: "My Listings",
		href: "/listing/properties",
		icon: <Building2 size={18} strokeWidth={2} />,
		iconBg: "#ffcfcf",
	},
	{
		label: "Analytics",
		href: "/listing/analytics",
		icon: <BarChart3 size={18} strokeWidth={2} />,
		iconBg: "#db8ff6",
	},
];

const accountItems = [
	{ label: "List Properties", href: "/listing/properties/new", icon: Building2 },
	{ label: "Referrals", href: "/referrals", icon: Users },
	{ label: "Help & Support", href: "/help", icon: HelpCircle },
];

const footerLinks = [
	{ label: "Privacy", href: "/privacy" },
	{ label: "Terms", href: "/terms" },
	{ label: "Help", href: "/help" },
	{ label: "About", href: "/about" },
];

function getInitials(name: string): string {
	return name
		.split(" ")
		.filter(Boolean)
		.slice(0, 2)
		.map((n) => n[0].toUpperCase())
		.join("");
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
	const pathname = usePathname();
	const user = useUserStore((s) => s.user);
	const logout = () => signOutAndToast();
	const { hasListings } = useHasListings();

	const initials = user?.name ? getInitials(user.name) : "U";

	// Lock body scroll while open + close on Escape
	useEffect(() => {
		if (!open) return;

		const originalOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		function handleKey(e: KeyboardEvent) {
			if (e.key === "Escape") onClose();
		}
		document.addEventListener("keydown", handleKey);

		return () => {
			document.body.style.overflow = originalOverflow;
			document.removeEventListener("keydown", handleKey);
		};
	}, [open, onClose]);

	return (
		<>
			{/* Backdrop */}
			<div
				onClick={onClose}
				aria-hidden="true"
				className={cn(
					"fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] transition-opacity duration-200 md:hidden",
					open ? "opacity-100" : "pointer-events-none opacity-0"
				)}
			/>

			{/* Drawer panel */}
			<aside
				role="dialog"
				aria-modal="true"
				aria-label="Menu"
				className={cn(
					"fixed right-0 top-0 z-[70] flex h-full w-[85%] max-w-[340px] flex-col bg-[#fbfbfb] shadow-2xl transition-transform duration-300 md:hidden",
					open ? "translate-x-0" : "translate-x-full"
				)}
			>
				{/* Header */}
				<div className="flex h-16 shrink-0 items-center justify-between border-b border-black/10 px-5">
					<div className="flex items-center gap-3">
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
						<div className="flex flex-col">
							<span className="text-[15px] font-semibold leading-tight text-black">
								{user?.name ?? "Account"}
							</span>
							{user?.email && (
								<span className="text-[12px] leading-tight text-black/50">
									{user.email}
								</span>
							)}
						</div>
					</div>
					<button
						onClick={onClose}
						aria-label="Close menu"
						className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
					>
						<X size={22} className="text-black" strokeWidth={1.8} />
					</button>
				</div>

				{/* Scrollable body */}
				<div className="flex-1 overflow-y-auto px-4 py-5">
					{/* Primary nav */}
					<nav className="flex flex-col gap-1">
						{navItems.map((item) => {
							const isActive = pathname === item.href;
							return (
								<Link
									key={`${item.label}-${item.href}`}
									href={item.href}
									onClick={onClose}
									className={cn(
										"flex items-center gap-3 rounded-[50px] px-3 py-[10px] transition-colors",
										isActive ? "bg-[#fff1f1]" : "hover:bg-black/5"
									)}
								>
									<span
										className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full text-white"
										style={{ backgroundColor: item.iconBg }}
									>
										{item.icon}
									</span>
									<span className="text-[17px] font-medium text-black">
										{item.label}
									</span>
								</Link>
							);
						})}
					</nav>

					{hasListings && (
						<>
							<div className="my-4 h-px bg-black/10" />
							<p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-black/40">
								Listings
							</p>
							<nav className="flex flex-col gap-1">
								{listingNavItems.map((item) => {
									const isActive = pathname === item.href;
									return (
										<Link
											key={`${item.label}-${item.href}`}
											href={item.href}
											onClick={onClose}
											className={cn(
												"flex items-center gap-3 rounded-[50px] px-3 py-[10px] transition-colors",
												isActive ? "bg-[#fff1f1]" : "hover:bg-black/5"
											)}
										>
											<span
												className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full text-white"
												style={{ backgroundColor: item.iconBg }}
											>
												{item.icon}
											</span>
											<span className="text-[17px] font-medium text-black">
												{item.label}
											</span>
										</Link>
									);
								})}
							</nav>
						</>
					)}

					<div className="my-4 h-px bg-black/10" />

					{/* Account actions */}
					<div className="flex flex-col">
						{accountItems.map((item) => {
							const Icon = item.icon;
							return (
								<Link
									key={item.label}
									href={item.href}
									onClick={onClose}
									className="flex items-center gap-3 rounded-[12px] px-3 py-[12px] text-[15px] font-normal text-black transition-colors hover:bg-black/5"
								>
									<Icon size={18} className="text-black/60" strokeWidth={1.5} />
									{item.label}
								</Link>
							);
						})}

						<button
							onClick={() => {
								onClose();
								logout();
							}}
							className="flex items-center gap-3 rounded-[12px] px-3 py-[12px] text-[15px] font-normal text-black transition-colors hover:bg-black/5 text-left"
						>
							<LogOut size={18} className="text-black/60" strokeWidth={1.5} />
							Sign Out
						</button>
					</div>
				</div>

				{/* Footer */}
				<div className="shrink-0 border-t border-black/10 px-5 py-4">
					<div className="flex flex-wrap gap-x-3 gap-y-1">
						{footerLinks.map((link, index) => (
							<span key={link.href} className="flex items-center">
								<Link
									href={link.href}
									onClick={onClose}
									className="text-[13px] font-medium text-black/60 transition-colors hover:text-black"
								>
									{link.label}
								</Link>
								{index < footerLinks.length - 1 && (
									<span className="ml-3 text-[13px] text-black/30">·</span>
								)}
							</span>
						))}
					</div>
				</div>
			</aside>
		</>
	);
}
