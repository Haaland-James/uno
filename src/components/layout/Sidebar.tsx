"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutDashboard,
	Building2,
	Plus,
	MessageSquare,
	BarChart3,
	Settings,
	LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const sidebarItems = [
	{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/properties", label: "My Properties", icon: Building2 },
	{ href: "/properties/new", label: "Add Property", icon: Plus },
	{ href: "/contacts", label: "Messages", icon: MessageSquare },
	{ href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const bottomItems = [
	{ href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
	const pathname = usePathname();

	return (
		<aside className="hidden lg:flex flex-col w-64 border-r border-gray-100 bg-white h-[calc(100vh-4rem)] sticky top-16">
			{/* Navigation */}
			<nav className="flex-1 p-4 space-y-1">
				{sidebarItems.map((item) => {
					const isActive =
						pathname === item.href || pathname?.startsWith(`${item.href}/`);
					const Icon = item.icon;

					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-3 px-3 py-2.5 rounded-button text-small font-medium transition-colors duration-200",
								isActive
									? "bg-uno-red-50 text-uno-red"
									: "text-content-secondary hover:bg-surface-tertiary hover:text-content-primary"
							)}
						>
							<Icon className="h-5 w-5 flex-shrink-0" />
							<span>{item.label}</span>
							{item.label === "Messages" && (
								<span className="ml-auto bg-uno-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
									3
								</span>
							)}
						</Link>
					);
				})}
			</nav>

			{/* Bottom Section */}
			<div className="p-4 border-t border-gray-100 space-y-1">
				{bottomItems.map((item) => {
					const Icon = item.icon;
					return (
						<Link
							key={item.href}
							href={item.href}
							className="flex items-center gap-3 px-3 py-2.5 rounded-button text-small font-medium text-content-secondary hover:bg-surface-tertiary hover:text-content-primary transition-colors"
						>
							<Icon className="h-5 w-5 flex-shrink-0" />
							<span>{item.label}</span>
						</Link>
					);
				})}
				<button className="flex items-center gap-3 px-3 py-2.5 rounded-button text-small font-medium text-content-secondary hover:bg-red-50 hover:text-uno-red transition-colors w-full">
					<LogOut className="h-5 w-5 flex-shrink-0" />
					<span>Sign Out</span>
				</button>
			</div>
		</aside>
	);
}
