"use client";

import Link from "next/link";
import { Search, Bell, Menu, User, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
			<div className="page-container flex h-14 md:h-16 items-center justify-between">
				{/* Logo */}
				<Link href="/feed" className="flex items-center gap-1.5">
					<div className="relative">
						<span className="text-[1.5rem] md:text-[1.75rem] font-extrabold tracking-tight text-uno-red">
							UNO
						</span>
						<span className="absolute -top-1 -right-3 text-[0.5rem] font-semibold text-uno-red-light bg-uno-red-50 px-1 rounded">
							β
						</span>
					</div>
				</Link>

				{/* Search Bar — Desktop Only */}
				<div className="hidden md:flex flex-1 max-w-md mx-8">
					<div className="relative w-full">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-content-muted" />
						<input
							type="text"
							placeholder="Search by area, type, or keyword..."
							className="input-uno pl-10 h-10 text-small bg-surface-secondary border-transparent focus:bg-white focus:border-uno-red"
						/>
					</div>
				</div>

				{/* Right Actions */}
				<div className="flex items-center gap-1 md:gap-2">
					{/* Search — Mobile Only */}
					<Link
						href="/search"
						className="md:hidden touch-target flex items-center justify-center rounded-full hover:bg-surface-tertiary transition-colors"
					>
						<Search className="h-5 w-5 text-content-secondary" />
					</Link>

					{/* Add Property — Desktop Only */}
					<Link
						href="/properties/new"
						className="hidden md:flex items-center gap-2 btn-primary px-4 py-2 text-small"
					>
						<Plus className="h-4 w-4" />
						<span>List Property</span>
					</Link>

					{/* Notifications */}
					<button className="touch-target flex items-center justify-center rounded-full hover:bg-surface-tertiary transition-colors relative">
						<Bell className="h-5 w-5 text-content-secondary" />
						<span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-uno-red" />
					</button>

					{/* Profile — Desktop Only */}
					<Link
						href="/profile"
						className="hidden md:flex items-center justify-center h-8 w-8 rounded-full bg-uno-red-50 text-uno-red hover:bg-uno-red-100 transition-colors"
					>
						<User className="h-4 w-4" />
					</Link>
				</div>
			</div>
		</header>
	);
}
