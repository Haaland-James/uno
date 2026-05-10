"use client";

import Image from "next/image";
import {
	MoreVertical,
	MapPin,
	Home as HomeIcon,
	Eye,
	MessageSquare,
	Heart,
	Edit2,
	Eye as EyeIcon,
	XCircle,
	CheckCircle2,
	Trash2,
	ListPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu } from "@/components/ui/DropdownMenu";
import type { PropertyStatus, VerificationStatus } from "@/types/property";

export type CardAction =
	| "complete"
	| "edit"
	| "view"
	| "preview"
	| "take_off_market"
	| "list"
	| "mark_rented"
	| "mark_available"
	| "request_verification"
	| "delete";

interface ListingPropertyCardProps {
	id: string;
	title: string;
	address: string;
	imageUrl?: string;
	price?: number;
	rentPeriod?: "MONTH" | "YEAR";
	currency?: string;
	verificationStatus: VerificationStatus;
	listingStatus: PropertyStatus;
	stats?: { views: number; inquiries: number; saves: number };
	onAction?: (id: string, action: CardAction) => void;
	className?: string;
}

interface VerificationConfig {
	dotColor: string;
	label: string;
	primaryCta: string;
	primaryAction: CardAction;
}

const VERIFICATION_CONFIG: Record<VerificationStatus, VerificationConfig> = {
	IN_PROGRESS: {
		dotColor: "bg-[#d4593e]",
		label: "Listing in progress",
		primaryCta: "Complete",
		primaryAction: "complete",
	},
	PENDING: {
		dotColor: "bg-[#f5b324]",
		label: "Verification in progress",
		primaryCta: "Edit listing",
		primaryAction: "edit",
	},
	VERIFIED: {
		dotColor: "bg-[#22c55e]",
		label: "Verification Complete",
		primaryCta: "View Details",
		primaryAction: "view",
	},
	REJECTED: {
		dotColor: "bg-[#ef4444]",
		label: "Verification failed",
		primaryCta: "Edit listing",
		primaryAction: "edit",
	},
};

function formatPrice(n: number, period: "MONTH" | "YEAR" = "YEAR") {
	const formatted = new Intl.NumberFormat("en-NG").format(n);
	return `${formatted} /${period === "YEAR" ? "yr" : "mo"}`;
}

function formatCount(n: number) {
	if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
	return String(n);
}

