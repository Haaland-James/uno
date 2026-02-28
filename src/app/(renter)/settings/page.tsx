"use client";

import { Bell, Moon, Globe, Shield, HelpCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
	return (
		<div className="page-container py-4 md:py-6">
			{/* Header */}
			<div className="flex items-center gap-3 mb-6">
				<Link
					href="/profile"
					className="touch-target flex items-center justify-center rounded-full hover:bg-surface-tertiary transition-colors"
				>
					<ArrowLeft className="h-5 w-5 text-content-secondary" />
				</Link>
				<h1 className="text-heading-2 text-content-primary">Settings</h1>
			</div>

			{/* Notification Settings */}
			<div className="space-y-2 mb-6">
				<h2 className="text-tiny font-semibold text-content-muted uppercase tracking-wider px-1 mb-2">
					Notifications
				</h2>
				<div className="card-uno space-y-4">
					{[
						{ label: "New properties in your area", description: "Get notified when new listings match your searches", defaultOn: true },
						{ label: "Price drop alerts", description: "Know when saved properties reduce in price", defaultOn: true },
						{ label: "Weekly digest", description: "Receive a summary of new listings every week", defaultOn: false },
					].map((item, idx) => (
						<div key={idx} className="flex items-center justify-between">
							<div className="flex-1 mr-4">
								<p className="text-body text-content-primary font-medium">{item.label}</p>
								<p className="text-tiny text-content-secondary mt-0.5">{item.description}</p>
							</div>
							<label className="relative inline-flex items-center cursor-pointer">
								<input
									type="checkbox"
									defaultChecked={item.defaultOn}
									className="sr-only peer"
								/>
								<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-uno-red after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
							</label>
						</div>
					))}
				</div>
			</div>

			{/* Preferences */}
			<div className="space-y-2 mb-6">
				<h2 className="text-tiny font-semibold text-content-muted uppercase tracking-wider px-1 mb-2">
					Preferences
				</h2>
				{[
					{ label: "Language", value: "English", icon: Globe },
					{ label: "Data Saver", value: "Off", icon: Shield },
				].map((item) => (
					<div
						key={item.label}
						className="card-uno flex items-center gap-3 !p-4"
					>
						<div className="h-10 w-10 rounded-xl bg-surface-tertiary flex items-center justify-center">
							<item.icon className="h-5 w-5 text-content-secondary" />
						</div>
						<span className="flex-1 text-body text-content-primary font-medium">
							{item.label}
						</span>
						<span className="text-small text-content-muted">{item.value}</span>
					</div>
				))}
			</div>

			{/* Support */}
			<div className="space-y-2">
				<h2 className="text-tiny font-semibold text-content-muted uppercase tracking-wider px-1 mb-2">
					Support
				</h2>
				<Link
					href="#"
					className="card-uno flex items-center gap-3 !p-4"
				>
					<div className="h-10 w-10 rounded-xl bg-surface-tertiary flex items-center justify-center">
						<HelpCircle className="h-5 w-5 text-content-secondary" />
					</div>
					<span className="flex-1 text-body text-content-primary font-medium">
						Help & Support
					</span>
				</Link>
			</div>
		</div>
	);
}
