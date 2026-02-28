"use client";

import Link from "next/link";
import {
	User,
	Heart,
	Bell,
	Search,
	Settings,
	ChevronRight,
	LogOut,
	Building2,
} from "lucide-react";

export default function ProfilePage() {
	return (
		<div className="page-container py-4 md:py-6">
			{/* Profile Header */}
			<div className="card-uno mb-6">
				<div className="flex items-center gap-4">
					<div className="h-16 w-16 rounded-full bg-uno-red-50 flex items-center justify-center">
						<User className="h-8 w-8 text-uno-red" />
					</div>
					<div className="flex-1">
						<h1 className="text-heading-3 text-content-primary">
							Guest User
						</h1>
						<p className="text-small text-content-secondary">
							Sign in to save your preferences
						</p>
					</div>
				</div>
				<div className="mt-4 flex gap-3">
					<Link
						href="/login"
						className="btn-primary flex-1 py-2.5 text-center text-small"
					>
						Sign In
					</Link>
					<Link
						href="/signup"
						className="btn-secondary flex-1 py-2.5 text-center text-small"
					>
						Sign Up
					</Link>
				</div>
			</div>

			{/* Menu Items */}
			<div className="space-y-2">
				<h2 className="text-tiny font-semibold text-content-muted uppercase tracking-wider px-1 mb-2">
					Your Activity
				</h2>
				{[
					{ href: "/favourites", label: "Saved Properties", icon: Heart, count: "0" },
					{ href: "/saved-searches", label: "Saved Searches", icon: Search, count: "0" },
				].map((item) => (
					<Link
						key={item.href}
						href={item.href}
						className="card-uno flex items-center gap-3 !p-4"
					>
						<div className="h-10 w-10 rounded-xl bg-uno-red-50 flex items-center justify-center">
							<item.icon className="h-5 w-5 text-uno-red" />
						</div>
						<span className="flex-1 text-body text-content-primary font-medium">
							{item.label}
						</span>
						<span className="text-small text-content-muted mr-1">{item.count}</span>
						<ChevronRight className="h-4 w-4 text-content-muted" />
					</Link>
				))}

				<h2 className="text-tiny font-semibold text-content-muted uppercase tracking-wider px-1 mb-2 mt-6">
					Settings
				</h2>
				{[
					{ href: "/settings", label: "Notifications", icon: Bell },
					{ href: "/settings", label: "App Settings", icon: Settings },
				].map((item, idx) => (
					<Link
						key={idx}
						href={item.href}
						className="card-uno flex items-center gap-3 !p-4"
					>
						<div className="h-10 w-10 rounded-xl bg-surface-tertiary flex items-center justify-center">
							<item.icon className="h-5 w-5 text-content-secondary" />
						</div>
						<span className="flex-1 text-body text-content-primary font-medium">
							{item.label}
						</span>
						<ChevronRight className="h-4 w-4 text-content-muted" />
					</Link>
				))}

				<h2 className="text-tiny font-semibold text-content-muted uppercase tracking-wider px-1 mb-2 mt-6">
					Landlord
				</h2>
				<Link
					href="/dashboard"
					className="card-uno flex items-center gap-3 !p-4"
				>
					<div className="h-10 w-10 rounded-xl bg-verified/10 flex items-center justify-center">
						<Building2 className="h-5 w-5 text-verified" />
					</div>
					<span className="flex-1 text-body text-content-primary font-medium">
						Switch to Landlord
					</span>
					<ChevronRight className="h-4 w-4 text-content-muted" />
				</Link>
			</div>

			{/* Version */}
			<div className="mt-8 text-center">
				<p className="text-tiny text-content-muted">UNO v0.1.0 (Beta)</p>
			</div>
		</div>
	);
}