export function ListingPropertyCard({
	id,
	title,
	address,
	imageUrl,
	price,
	rentPeriod = "YEAR",
	verificationStatus,
	listingStatus,
	stats,
	onAction,
	className,
}: ListingPropertyCardProps) {
	const config = VERIFICATION_CONFIG[verificationStatus];
	const isInProgress = verificationStatus === "IN_PROGRESS";
	const isVerified = verificationStatus === "VERIFIED";

	const emitAction = (action: CardAction) => onAction?.(id, action);

	return (
		<div
			className={cn(
				"flex w-full flex-col gap-[15px] overflow-hidden rounded-[16px] border border-black/10 bg-white",
				"transition-shadow duration-200 hover:shadow-md",
				className
			)}
		>
			{/* Image */}
			<div className="relative h-[199px] w-full flex-shrink-0">
				{imageUrl ? (
					<Image
						src={imageUrl}
						alt={title}
						fill
						className="object-cover"
						sizes="(max-width: 768px) 100vw, 33vw"
					/>
				) : (
					<div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e8e0e0] to-[#c9b8b8]">
						<HomeIcon className="h-10 w-10 text-white/80" strokeWidth={1.5} />
					</div>
				)}

				{/* Kebab */}
				<div className="absolute right-[10px] top-[10px] z-10">
					<DropdownMenu
						trigger={
							<button
								type="button"
								aria-label="More options"
								className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur-sm transition-colors hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525]"
							>
								<MoreVertical size={16} className="text-[#161515]" />
							</button>
						}
					>
						{isInProgress ? (
							<>
								<DropdownMenu.Item
									icon={<Edit2 size={16} />}
									onClick={() => emitAction("complete")}
								>
									Resume
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<Trash2 size={16} />}
									destructive
									onClick={() => emitAction("delete")}
								>
									Delete Draft
								</DropdownMenu.Item>
							</>
						) : verificationStatus === "PENDING" ? (
							<>
								<DropdownMenu.Item
									icon={<Edit2 size={16} />}
									onClick={() => emitAction("edit")}
								>
									Edit Listing
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<EyeIcon size={16} />}
									onClick={() => emitAction("preview")}
								>
									Preview
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<Trash2 size={16} />}
									destructive
									onClick={() => emitAction("delete")}
								>
									Delete Listing
								</DropdownMenu.Item>
							</>
						) : listingStatus === "PUBLISHED" ? (
							<>
								<DropdownMenu.Item
									icon={<Edit2 size={16} />}
									onClick={() => emitAction("edit")}
								>
									Edit Listing
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<EyeIcon size={16} />}
									onClick={() => emitAction("preview")}
								>
									Preview
								</DropdownMenu.Item>
								{/* Request verification — hidden while admin/verification flow is on hold */}
								<DropdownMenu.Item
									icon={<XCircle size={16} />}
									onClick={() => emitAction("take_off_market")}
								>
									Take off Market
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<CheckCircle2 size={16} />}
									onClick={() => emitAction("mark_rented")}
								>
									Mark as Rented
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<Trash2 size={16} />}
									destructive
									onClick={() => emitAction("delete")}
								>
									Delete Listing
								</DropdownMenu.Item>
							</>
						) : (
							<>
								<DropdownMenu.Item
									icon={<Edit2 size={16} />}
									onClick={() => emitAction("edit")}
								>
									Edit Listing
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<EyeIcon size={16} />}
									onClick={() => emitAction("preview")}
								>
									Preview
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<ListPlus size={16} />}
									onClick={() => emitAction("list")}
								>
									List
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<CheckCircle2 size={16} />}
									onClick={() => emitAction("mark_available")}
								>
									Mark as Available
								</DropdownMenu.Item>
								<DropdownMenu.Item
									icon={<Trash2 size={16} />}
									destructive
									onClick={() => emitAction("delete")}
								>
									Delete Listing
								</DropdownMenu.Item>
							</>
						)}
					</DropdownMenu>
				</div>

				{/* Verified badge overlay on image (matches screenshot) */}
				{isVerified && (
					<div className="absolute left-[10px] top-[10px] z-10 flex items-center gap-[6px] rounded-full bg-white/95 px-[10px] py-[4px] shadow-sm">
						<span className="h-[6px] w-[6px] rounded-full bg-[#22c55e]" />
						<span className="text-[11px] font-medium text-[#161515]">
							Verification Complete
						</span>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex flex-col gap-[10px] px-[14px] pb-[14px]">
				{/* Status row — only when not verified (verified shows on image overlay) */}
				{!isVerified && (
					<div className="flex items-center gap-[6px]">
						<span
							className={cn("h-[8px] w-[8px] shrink-0 rounded-full", config.dotColor)}
						/>
						<span className="text-[12px] text-black/80">{config.label}</span>
					</div>
				)}

				{/* Title / Price */}
				{isInProgress ? (
					<h3 className="text-[18px] font-bold leading-tight text-[#161515]">
						You are almost done
					</h3>
				) : (
					<div className="flex items-baseline justify-between gap-2">
						{typeof price === "number" && price > 0 ? (
							<span className="text-[18px] font-bold text-[#161515]">
								{formatPrice(price, rentPeriod)}
							</span>
						) : (
							<span className="text-[16px] font-semibold text-[#161515] line-clamp-1">
								{title}
							</span>
						)}
						{isVerified && stats && (
							<div className="flex items-center gap-[6px]">
								<StatPill icon={<Eye size={12} />} value={stats.views} />
								<StatPill
									icon={<MessageSquare size={12} />}
									value={stats.inquiries}
								/>
								<StatPill
									icon={<Heart size={12} />}
									value={stats.saves}
									tint="heart"
								/>
							</div>
						)}
					</div>
				)}

				{/* Address */}
				<div className="flex items-center gap-[4px]">
					<MapPin size={12} className="shrink-0 text-black/60" />
					<span className="truncate text-[11px] text-black/60">{address}</span>
				</div>

				{/* Primary CTA */}
				<button
					type="button"
					onClick={() => emitAction(config.primaryAction)}
					className={cn(
						"mt-1 flex h-[40px] w-full items-center justify-center rounded-[50px] bg-[#af2525] text-[14px] font-bold text-white font-sans",
						"transition-opacity duration-150 hover:opacity-90 active:opacity-80",
						"focus:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2"
					)}
				>
					{config.primaryCta}
				</button>
			</div>
		</div>
	);
}

function StatPill({
	icon,
	value,
	tint,
}: {
	icon: React.ReactNode;
	value: number;
	tint?: "heart";
}) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-[4px] rounded-full border border-black/10 bg-white px-[8px] py-[2px] text-[11px]",
				tint === "heart" ? "text-[#af2525]" : "text-black/70"
			)}
		>
			{icon}
			<span>{formatCount(value)}</span>
		</span>
	);
}

export default ListingPropertyCard;
