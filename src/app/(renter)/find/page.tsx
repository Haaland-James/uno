"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, BedDouble, Building2, Search, Clock } from "lucide-react";
import { buildSearchUrl } from "@/lib/search-url";
import { PropertyCard } from "@/components/property/PropertyCard";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { findBySlug, type LocationNode } from "@/lib/coverage";
import { BedsDropDown } from "@/components/property/BedsDropDown";
import { PropertyTypesDropDown } from "@/components/property/PropertyTypesDropDown";
import { EmptyState } from "@/components/shared/EmptyState";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { useFavourites } from "@/hooks/useFavourites";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useUserStore } from "@/stores/userStore";
import { useHeaderStore } from "@/stores/headerStore";

type SearchField = "location" | "beds" | "type" | null;

export default function FindPage() {
	const router = useRouter();
	const user = useUserStore((s) => s.user);
	const { isFavourited, toggleFavourite } = useFavourites();
	const setShowSearch = useHeaderStore((s) => s.setShowSearch);
	const firstName = user?.name?.split(" ")[0] ?? "there";

	/**
	 * Build & navigate to a search URL.
	 * Accepts an explicit `forLocation` so callers can submit immediately on pick
	 * without waiting for setState (which is async — caused mobile to submit with
	 * the stale null location).
	 */
	function runSearch(forLocation?: LocationNode | null) {
		const loc = forLocation !== undefined ? forLocation : selectedLocation;

		const typeFilter = propertyTypes
			.map((t) => t.toUpperCase().replace(/[\s-]/g, "_"))
			.filter((t) =>
				["FLAT", "HOUSE", "DUPLEX", "SELF_CONTAIN", "BUNGALOW", "COMMERCIAL", "LAND"].includes(t)
			);

		// Resolve picked LocationNode → state/city/area
		let stateNode: LocationNode | undefined;
		let cityNode: LocationNode | undefined;
		let areaNode: LocationNode | undefined;
		if (loc) {
			if (loc.type === "state") stateNode = loc;
			else if (loc.type === "city") {
				cityNode = loc;
				if (loc.parent) stateNode = findBySlug(loc.parent);
			} else if (loc.type === "area") {
				areaNode = loc;
				if (loc.parent) cityNode = findBySlug(loc.parent);
				if (cityNode?.parent) stateNode = findBySlug(cityNode.parent);
			}
		}

		router.push(
			buildSearchUrl({
				category: "rent",
				state: stateNode,
				city: cityNode,
				area: areaNode,
				beds: beds > 0 ? [beds] : [],
				baths: baths > 0 ? [baths] : [],
				type: typeFilter,
				furnishing: [],
				amenities: [],
				verifiedOnly: false,
				availableNow: false,
				page: 1,
			})
		);
	}

	// Search bar state
	const [openField, setOpenField] = useState<SearchField>(null);
	const [selectedLocation, setSelectedLocation] = useState<LocationNode | null>(null);
	const [beds, setBeds] = useState(0);
	const [baths, setBaths] = useState(0);
	const [propertyTypes, setPropertyTypes] = useState<string[]>([]);

	const searchBarRef = useRef<HTMLDivElement>(null);
	const searchBarSentinelRef = useRef<HTMLDivElement>(null);

	// Close dropdown on outside click
	useEffect(() => {
		function handleClickOutside(e: MouseEvent) {
			if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
				setOpenField(null);
			}
		}
		if (openField) {
			document.addEventListener("mousedown", handleClickOutside);
			return () => document.removeEventListener("mousedown", handleClickOutside);
		}
	}, [openField]);

	// Hide the header's search while this page's own search is visible;
	// show it once the user scrolls past it.
	useEffect(() => {
		const sentinel = searchBarSentinelRef.current;
		if (!sentinel) return;

		setShowSearch(false);

		const observer = new IntersectionObserver(
			([entry]) => {
				setShowSearch(!entry.isIntersecting);
			},
			{ rootMargin: "-64px 0px 0px 0px", threshold: 0 }
		);
		observer.observe(sentinel);

		return () => {
			observer.disconnect();
			setShowSearch(true);
		};
	}, [setShowSearch]);

	// Recently Viewed — actual properties this user has opened (localStorage MVP).
	// Stage 4+ can replace with a per-user DB table for cross-device sync.
	const { items: recentlyViewed, isLoading: recentlyViewedLoading } = useRecentlyViewed(9);

	return (
		<div className="w-full px-3 md:px-8 pt-14 pb-10 md:py-12">
			<div className="mx-auto flex max-w-[1100px] flex-col items-center">
				{/* Greeting — centered */}
				<div className="mb-10 md:mb-10 text-center">
					<h1 className="text-[26px] md:text-[32px] font-semibold text-[#161515] leading-tight">
						Welcome Back {firstName},
					</h1>
					<p className="text-[16px] md:text-[18px] text-[rgba(10,10,10,0.6)] mt-2">
						Let&apos;s find you a House
					</p>
				</div>

				{/* 3-filter search bar — desktop */}
				<div ref={searchBarRef} className="relative mb-12 md:mb-16 hidden md:block">
					<div className="flex items-center gap-[14px] rounded-[40px] border border-[rgba(0,0,0,0.11)] bg-white px-[7px] py-[4px] shadow-[0_2px_12px_0_rgba(0,0,0,0.04)]">
						{/* Fields */}
						<div className="relative flex items-center gap-[10px]">
							{/* Location */}
							<button
								type="button"
								onClick={() => setOpenField(openField === "location" ? null : "location")}
								className={`flex h-[64px] w-[300px] flex-col justify-center gap-[4px] rounded-[40px] px-[22px] py-[11px] text-left transition-all ${
									openField === "location"
										? "bg-[rgba(0,0,0,0.04)] shadow-[0_0_0_1.5px_rgba(0,0,0,0.12)]"
										: "hover:bg-[rgba(0,0,0,0.03)]"
								}`}
							>
								<span className="text-[11px] font-semibold text-black">Location</span>
								<div className="flex items-center gap-[6px]">
									<MapPin size={18} className="shrink-0 text-[#0a0a0a]" />
									<span className="truncate text-[15px] font-normal text-[rgba(10,10,10,0.78)]">
										{selectedLocation?.name ?? "Location"}
									</span>
								</div>
							</button>

							{/* Divider */}
							<div
								className={`h-[56px] w-px shrink-0 bg-[rgba(0,0,0,0.12)] transition-opacity ${
									openField === "location" || openField === "beds" ? "opacity-0" : ""
								}`}
							/>

							{/* Beds/Baths */}
							<button
								type="button"
								onClick={() => setOpenField(openField === "beds" ? null : "beds")}
								className={`flex h-[64px] w-[215px] shrink-0 flex-col justify-center gap-[4px] rounded-[40px] px-[26px] py-[11px] text-left transition-all ${
									openField === "beds"
										? "bg-[rgba(0,0,0,0.04)] shadow-[0_0_0_1.5px_rgba(0,0,0,0.12)]"
										: "hover:bg-[rgba(0,0,0,0.03)]"
								}`}
							>
								<span className="text-[11px] font-semibold text-black">Beds/Baths</span>
								<div className="flex items-center gap-[6px]">
									<BedDouble size={20} className="shrink-0 text-[#0a0a0a]" />
									<span className="truncate text-[15px] font-normal text-[rgba(10,10,10,0.78)]">
										{beds === 0 && baths === 0 ? "select bed/bath" : `${beds} bed / ${baths} bath`}
									</span>
								</div>
							</button>

							{/* Divider */}
							<div
								className={`h-[56px] w-px shrink-0 bg-[rgba(0,0,0,0.12)] transition-opacity ${
									openField === "beds" || openField === "type" ? "opacity-0" : ""
								}`}
							/>

							{/* Property Type */}
							<button
								type="button"
								onClick={() => setOpenField(openField === "type" ? null : "type")}
								className={`flex h-[64px] w-[220px] shrink-0 flex-col justify-center gap-[4px] rounded-[40px] px-[26px] py-[11px] text-left transition-all ${
									openField === "type"
										? "bg-[rgba(0,0,0,0.04)] shadow-[0_0_0_1.5px_rgba(0,0,0,0.12)]"
										: "hover:bg-[rgba(0,0,0,0.03)]"
								}`}
							>
								<span className="text-[11px] font-semibold text-black">Property Type</span>
								<div className="flex items-center gap-[6px]">
									<Building2 size={20} className="shrink-0 text-[#0a0a0a]" />
									<span className="truncate text-[15px] font-normal text-[rgba(10,10,10,0.78)]">
										{propertyTypes.length === 0
											? "select property type"
											: propertyTypes.slice(0, 2).join(", ")}
									</span>
								</div>
							</button>
						</div>

						{/* Search button */}
						<button
							type="button"
							onClick={() => runSearch()}
							className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#af2525] text-white transition-opacity hover:opacity-90"
							aria-label="Search"
						>
							<Search size={20} strokeWidth={2.5} />
						</button>
					</div>

					{/* Dropdowns */}
					{openField === "location" && (
						<div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[300px]">
							<LocationAutocomplete
								onPick={(node) => {
									setSelectedLocation(node);
									setOpenField(null);
								}}
								autoFocus
								placeholder="Type a state, city, or area"
							/>
						</div>
					)}
					{openField === "beds" && (
						<div className="absolute left-[325px] top-[calc(100%+8px)] z-50">
							<BedsDropDown
								beds={beds}
								baths={baths}
								onApply={(b, ba) => {
									setBeds(b);
									setBaths(ba);
									setOpenField(null);
								}}
							/>
						</div>
					)}
					{openField === "type" && (
						<div className="absolute left-[565px] top-[calc(100%+8px)] z-50">
							<PropertyTypesDropDown
								selected={propertyTypes}
								onChange={setPropertyTypes}
							/>
						</div>
					)}
				</div>

				{/* Mobile search — coverage-aware location autocomplete; pick → submit */}
				<div className="mb-10 w-full md:hidden">
					<LocationAutocomplete
						value={selectedLocation}
						onPick={(node) => {
							setSelectedLocation(node);
							// Pass node directly — runSearch can't read fresh state synchronously
							runSearch(node);
						}}
						placeholder="Location"
					/>
				</div>

				{/* Sentinel — once this scrolls above the header, the header reveals its search */}
				<div ref={searchBarSentinelRef} className="h-px w-full" />

				{/* Recently Viewed */}
				<div className="w-full">
					<h2 className="text-[20px] md:text-[24px] font-semibold text-[#161515] mb-5 md:mb-6">
						Recently Viewed
					</h2>

					{recentlyViewedLoading ? (
						<div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
							{Array.from({ length: 6 }).map((_, i) => (
								<PropertyCardSkeleton key={i} className="w-full md:w-full" />
							))}
						</div>
					) : recentlyViewed.length === 0 ? (
						<div className="w-full rounded-[20px] border border-dashed border-black/10 bg-white/60">
							<EmptyState
								icon={
									<div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#ffcfcf]">
										<Clock size={28} className="text-[#af2525]" strokeWidth={1.8} />
									</div>
								}
								title="No recently viewed properties yet"
								description="Start exploring properties that match what you're looking for. Anything you open will show up here for easy access later."
								action={
									<Link
										href="/feed"
										className="inline-flex h-[44px] items-center justify-center rounded-full bg-[#af2525] px-6 text-[15px] font-medium text-white transition-opacity hover:opacity-90"
									>
										Browse properties
									</Link>
								}
							/>
						</div>
					) : (
						<div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-5">
							{recentlyViewed.map((property) => (
								<Link
									key={property.id}
									href={`/property/${property.id}`}
									className="block w-full"
								>
									<PropertyCard
										data={property}
										isFavourited={isFavourited(property.id)}
										onToggleFavourite={toggleFavourite}
										className="w-full md:w-full"
									/>
								</Link>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
