"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { LandlordPropertyCard, type CardAction } from "@/components/property/LandlordPropertyCard";
import { getMyListings } from "@/lib/mock-data";
import type { PropertyCardData, PropertyStatus } from "@/types/property";
import { cn } from "@/lib/utils";

type TabKey = "AVAILABLE" | "PUBLISHED" | "UNPUBLISHED";

const TABS: { key: TabKey; label: string }[] = [
	{ key: "AVAILABLE", label: "Available" },
	{ key: "PUBLISHED", label: "Published" },
	{ key: "UNPUBLISHED", label: "Unpublished" },
];

function emptyCopyFor(tab: TabKey) {
	switch (tab) {
		case "AVAILABLE":
			return {
				title: "You have no listings",
				description: "Click the button below to add your properties",
			};
		case "PUBLISHED":
			return {
				title: "Nothing published yet",
				description: "Once a listing is verified and live, it will appear here.",
			};
		case "UNPUBLISHED":
			return {
				title: "No unpublished listings",
				description:
					"Listings you take off the market or mark as rented show up here.",
			};
	}
}

export default function MyListingsPage() {
	const router = useRouter();
	const [tab, setTab] = useState<TabKey>("AVAILABLE");
	const [listings, setListings] = useState<PropertyCardData[]>(() => getMyListings());

	const counts = useMemo(() => {
		return {
			AVAILABLE: listings.filter((l) => l.status === "AVAILABLE").length,
			PUBLISHED: listings.filter((l) => l.status === "PUBLISHED").length,
			UNPUBLISHED: listings.filter((l) => l.status === "UNPUBLISHED").length,
		} as Record<TabKey, number>;
	}, [listings]);

	const filtered = listings.filter((l) => l.status === tab);
	const totalCount = listings.length;

	const updateStatus = (id: string, status: PropertyStatus) => {
		setListings((prev) => prev.map((l) => (l.id === id ? { ...l, status } : l)));
	};

	const handleAction = (id: string, action: CardAction) => {
		switch (action) {
			case "complete":
				router.push("/landlord/properties/new");
				return;
			case "edit":
				router.push(`/landlord/properties/${id}/edit`);
				return;
			case "view":
				router.push(`/property/${id}`);
				return;
			case "preview":
				router.push(`/property/${id}`);
				return;
			case "take_off_market":
				updateStatus(id, "UNPUBLISHED");
				return;
			case "list":
				updateStatus(id, "PUBLISHED");
				return;
			case "mark_rented":
				updateStatus(id, "UNPUBLISHED");
				return;
			case "mark_available":
				updateStatus(id, "AVAILABLE");
				return;
			case "delete":
				setListings((prev) => prev.filter((l) => l.id !== id));
				return;
		}
	};

	const showZeroState = totalCount === 0;

	return (
		<div className="page-container py-6 md:py-10">
			{/* Header */}
			<div className="mb-6 flex items-center justify-between gap-4">
				<h1 className="text-[28px] font-bold text-[#161515] md:text-[32px]">
					My Listings
				</h1>
				{!showZeroState && (
					<Link
						href="/landlord/properties/new"
						className="inline-flex h-[40px] items-center gap-2 rounded-[50px] bg-[#af2525] px-5 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
					>
						<Plus size={16} />
						<span>Add Property</span>
					</Link>
				)}
			</div>

			{showZeroState ? (
				<EmptyState
					icon={
						<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f1]">
							<Building2 className="h-8 w-8 text-[#af2525]" />
						</div>
					}
					title="You have no listings"
					description="Click the button below to add your properties"
					action={
						<Link
							href="/landlord/properties/new"
							className="inline-flex h-[40px] items-center gap-2 rounded-[50px] bg-[#af2525] px-6 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
						>
							<Plus size={16} />
							<span>Add Property</span>
						</Link>
					}
				/>
			) : (
				<>
					{/* Tabs */}
					<div className="mb-6 flex items-center gap-6 border-b border-black/10">
						{TABS.map((t) => {
							const active = tab === t.key;
							const count = counts[t.key];
							return (
								<button
									key={t.key}
									type="button"
									onClick={() => setTab(t.key)}
									className={cn(
										"relative pb-3 text-[15px] transition-colors",
										active
											? "font-semibold text-[#161515]"
											: "text-black/50 hover:text-black/80"
									)}
								>
									{t.label}
									{active && count > 0 && (
										<span className="ml-1 text-[15px] font-semibold text-[#161515]">
											({count})
										</span>
									)}
									{active && (
										<span className="absolute inset-x-0 -bottom-px h-[2px] bg-[#161515]" />
									)}
								</button>
							);
						})}
					</div>

					{/* Grid / empty state per tab */}
					{filtered.length === 0 ? (
						<EmptyState
							icon={
								<div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#fff1f1]">
									<Building2 className="h-8 w-8 text-[#af2525]" />
								</div>
							}
							title={emptyCopyFor(tab).title}
							description={emptyCopyFor(tab).description}
							action={
								tab === "AVAILABLE" ? (
									<Link
										href="/landlord/properties/new"
										className="inline-flex h-[40px] items-center gap-2 rounded-[50px] bg-[#af2525] px-6 text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
									>
										<Plus size={16} />
										<span>Add Property</span>
									</Link>
								) : undefined
							}
						/>
					) : (
						<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
							{filtered.map((l) => {
								const mainPhoto = l.photos.find((p) => p.isMain) ?? l.photos[0];
								const address =
									l.streetAddress ?? `${l.area}, ${l.city}`;
								return (
									<LandlordPropertyCard
										key={l.id}
										id={l.id}
										title={l.title}
										address={address}
										imageUrl={mainPhoto?.url}
										price={l.rent}
										rentPeriod={l.rentPeriod}
										verificationStatus={l.verificationStatus}
										listingStatus={l.status ?? "AVAILABLE"}
										stats={
											l.views !== undefined
												? {
													views: l.views ?? 0,
													inquiries: l.inquiryCount ?? 0,
													saves: l.savedCount ?? 0,
												}
												: undefined
										}
										onAction={handleAction}
									/>
								);
							})}
						</div>
					)}
				</>
			)}
		</div>
	);
}
