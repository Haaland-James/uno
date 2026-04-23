"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Search,
	Rss,
	Heart,
	BookmarkCheck,
	Home,
	User,
	Building2,
	MessageSquare,
	BarChart3,
	Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMyListings } from "@/lib/mock-data";

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
		label: "My House",
		href: "/my-house",
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

const landlordNavItems: NavItem[] = [
	{
		label: "My Listings",
		href: "/properties",
		icon: <Building2 size={18} strokeWidth={2} />,
		iconBg: "#ffcfcf",
	},
	{
		label: "Messages",
		href: "/messages",
		icon: <MessageSquare size={18} strokeWidth={2} />,
		iconBg: "#f5b324",
	},
	{
		label: "Analytics",
		href: "/analytics",
		icon: <BarChart3 size={18} strokeWidth={2} />,
		iconBg: "#db8ff6",
	},
	{
		label: "Settings",
		href: "/settings",
		icon: <Settings size={18} strokeWidth={2} />,
		iconBg: "#dd6bb1",
	},
];

const footerLinks = [
	{ label: "Privacy", href: "/privacy" },
	{ label: "Terms", href: "/terms" },
	{ label: "Help", href: "/help" },
	{ label: "About", href: "/about" },
];

function NavLink({ item, pathname }: { item: NavItem; pathname: string | null }) {
	const isActive = pathname === item.href;
	return (
		<Link
			key={`${item.label}-${item.href}`}
			href={item.href}
			className={cn(
				"inline-flex w-fit items-center gap-3 rounded-[50px] px-[14px] py-[8px] transition-colors",
				isActive ? "bg-[#fff1f1]" : "hover:bg-[#f5f5f5]"
			)}
		>
			<span
				className="inline-flex h-[35px] w-[35px] shrink-0 items-center justify-center rounded-[17.5px] text-white"
				style={{ backgroundColor: item.iconBg }}
			>
				{item.icon}
			</span>
			<span className="whitespace-nowrap font-sans text-[18px] font-medium leading-none text-black">
				{item.label}
			</span>
		</Link>
	);
}

export function Sidebar() {
	const pathname = usePathname();
	const hasListings = getMyListings().length > 0;

	return (
		<>
			<aside className="fixed bottom-0 left-0 top-16 z-40 hidden w-[250px] shrink-0 flex-col border-r border-black/5 bg-[#fbfbfb] px-[14px] py-[28px] lg:flex">
				<nav className="flex flex-col items-start gap-1">
					{navItems.map((item) => (
						<NavLink key={item.href} item={item} pathname={pathname} />
					))}
				</nav>

				{hasListings && (
					<>
						<div className="my-4 h-px w-full bg-black/10" />
						<p className="px-[14px] pb-2 text-[11px] font-semibold uppercase tracking-wider text-black/40">
							Listings
						</p>
						<nav className="flex flex-col items-start gap-1">
							{landlordNavItems.map((item) => (
								<NavLink key={item.href} item={item} pathname={pathname} />
							))}
						</nav>
					</>
				)}

				<div className="mt-auto flex flex-wrap gap-x-2 gap-y-1 px-[14px]">
					{footerLinks.map((link, index) => (
						<span key={link.href} className="flex items-center">
							<Link
								href={link.href}
								className="font-sans text-[14px] font-medium text-black/60 transition-colors hover:text-black"
							>
								{link.label}
							</Link>
							{index < footerLinks.length - 1 && (
								<span className="ml-2 text-[14px] text-black/40">·</span>
							)}
						</span>
					))}
				</div>
			</aside>

			<div className="hidden w-[250px] shrink-0 lg:block" />
		</>
	);
}
