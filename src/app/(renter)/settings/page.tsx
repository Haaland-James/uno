"use client";

import { useState } from "react";
import Link from "next/link";
import {
	CircleMinus,
	MoreHorizontal,
	Settings as SettingsIcon,
	Shield,
	Bell,
	Globe,
	ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "manage" | "privacy" | "notifications" | "language";

const TABS: { key: Tab; label: string }[] = [
	{ key: "manage", label: "Manage Account" },
	{ key: "privacy", label: "Privacy" },
	{ key: "notifications", label: "Notifications" },
	{ key: "language", label: "Language" },
];

export default function AccountSettingsPage() {
	const [tab, setTab] = useState<Tab>("manage");

	return (
		<div className="mx-auto w-full max-w-[720px] px-4 py-6 md:px-8 md:py-10">
			<div className="mb-4 flex items-center gap-2">
				<Link
					href="/profile"
					aria-label="Back to profile"
					className="flex h-8 w-8 items-center justify-center rounded-full text-[#af2525] hover:bg-black/5"
				>
					<CircleMinus className="h-6 w-6" strokeWidth={2} />
				</Link>
				<h1 className="text-[22px] font-semibold text-black md:text-[26px]">
					Account Settings
				</h1>
			</div>

			<div className="mb-6 flex gap-6 border-b border-black/10 overflow-x-auto">
				{TABS.map((t) => {
					const isActive = tab === t.key;
					return (
						<button
							key={t.key}
							type="button"
							onClick={() => setTab(t.key)}
							className={cn(
								"relative whitespace-nowrap pb-3 text-[15px] transition-colors",
								isActive
									? "font-semibold text-black"
									: "font-normal text-black/60 hover:text-black"
							)}
						>
							{t.label}
							{isActive && (
								<span className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-full bg-black" />
							)}
						</button>
					);
				})}
			</div>

			{tab === "manage" && <ManageAccountTab />}
			{tab === "privacy" && <PrivacyTab />}
			{tab === "notifications" && <NotificationsTab />}
			{tab === "language" && <LanguageTab />}
		</div>
	);
}

function ManageAccountTab() {
	return (
		<div className="overflow-hidden rounded-[14px]">
			<SettingsRow
				icon={<MoreHorizontal size={20} strokeWidth={1.75} />}
				label="Password"
				description="Update your password to keep your account secure."
				action="Create"
			/>
			<SettingsRow
				icon={<SettingsIcon size={20} strokeWidth={1.75} />}
				label="Social Connects"
				description="Google"
				action="Disconnect"
			/>
			<SettingsRow
				icon={<SettingsIcon size={20} strokeWidth={1.75} />}
				label="Deactivate Account"
				description="This action cannot be undone."
				action="Deactivate"
				destructive
			/>
		</div>
	);
}

function PrivacyTab() {
	return (
		<div className="overflow-hidden rounded-[14px]">
			<SettingsRow
				icon={<Shield size={20} strokeWidth={1.75} />}
				label="Profile Visibility"
				description="Control who can see your profile information."
				action="Manage"
			/>
			<SettingsRow
				icon={<Shield size={20} strokeWidth={1.75} />}
				label="Data & Personalisation"
				description="Choose how UNO uses your data to personalise listings."
				action="Manage"
			/>
		</div>
	);
}

function NotificationsTab() {
	const items = [
		{
			label: "New properties in your area",
			description: "Get notified when new listings match your searches.",
			defaultOn: true,
		},
		{
			label: "Price drop alerts",
			description: "Know when saved properties reduce in price.",
			defaultOn: true,
		},
		{
			label: "Weekly digest",
			description: "Receive a summary of new listings every week.",
			defaultOn: false,
		},
	];

	return (
		<div className="overflow-hidden rounded-[14px]">
			{items.map((item) => (
				<div
					key={item.label}
					className="flex items-center gap-4 border-b border-white/80 bg-[#f5f5f5] px-5 py-4 last:border-b-0"
				>
					<div className="flex h-6 w-6 shrink-0 items-center justify-center text-black/70">
						<Bell size={20} strokeWidth={1.75} />
					</div>
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="text-[15px] font-medium text-black">
							{item.label}
						</span>
						<span className="text-[13px] text-black/60">{item.description}</span>
					</div>
					<label className="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							defaultChecked={item.defaultOn}
							className="peer sr-only"
						/>
						<div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#af2525] peer-checked:after:translate-x-full" />
					</label>
				</div>
			))}
		</div>
	);
}

function LanguageTab() {
	return (
		<div className="overflow-hidden rounded-[14px]">
			<SettingsRow
				icon={<Globe size={20} strokeWidth={1.75} />}
				label="Language"
				description="English"
				action="Change"
			/>
		</div>
	);
}

interface SettingsRowProps {
	icon: React.ReactNode;
	label: string;
	description: string;
	action: string;
	destructive?: boolean;
}

function SettingsRow({
	icon,
	label,
	description,
	action,
	destructive = false,
}: SettingsRowProps) {
	return (
		<div className="flex items-center gap-4 border-b border-white/80 bg-[#f5f5f5] px-5 py-4 last:border-b-0">
			<div className="flex h-6 w-6 shrink-0 items-center justify-center text-black/70">
				{icon}
			</div>
			<div className="flex min-w-0 flex-1 flex-col">
				<span className="text-[15px] font-medium text-black">{label}</span>
				<span className="text-[13px] text-black/60">{description}</span>
			</div>
			<button
				type="button"
				className={cn(
					"inline-flex items-center gap-1 text-[14px] font-medium transition-colors",
					destructive
						? "text-[#af2525] hover:opacity-80"
						: "text-black hover:text-[#af2525]"
				)}
			>
				{action}
				<ChevronRight size={14} strokeWidth={2} />
			</button>
		</div>
	);
}
