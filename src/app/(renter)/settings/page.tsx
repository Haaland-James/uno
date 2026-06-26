"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import {
	CircleMinus,
	MoreHorizontal,
	Settings as SettingsIcon,
	Bell,
	Globe,
	ChevronRight,
	Link as LinkIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toastStore";
import { PasswordForm } from "@/components/settings/PasswordForm";
import { DeactivateDialog } from "@/components/settings/DeactivateDialog";

type Tab = "manage" | "notifications" | "language";

const TABS: { key: Tab; label: string }[] = [
	{ key: "manage", label: "Manage Account" },
	{ key: "notifications", label: "Notifications" },
	{ key: "language", label: "Language" },
];

interface ProfileData {
	hasPassword: boolean;
	language: string;
}

interface NotificationPrefs {
	notifyNewProperties: boolean;
	notifyPriceDrops: boolean;
	notifyWeeklyDigest: boolean;
}

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
			{tab === "notifications" && <NotificationsTab />}
			{tab === "language" && <LanguageTab />}
		</div>
	);
}

function ManageAccountTab() {
	const [profile, setProfile] = useState<ProfileData | null>(null);
	const [socialAccounts, setSocialAccounts] = useState<string[]>([]);
	const [showPasswordForm, setShowPasswordForm] = useState(false);
	const [showDeactivate, setShowDeactivate] = useState(false);

	useEffect(() => {
		fetch("/api/me")
			.then((r) => r.json())
			.then(({ data }) => {
				if (data) setProfile({ hasPassword: data.hasPassword, language: data.language });
			})
			.catch(() => {});

		fetch("/api/me/social-accounts")
			.then((r) => r.json())
			.then(({ data }) => {
				if (data) setSocialAccounts(data);
			})
			.catch(() => {});
	}, []);

	const googleConnected = socialAccounts.includes("google");

	return (
		<>
			<div className="overflow-hidden rounded-[14px]">
				<SettingsRow
					icon={<MoreHorizontal size={20} strokeWidth={1.75} />}
					label="Password"
					description={
						profile?.hasPassword
							? "Change your password."
							: "Set a password to sign in without OTP."
					}
					action={showPasswordForm ? "Close" : profile?.hasPassword ? "Change" : "Create"}
					onClick={() => setShowPasswordForm((v) => !v)}
				/>
				{showPasswordForm && profile && (
					<div className="bg-[#f5f5f5] px-5 pb-4">
						<PasswordForm
							hasPassword={profile.hasPassword}
							onSuccess={() => {
								setShowPasswordForm(false);
								setProfile((p) => p ? { ...p, hasPassword: true } : p);
							}}
						/>
					</div>
				)}

				<SettingsRow
					icon={<LinkIcon size={20} strokeWidth={1.75} />}
					label="Social Connects"
					description={googleConnected ? "Google — Connected" : "Google"}
					action={googleConnected ? "Connected" : "Connect"}
					onClick={() => {
						if (!googleConnected) {
							signIn("google", { callbackUrl: "/settings" });
						}
					}}
					disabled={googleConnected}
				/>

				<SettingsRow
					icon={<SettingsIcon size={20} strokeWidth={1.75} />}
					label="Deactivate Account"
					description="This action cannot be undone."
					action="Deactivate"
					destructive
					onClick={() => setShowDeactivate(true)}
				/>
			</div>

			<DeactivateDialog
				open={showDeactivate}
				onClose={() => setShowDeactivate(false)}
			/>
		</>
	);
}

