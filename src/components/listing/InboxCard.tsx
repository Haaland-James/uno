"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Phone, MessageCircle, Mail, Home as HomeIcon, Check, Archive, Eye, EyeOff } from "lucide-react";
import { cn, formatPhone, getWhatsAppLink } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import type { InboxItem } from "@/lib/clients/contacts";

function timeAgo(dateStr: string) {
	const diff = Date.now() - new Date(dateStr).getTime();
	const mins = Math.floor(diff / 60_000);
	if (mins < 1) return "Just now";
	if (mins < 60) return `${mins}m ago`;
	const hours = Math.floor(mins / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	if (days < 7) return `${days}d ago`;
	return new Date(dateStr).toLocaleDateString("en-NG", {
		month: "short",
		day: "numeric",
	});
}

function maskPhone(phone: string) {
	const trimmed = phone.replace(/\s+/g, "");
	if (!trimmed) return "(no phone)";
	if (trimmed.length < 4) return "•••";
	return `${"•".repeat(Math.max(0, trimmed.length - 4))}${trimmed.slice(-4)}`;
}

function methodIcon(method: InboxItem["contactMethod"]) {
	switch (method) {
		case "WHATSAPP":
			return <WhatsAppIcon size={14} className="text-[#25D366]" />;
		case "PHONE":
			return <Phone size={14} className="text-[#af2525]" />;
		default:
			return <Mail size={14} className="text-[#6366f1]" />;
	}
}

function statusPill(status: InboxItem["status"]) {
	const map: Record<InboxItem["status"], string> = {
		UNREAD: "bg-[#af2525] text-white",
		READ: "bg-black/10 text-black/70",
		RESPONDED: "bg-[#22c55e] text-white",
		ARCHIVED: "bg-black/5 text-black/50",
	};
	return (
		<span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium leading-none", map[status])}>
			{status.charAt(0) + status.slice(1).toLowerCase()}
		</span>
	);
}

type Props = {
	item: InboxItem;
	onStatusChange: (id: string, status: "READ" | "UNREAD" | "RESPONDED" | "ARCHIVED") => Promise<void> | void;
};

export function InboxCard({ item, onStatusChange }: Props) {
	const [revealed, setRevealed] = useState(false);
	const [busy, setBusy] = useState(false);

	const phoneClean = item.tenantPhone.replace(/\s+/g, "");
	const hasPhone = phoneClean.length > 0;

	async function transition(next: "READ" | "UNREAD" | "RESPONDED" | "ARCHIVED") {
		if (busy) return;
		setBusy(true);
		try {
			await onStatusChange(item.id, next);
		} finally {
			setBusy(false);
		}
	}

	async function handleCallBack() {
		if (!hasPhone) return;
		await transition("RESPONDED");
		window.location.href = `tel:${phoneClean}`;
	}

	async function handleWhatsApp() {
		if (!hasPhone) return;
		await transition("RESPONDED");
		window.open(
			getWhatsAppLink(
				phoneClean,
				`Hi ${item.tenantName.split(/\s+/)[0]}, thanks for your enquiry about "${item.property.title}".`
			),
			"_blank"
		);
	}

	return (
		<div
			className={cn(
				"flex flex-col gap-3 border-b border-black/5 p-4 transition-colors hover:bg-black/[0.02]",
				item.status === "UNREAD" && "bg-[#fff8f8]"
			)}
		>
			<div className="flex items-start gap-3">
				{/* Property thumb */}
				<Link
					href={`/property/${item.property.id}`}
					className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-black/5"
				>
					{item.property.photo ? (
						<Image
							src={item.property.photo}
							alt={item.property.title}
							fill
							className="object-cover"
							sizes="56px"
						/>
					) : (
						<div className="flex h-full w-full items-center justify-center">
							<HomeIcon className="h-5 w-5 text-black/20" />
						</div>
					)}
				</Link>

				{/* Body */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2">
						<p className="text-[14px] font-semibold text-[#161515] truncate">
							{item.tenantName}
						</p>
						{statusPill(item.status)}
					</div>
					<p className="text-[12px] text-black/50 truncate">
						{item.property.title} · {item.property.area}, {item.property.city}
					</p>
					<div className="mt-1 flex items-center gap-3 text-[12px] text-black/60">
						{methodIcon(item.contactMethod)}
						{hasPhone ? (
							<button
								onClick={() => setRevealed((v) => !v)}
								className="inline-flex items-center gap-1 hover:text-[#af2525]"
							>
								{revealed ? formatPhone(phoneClean) : maskPhone(phoneClean)}
								{revealed ? <EyeOff size={12} /> : <Eye size={12} />}
							</button>
						) : (
							<span>(no phone on file)</span>
						)}
						<span className="text-black/40">·</span>
						<span>{timeAgo(item.createdAt)}</span>
					</div>
					{item.message && (
						<p className="mt-2 text-[13px] text-[#161515]">{item.message}</p>
					)}
				</div>
			</div>

			{/* Actions */}
			<div className="flex flex-wrap items-center gap-2 pl-[68px]">
				{hasPhone && (
					<>
						<button
							onClick={handleCallBack}
							disabled={busy}
							className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-medium text-[#161515] hover:bg-black/[0.04] disabled:opacity-50"
						>
							<Phone size={12} /> Call back
						</button>
						<button
							onClick={handleWhatsApp}
							disabled={busy}
							className="inline-flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-50"
						>
							<WhatsAppIcon size={12} /> WhatsApp
						</button>
					</>
				)}
				{item.status === "UNREAD" ? (
					<button
						onClick={() => transition("READ")}
						disabled={busy}
						className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-medium text-black/60 hover:bg-black/[0.04] disabled:opacity-50"
					>
						<Check size={12} /> Mark read
					</button>
				) : item.status === "READ" ? (
					<button
						onClick={() => transition("UNREAD")}
						disabled={busy}
						className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-medium text-black/60 hover:bg-black/[0.04] disabled:opacity-50"
					>
						<EyeOff size={12} /> Mark unread
					</button>
				) : null}
				{item.status !== "ARCHIVED" && (
					<button
						onClick={() => transition("ARCHIVED")}
						disabled={busy}
						className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-[12px] font-medium text-black/60 hover:bg-black/[0.04] disabled:opacity-50"
					>
						<Archive size={12} /> Archive
					</button>
				)}
			</div>
		</div>
	);
}
