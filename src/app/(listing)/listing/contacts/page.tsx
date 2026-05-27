"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { contactsClient, type InboxItem, type InboxListResult } from "@/lib/clients/contacts";
import { InboxCard } from "@/components/listing/InboxCard";
import { toast } from "@/stores/toastStore";
import { cn } from "@/lib/utils";

type Tab = "UNREAD" | "ALL" | "ARCHIVED";

const TABS: { key: Tab; label: string }[] = [
	{ key: "UNREAD", label: "Unread" },
	{ key: "ALL", label: "All" },
	{ key: "ARCHIVED", label: "Archived" },
];

export default function ContactsInboxPage() {
	const [tab, setTab] = useState<Tab>("UNREAD");
	const [data, setData] = useState<InboxListResult | null>(null);
	const [loading, setLoading] = useState(true);

	const load = useCallback(async (t: Tab) => {
		setLoading(true);
		try {
			const res = await contactsClient.list({ status: t });
			setData(res);
		} catch (e) {
			toast.error(e instanceof Error ? e.message : "Could not load messages");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		load(tab);
	}, [tab, load]);

	const handleStatusChange = useCallback(
		async (id: string, next: "READ" | "UNREAD" | "RESPONDED" | "ARCHIVED") => {
			// Optimistic update
			setData((prev) => {
				if (!prev) return prev;
				const items = prev.items.map((it) =>
					it.id === id ? ({ ...it, status: next } as InboxItem) : it
				);
				const filtered =
					tab === "ALL"
						? items
						: tab === "ARCHIVED"
							? items.filter((it) => it.status === "ARCHIVED")
							: items.filter((it) => it.status === "UNREAD");
				const unreadDelta =
					(next === "UNREAD" ? 1 : 0) -
					(prev.items.find((it) => it.id === id)?.status === "UNREAD" ? 1 : 0);
				return {
					...prev,
					items: filtered,
					counts: { ...prev.counts, unread: Math.max(0, prev.counts.unread + unreadDelta) },
				};
			});
			try {
				await contactsClient.updateStatus(id, next);
			} catch (e) {
				toast.error(e instanceof Error ? e.message : "Could not update status");
				load(tab);
			}
		},
		[tab, load]
	);

	const items = data?.items ?? [];
	const showEmpty = !loading && items.length === 0;

	return (
		<div className="page-container py-4 md:py-6">
			<h1 className="text-[28px] font-bold text-[#161515] md:text-[32px] mb-1">
				Messages
			</h1>
			<p className="text-[14px] text-black/50 mb-6">
				Tenant enquiries about your properties
			</p>

			{/* Tabs */}
			<div className="mb-4 flex items-center gap-1 border-b border-black/10">
				{TABS.map((t) => {
					const active = tab === t.key;
					const showCount = t.key === "UNREAD" && data && data.counts.unread > 0;
					return (
						<button
							key={t.key}
							onClick={() => setTab(t.key)}
							className={cn(
								"relative px-4 py-2 text-[14px] font-medium transition-colors",
								active ? "text-[#af2525]" : "text-black/60 hover:text-black"
							)}
						>
							<span className="inline-flex items-center gap-1.5">
								{t.label}
								{showCount && (
									<span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#af2525] px-1.5 text-[11px] font-semibold text-white">
										{data.counts.unread}
									</span>
								)}
							</span>
							{active && (
								<span className="absolute inset-x-0 -bottom-px h-[2px] bg-[#af2525]" />
							)}
						</button>
					);
				})}
			</div>

			{/* List */}
			<div className="rounded-[14px] border border-black/10 bg-white overflow-hidden">
				{loading ? (
					<div className="space-y-0">
						{[0, 1, 2].map((i) => (
							<div
								key={i}
								className="flex items-center gap-3 border-b border-black/5 p-4 last:border-b-0"
							>
								<div className="h-14 w-14 animate-pulse rounded-lg bg-black/5" />
								<div className="flex-1 space-y-2">
									<div className="h-3 w-1/3 animate-pulse rounded bg-black/5" />
									<div className="h-2.5 w-2/3 animate-pulse rounded bg-black/5" />
								</div>
							</div>
						))}
					</div>
				) : showEmpty ? (
					<div className="flex flex-col items-center justify-center py-16 text-center">
						<div className="h-16 w-16 rounded-full bg-[#fff1f1] flex items-center justify-center mb-4">
							<MessageSquare className="h-8 w-8 text-[#af2525]" />
						</div>
						<h3 className="text-[18px] font-semibold text-[#161515] mb-2">
							{tab === "UNREAD"
								? "No unread messages"
								: tab === "ARCHIVED"
									? "No archived messages"
									: "No messages yet"}
						</h3>
						<p className="text-[14px] text-black/50 max-w-sm">
							{tab === "ALL"
								? "Share your listing to get inquiries — when tenants reach out, they'll show up here."
								: "Switch tabs to see messages in another state."}
						</p>
					</div>
				) : (
					<div>
						{items.map((it) => (
							<InboxCard key={it.id} item={it} onStatusChange={handleStatusChange} />
						))}
					</div>
				)}
			</div>
		</div>
	);
}