function NotificationsTab() {
	const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
	const [saving, setSaving] = useState<string | null>(null);

	useEffect(() => {
		fetch("/api/me/notifications")
			.then((r) => r.json())
			.then(({ data }) => {
				if (data) setPrefs(data);
			})
			.catch(() => {});
	}, []);

	const toggle = useCallback(
		async (key: keyof NotificationPrefs) => {
			if (!prefs) return;
			const newVal = !prefs[key];
			setPrefs((p) => (p ? { ...p, [key]: newVal } : p));
			setSaving(key);

			try {
				const res = await fetch("/api/me/notifications", {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ [key]: newVal }),
				});
				if (!res.ok) throw new Error();
			} catch {
				setPrefs((p) => (p ? { ...p, [key]: !newVal } : p));
				toast.error("Failed to update preference");
			} finally {
				setSaving(null);
			}
		},
		[prefs]
	);

	const items: { key: keyof NotificationPrefs; label: string; description: string }[] = [
		{
			key: "notifyNewProperties",
			label: "New properties in your area",
			description: "Get notified when new listings match your searches.",
		},
		{
			key: "notifyPriceDrops",
			label: "Price drop alerts",
			description: "Know when saved properties reduce in price.",
		},
		{
			key: "notifyWeeklyDigest",
			label: "Weekly digest",
			description: "Receive a summary of new listings every week.",
		},
	];

	return (
		<div className="overflow-hidden rounded-[14px]">
			{items.map((item) => (
				<div
					key={item.key}
					className="flex items-center gap-4 border-b border-white/80 bg-[#f5f5f5] px-5 py-4 last:border-b-0"
				>
					<div className="flex h-6 w-6 shrink-0 items-center justify-center text-black/70">
						<Bell size={20} strokeWidth={1.75} />
					</div>
					<div className="flex min-w-0 flex-1 flex-col">
						<span className="text-[15px] font-medium text-black">
							{item.label}
						</span>
						<span className="text-[13px] text-black/60">
							{item.description}
						</span>
					</div>
					<label className="relative inline-flex cursor-pointer items-center">
						<input
							type="checkbox"
							checked={prefs?.[item.key] ?? false}
							onChange={() => toggle(item.key)}
							disabled={!prefs || saving === item.key}
							className="peer sr-only"
						/>
						<div className="peer h-6 w-11 rounded-full bg-gray-300 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-[#af2525] peer-checked:after:translate-x-full peer-disabled:opacity-60" />
					</label>
				</div>
			))}
		</div>
	);
}

const LANGUAGES = [
	{ code: "en", label: "English" },
	{ code: "pcm", label: "Pidgin English" },
	{ code: "yo", label: "Yoruba" },
	{ code: "ig", label: "Igbo" },
	{ code: "ha", label: "Hausa" },
];

function LanguageTab() {
	const [current, setCurrent] = useState("en");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		fetch("/api/me")
			.then((r) => r.json())
			.then(({ data }) => {
				if (data?.language) setCurrent(data.language);
			})
			.catch(() => {});
	}, []);

	async function handleChange(code: string) {
		const prev = current;
		setCurrent(code);
		setSaving(true);

		try {
			const res = await fetch("/api/me", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ language: code }),
			});
			if (!res.ok) throw new Error();
			toast.success("Language updated");
		} catch {
			setCurrent(prev);
			toast.error("Failed to update language");
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="overflow-hidden rounded-[14px]">
			{LANGUAGES.map((lang) => (
				<button
					key={lang.code}
					type="button"
					onClick={() => handleChange(lang.code)}
					disabled={saving || current === lang.code}
					className={cn(
						"flex w-full items-center gap-4 border-b border-white/80 bg-[#f5f5f5] px-5 py-4 text-left last:border-b-0 transition-colors",
						current === lang.code
							? "font-semibold text-black"
							: "text-black/70 hover:bg-[#eeeeee]"
					)}
				>
					<div className="flex h-6 w-6 shrink-0 items-center justify-center text-black/70">
						<Globe size={20} strokeWidth={1.75} />
					</div>
					<span className="flex-1 text-[15px]">{lang.label}</span>
					{current === lang.code && (
						<span className="text-[13px] font-medium text-[#af2525]">Selected</span>
					)}
				</button>
			))}
		</div>
	);
}

interface SettingsRowProps {
	icon: React.ReactNode;
	label: string;
	description: string;
	action: string;
	destructive?: boolean;
	onClick?: () => void;
	disabled?: boolean;
}

function SettingsRow({
	icon,
	label,
	description,
	action,
	destructive = false,
	onClick,
	disabled = false,
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
				onClick={onClick}
				disabled={disabled}
				className={cn(
					"inline-flex items-center gap-1 text-[14px] font-medium transition-colors disabled:opacity-50",
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
