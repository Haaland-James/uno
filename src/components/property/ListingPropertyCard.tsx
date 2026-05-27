"use client";

import Image from "next/image";
import {
	MoreVertical,
	MapPin,
	Home as HomeIcon,
	Eye,
	Phone,
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

// Listing-status pill rendered on the image (top-left). Note: UNPUBLISHED
// collapses both Paused and Rented at the UI layer — if we want to split
// "Rented" out as its own pill later, thread availabilityStatus through
// /api/me/listings and branch here.
const LISTING_STATUS_PILL: Record<PropertyStatus, { label: string; dot: string } | null> = {
	PUBLISHED: { label: "Available", dot: "bg-[#22c55e]" },
	UNPUBLISHED: { label: "Unpublished", dot: "bg-black/40" },
	AVAILABLE: null, // drafts / pending — no pill, the in-body status row covers it
};

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

/** Just the number part — the /yr or /mo is rendered separately for the lighter weight in the Figma. */
function formatPriceMain(n: number) {
	return new Intl.NumberFormat("en-NG").format(n);
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
	const listingPill = LISTING_STATUS_PILL[listingStatus];

	const emitAction = (action: CardAction) => onAction?.(id, action);

	return (
		<div
			className={cn(
				"flex w-full flex-col gap-[15px] rounded-[16px] border border-black/10 bg-white",
				"transition-shadow duration-200 hover:shadow-md",
				className
			)}
		>
			{/* Image — overflow-hidden lives here (not the card root) so the kebab
			    dropdown popover can escape the card and render on top. */}
			<div className="relative h-[199px] w-full flex-shrink-0 overflow-hidden rounded-t-[16px]">
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

				{/* Listing-status pill (top-left) — shows Available / Unpublished */}
				{listingPill && (
					<div className="absolute left-[10px] top-[10px] z-10 flex items-center gap-[6px] rounded-full bg-white/95 px-[10px] py-[5px] shadow-sm">
						<HomeIcon size={12} className="text-[#161515]" />
						<span className="text-[11px] font-medium text-[#161515]">
							{listingPill.label}
						</span>
					</div>
				)}
			</div>

			{/* Content */}
			<div className="flex flex-col gap-[12px] px-[14px] pb-[14px]">
				{/* Two-column row: 75/25 grid — left = status/price/address, right = vertical stat stack */}
				<div className="grid grid-cols-4 items-start gap-3">
					<div className="col-span-3 flex min-w-0 flex-col gap-[8px]">
						{/* Verification status row (in body, not on image) */}
						<div className="flex items-center gap-[6px]">
							<span
								className={cn(
									"h-[8px] w-[8px] shrink-0 rounded-full",
									config.dotColor
								)}
							/>
							<span className="text-[12px] text-black/80">{config.label}</span>
						</div>

						{/* Title / Price */}
						{isInProgress ? (
							<h3 className="text-[18px] font-bold leading-tight text-[#161515]">
								You are almost done
							</h3>
						) : typeof price === "number" && price > 0 ? (
							<span className="text-[20px] font-extrabold text-[#161515] leading-none">
								{formatPriceMain(price)}
								<span className="ml-1 text-[14px] font-medium text-black/60">
									/{rentPeriod === "YEAR" ? "yr" : "mo"}
								</span>
							</span>
						) : (
							<span className="text-[16px] font-semibold text-[#161515] line-clamp-1">
								{title}
							</span>
						)}

						{/* Address — hidden for drafts / in-progress listings so a partial
						    or placeholder location doesn't show before the listing is finalised. */}
						{!isInProgress && (
							<div className="flex items-center gap-[4px]">
								<MapPin size={12} className="shrink-0 text-black/60" />
								<span className="truncate text-[12px] text-black/70">{address}</span>
							</div>
						)}
					</div>

					{/* Vertical stat column (col-span-1 → ~25% of card width) */}
					{stats && (
						<div className="col-span-1 flex flex-col items-stretch gap-[2px]">
							<StatPill icon={<Eye size={14} />} value={stats.views} />
							<StatPill icon={<Phone size={14} />} value={stats.inquiries} />
							<StatPill
								icon={<Heart size={14} fill="currentColor" />}
								value={stats.saves}
								tint="heart"
							/>
						</div>
					)}
				</div>

				{/* Primary CTA + kebab (kebab moved off the image) */}
				<div className="mt-1 flex items-center gap-2">
					<button
						type="button"
						onClick={() => emitAction(config.primaryAction)}
						className={cn(
							"flex h-[40px] flex-1 items-center justify-center rounded-[50px] bg-[#af2525] text-[14px] font-bold text-white font-sans",
							"transition-opacity duration-150 hover:opacity-90 active:opacity-80",
							"focus:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2"
						)}
					>
						{config.primaryCta}
					</button>
					<DropdownMenu
						trigger={
							<button
								type="button"
								aria-label="More options"
								className="flex h-[40px] w-[32px] items-center justify-center rounded-full transition-colors hover:bg-black/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525]"
							>
								<MoreVertical size={18} className="text-[#161515]" />
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
				"flex w-full items-center justify-between gap-[6px] rounded-full border border-black/10 bg-white px-[10px] py-[5px] text-[12px] font-medium",
				tint === "heart" ? "text-[#af2525]" : "text-black/70"
			)}
		>
			<span className="shrink-0">{icon}</span>
			<span className="tabular-nums">{formatCount(value)}</span>
		</span>
	);
}

export default ListingPropertyCard;
