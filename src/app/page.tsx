"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { buildSearchUrl } from "@/lib/search-url";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Home,
  BedDouble,
  Building2,
  Search,
  ChevronDown,
} from "lucide-react";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { Footer } from "@/components/layout/Footer";
import { PropertyCard } from "@/components/property/PropertyCard";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { findBySlug, type LocationNode } from "@/lib/coverage";
import { BedsDropDown } from "@/components/property/BedsDropDown";
import { PropertyTypesDropDown } from "@/components/property/PropertyTypesDropDown";
import { PricingDropDown } from "@/components/property/PricingDropDown";
import { SeeAllCard } from "@/components/property/SeeAllCard";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { useFavourites } from "@/hooks/useFavourites";
import { useFeaturedProperties } from "@/hooks/useProperties";
import { findByName } from "@/lib/coverage";

const NEIGHBORHOOD_TABS = [
  "Ewet Housing",
  "Osongama Housing Estate",
  "Nwaniba",
  "Calabar Itu",
  "Oron Road",
  "Shelter Afrique",
];

function CarouselNav({
  onPrev,
  onNext,
  canPrev,
  canNext,
}: {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
}) {
  return (
    <div className="flex items-center gap-[14px] md:gap-[22px]">
      <button
        onClick={onPrev}
        disabled={!canPrev}
        className={`flex h-[28px] w-[28px] md:h-[36px] md:w-[36px] items-center justify-center rounded-full transition-opacity ${
          canPrev ? "bg-[#af2525] hover:opacity-80" : "bg-[rgba(175,37,37,0.35)]"
        }`}
        aria-label="Previous"
      >
        <ChevronLeft className="h-[14px] w-[14px] md:h-[20px] md:w-[20px] text-white" />
      </button>
      <button
        onClick={onNext}
        disabled={!canNext}
        className={`flex h-[28px] w-[28px] md:h-[36px] md:w-[36px] items-center justify-center rounded-full transition-opacity ${
          canNext ? "bg-[#af2525] hover:opacity-90" : "bg-[rgba(175,37,37,0.35)]"
        }`}
        aria-label="Next"
      >
        <ChevronRight className="h-[14px] w-[14px] md:h-[20px] md:w-[20px] text-white" />
      </button>
    </div>
  );
}

function useCarousel() {
  const ref = useRef<HTMLDivElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const updateScroll = () => {
    const el = ref.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 5);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    updateScroll();
    el.addEventListener("scroll", updateScroll, { passive: true });
    window.addEventListener("resize", updateScroll);
    return () => {
      el.removeEventListener("scroll", updateScroll);
      window.removeEventListener("resize", updateScroll);
    };
  });

  const scroll = (dir: "left" | "right") => {
    if (!ref.current) return;
    ref.current.scrollBy({ left: dir === "left" ? -400 : 400, behavior: "smooth" });
  };
  return { ref, prev: () => scroll("left"), next: () => scroll("right"), canPrev, canNext };
}

type SearchField = "location" | "beds" | "type" | "price" | null;

export default function HomePage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Ewet Housing");
  const { isFavourited, toggleFavourite } = useFavourites();
  const [openField, setOpenField] = useState<SearchField>(null);

  function runHeroSearch() {
    // Map UI prop type tokens to schema enum values
    const typeFilter = propertyTypes
      .map((t) => t.toUpperCase().replace(/[\s-]/g, "_"))
      .filter((t) =>
        ["FLAT", "HOUSE", "DUPLEX", "SELF_CONTAIN", "BUNGALOW", "COMMERCIAL", "LAND"].includes(t)
      );

    // Resolve picked LocationNode → state/city/area for path-based URL
    let stateNode: LocationNode | undefined;
    let cityNode: LocationNode | undefined;
    let areaNode: LocationNode | undefined;
    if (selectedLocation) {
      if (selectedLocation.type === "state") {
        stateNode = selectedLocation;
      } else if (selectedLocation.type === "city") {
        cityNode = selectedLocation;
        if (selectedLocation.parent) stateNode = findBySlug(selectedLocation.parent);
      } else if (selectedLocation.type === "area") {
        areaNode = selectedLocation;
        if (selectedLocation.parent) cityNode = findBySlug(selectedLocation.parent);
        if (cityNode?.parent) stateNode = findBySlug(cityNode.parent);
      }
    }

    const url = buildSearchUrl({
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
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice < 100_000_000 ? maxPrice : undefined,
    });
    router.push(url);
  }
  const [selectedLocation, setSelectedLocation] = useState<LocationNode | null>(null);
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100_000_000);
  const [mobileOpenField, setMobileOpenField] = useState<SearchField>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(e.target as Node)) {
        setOpenField(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { items: latest, isLoading: latestLoading } = useFeaturedProperties("latest", 7);
  const { items: topListings, isLoading: topLoading } = useFeaturedProperties("top", 7, { area: activeTab });
  const { items: hot, isLoading: hotLoading } = useFeaturedProperties("hot", 7);

  // "See All" URLs.
  // Latest + Hot are platform-wide → no state pinned (works across whatever
  // states we cover today and tomorrow).
  // Top Listings IS area-specific — derive the area's parent state from
  // coverage so "See All Lekki" goes to /properties/rent/lagos?area=lekki-...
  // when we expand beyond Akwa Ibom.
  const activeAreaNode = findByName(activeTab);
  const activeAreaCity = activeAreaNode?.parent ? findByName(activeAreaNode.parent.replace(/-/g, " ")) : undefined;
  const activeAreaState = activeAreaCity?.parent ? activeAreaCity.parent : "akwa-ibom";

  const seeAllLatest = "/properties/rent?sort=newest";
  const seeAllHot = "/properties/rent?sort=most_viewed";
  const seeAllTop = activeAreaNode
    ? `/properties/rent/${activeAreaState}?area=${activeAreaNode.slug}&sort=most_viewed`
    : "/properties/rent?sort=most_viewed";

  const latestCarousel = useCarousel();
  const topCarousel = useCarousel();
  const hotCarousel = useCarousel();

  return (
    <>
      <GuestHeader />
      <main className="bg-white">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-visible pb-[50px] pt-[12px] md:pb-[70px]">
          {/* Container — matches header and section widths */}
          <div className="mx-auto max-w-[1440px] px-[4px] md:px-[40px]">
            {/* Background image */}
            <div className="relative h-[215px] overflow-hidden rounded-[15px] md:h-[260px] md:rounded-[20px]">
              <Image
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1440&q=80"
                alt="Property hero"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/50 md:bg-black/40" />

              {/* Hero heading */}
              <div className="absolute inset-0 flex items-center justify-center px-[40px]">
                <h1 className="text-center text-[35px] font-semibold leading-[40px] text-white md:text-[55px] md:font-normal md:leading-normal">
                  Rent &amp; Buy Houses Easily
                </h1>
              </div>
            </div>
          </div>

          {/* Search bar — matches Figma node 100:3397 */}
          <div
            ref={searchBarRef}
            className="relative mx-auto mt-[-38px] hidden md:block"
            style={{ width: "fit-content" }}
          >
            <div className="flex items-center gap-[18px] rounded-[40px] border border-[rgba(0,0,0,0.11)] bg-white px-[7px] py-[4px]">
              {/* Fields row */}
              <div className="relative flex items-center gap-[12px]">
                {/* Location */}
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "location" ? null : "location")}
                  className={`flex h-[67px] w-[363px] flex-col justify-center gap-[4px] rounded-[40px] px-[23px] py-[13px] text-left transition-all ${
                    openField === "location" ? "bg-[rgba(0,0,0,0.04)] shadow-[0_0_0_1.5px_rgba(0,0,0,0.12)]" : "hover:bg-[rgba(0,0,0,0.03)]"
                  }`}
                >
                  <span className="text-[11px] font-semibold text-black">Location</span>
                  <div className="flex items-center gap-[6px]">
                    <MapPin size={20} className="shrink-0 text-[#0a0a0a]" />
                    <span className="text-[16px] font-normal text-[rgba(10,10,10,0.78)] whitespace-nowrap">
                      {selectedLocation?.name ?? "Location"}
                    </span>
                  </div>
                </button>

                {/* Divider 1 */}
                <div className={`h-[61px] w-px shrink-0 bg-[rgba(0,0,0,0.12)] transition-opacity ${openField === "location" || openField === "beds" ? "opacity-0" : ""}`} />

                {/* Beds/Baths */}
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "beds" ? null : "beds")}
                  className={`flex h-[67px] w-[245px] shrink-0 flex-col justify-center gap-[4px] rounded-[40px] px-[31px] py-[11px] text-left transition-all ${
                    openField === "beds" ? "bg-[rgba(0,0,0,0.04)] shadow-[0_0_0_1.5px_rgba(0,0,0,0.12)]" : "hover:bg-[rgba(0,0,0,0.03)]"
                  }`}
                >
                  <span className="text-[11px] font-semibold text-black">Beds/Baths</span>
                  <div className="flex items-center gap-[6px]">
                    <BedDouble size={24} className="shrink-0 text-[#0a0a0a]" />
                    <span className="text-[16px] font-normal text-[rgba(10,10,10,0.78)] whitespace-nowrap">
                      {beds === 0 && baths === 0 ? "select bed/bath" : `${beds} bed / ${baths} bath`}
                    </span>
                  </div>
                </button>

                {/* Divider 2 */}
                <div className={`h-[61px] w-px shrink-0 bg-[rgba(0,0,0,0.12)] transition-opacity ${openField === "beds" || openField === "type" ? "opacity-0" : ""}`} />

                {/* Property Type */}
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "type" ? null : "type")}
                  className={`flex h-[67px] w-[245px] shrink-0 flex-col justify-center gap-[4px] rounded-[40px] px-[31px] py-[11px] text-left transition-all ${
                    openField === "type" ? "bg-[rgba(0,0,0,0.04)] shadow-[0_0_0_1.5px_rgba(0,0,0,0.12)]" : "hover:bg-[rgba(0,0,0,0.03)]"
                  }`}
                >
                  <span className="text-[11px] font-semibold text-black">Property Type</span>
                  <div className="flex items-center gap-[6px]">
                    <Building2 size={23} className="shrink-0 text-[#0a0a0a]" />
                    <span className="text-[16px] font-normal text-[rgba(10,10,10,0.78)] whitespace-nowrap">
                      {propertyTypes.length === 0 ? "select property type" : propertyTypes.slice(0, 2).join(", ")}
                    </span>
                  </div>
                </button>

                {/* Divider 3 */}
                <div className={`h-[61px] w-px shrink-0 bg-[rgba(0,0,0,0.12)] transition-opacity ${openField === "type" || openField === "price" ? "opacity-0" : ""}`} />

                {/* Price Range */}
                <button
                  type="button"
                  onClick={() => setOpenField(openField === "price" ? null : "price")}
                  className={`flex h-[67px] w-[245px] shrink-0 flex-col justify-center gap-[4px] rounded-[40px] px-[31px] py-[11px] text-left transition-all ${
                    openField === "price" ? "bg-[rgba(0,0,0,0.04)] shadow-[0_0_0_1.5px_rgba(0,0,0,0.12)]" : "hover:bg-[rgba(0,0,0,0.03)]"
                  }`}
                >
                  <span className="text-[11px] font-semibold text-black">Price Range</span>
                  <div className="flex items-center gap-[6px]">
                    <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-[rgba(0,0,0,0.4)] text-[12px] font-semibold text-[#0a0a0a]">₦</span>
                    <span className="text-[16px] font-normal text-[rgba(10,10,10,0.78)] whitespace-nowrap">
                      {minPrice === 0 && maxPrice === 100_000_000 ? "select price range" : `₦${minPrice.toLocaleString("en-NG")} – ₦${maxPrice.toLocaleString("en-NG")}`}
                    </span>
                  </div>
                </button>
              </div>

              {/* Search button */}
              <button
                type="button"
                onClick={runHeroSearch}
                className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[25px] bg-[#af2525] text-white transition-opacity hover:opacity-90"
                aria-label="Search"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </div>

            {/* Dropdowns */}
            {openField === "location" && (
              <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[363px]">
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
              <div className="absolute left-[400px] top-[calc(100%+8px)] z-50">
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
              <div className="absolute left-[660px] top-[calc(100%+8px)] z-50">
                <PropertyTypesDropDown
                  selected={propertyTypes}
                  onChange={setPropertyTypes}
                />
              </div>
            )}
            {openField === "price" && (
              <div className="absolute right-0 top-[calc(100%+8px)] z-50">
                <PricingDropDown
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onApply={(min, max) => {
                    setMinPrice(min);
                    setMaxPrice(max);
                    setOpenField(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Mobile search form */}
          <div className="relative z-10 mx-auto mt-[-28px] max-w-[1440px] px-[16px] md:hidden">
            <div className="flex flex-col gap-[14px] rounded-[16px] border border-[rgba(0,0,0,0.08)] bg-white px-[16px] py-[18px] shadow-md">
              {/* Location autocomplete — coverage-aware, writes to selectedLocation state */}
              <div className="pb-[4px]">
                <LocationAutocomplete
                  value={selectedLocation}
                  onPick={(node) => setSelectedLocation(node)}
                  placeholder="Location"
                />
              </div>

              {/* Property Type + Beds & Baths row */}
              <div className="flex items-center gap-[12px]">
                <button
                  type="button"
                  onClick={() => setMobileOpenField(mobileOpenField === "type" ? null : "type")}
                  className="flex items-center gap-[6px] rounded-[8px] border border-[rgba(0,0,0,0.1)] px-[12px] py-[8px]"
                >
                  <Building2 size={16} className="shrink-0 text-[rgba(0,0,0,0.5)]" />
                  <span className="truncate text-[13px] text-[rgba(0,0,0,0.6)]">
                    {propertyTypes.length === 0 ? "Property Type" : propertyTypes.slice(0, 1).join(", ")}
                  </span>
                  <ChevronDown size={14} className="shrink-0 text-[rgba(0,0,0,0.4)]" />
                </button>
                <button
                  type="button"
                  onClick={() => setMobileOpenField(mobileOpenField === "beds" ? null : "beds")}
                  className="flex items-center gap-[6px] rounded-[8px] border border-[rgba(0,0,0,0.1)] px-[12px] py-[8px]"
                >
                  <BedDouble size={16} className="shrink-0 text-[rgba(0,0,0,0.5)]" />
                  <span className="text-[13px] text-[rgba(0,0,0,0.6)] whitespace-nowrap">
                    {beds === 0 && baths === 0 ? "Beds & Baths" : `${beds}bd / ${baths}ba`}
                  </span>
                </button>
              </div>

              {/* Mobile dropdowns — inline */}
              {mobileOpenField === "type" && (
                <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[#fbfbfb] p-[8px]">
                  <PropertyTypesDropDown
                    selected={propertyTypes}
                    onChange={setPropertyTypes}
                    className="w-full shadow-none rounded-none"
                  />
                </div>
              )}
              {mobileOpenField === "beds" && (
                <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[#fbfbfb] p-[8px]">
                  <BedsDropDown
                    beds={beds}
                    baths={baths}
                    onApply={(b, ba) => {
                      setBeds(b);
                      setBaths(ba);
                      setMobileOpenField(null);
                    }}
                    className="w-full shadow-none rounded-none"
                  />
                </div>
              )}

              {/* Price Range */}
              <button
                type="button"
                onClick={() => setMobileOpenField(mobileOpenField === "price" ? null : "price")}
                className="flex items-center gap-[6px] rounded-[8px] border border-[rgba(0,0,0,0.1)] px-[12px] py-[8px]"
              >
                <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-[rgba(0,0,0,0.3)] text-[10px] font-semibold text-[rgba(0,0,0,0.5)]">₦</span>
                <span className="text-[13px] text-[rgba(0,0,0,0.6)]">
                  {minPrice === 0 && maxPrice === 100_000_000 ? "Price Range" : `₦${minPrice.toLocaleString("en-NG")} – ₦${maxPrice.toLocaleString("en-NG")}`}
                </span>
                <ChevronDown size={14} className="ml-auto shrink-0 text-[rgba(0,0,0,0.4)]" />
              </button>

              {mobileOpenField === "price" && (
                <div className="rounded-[12px] border border-[rgba(0,0,0,0.06)] bg-[#fbfbfb] p-[8px]">
                  <PricingDropDown
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    onApply={(min, max) => {
                      setMinPrice(min);
                      setMaxPrice(max);
                      setMobileOpenField(null);
                    }}
                    className="w-full shadow-none rounded-none"
                  />
                </div>
              )}

              {/* Search button */}
              <button
                type="button"
                onClick={runHeroSearch}
                className="flex h-[44px] w-full items-center justify-center rounded-[12px] bg-[#af2525] text-[15px] font-medium text-white transition-opacity hover:opacity-90"
              >
                Search
              </button>
            </div>
          </div>
        </section>

        {/* ── Latest Market Listings ─────────────────────────── */}
        <section className="mt-[32px] md:mt-[32px]">
          <div className="mx-auto max-w-[1440px] px-[16px] md:px-[40px]">
            <div className="mb-[16px] flex items-center justify-between md:mb-[21px]">
              <h2 className="text-[20px] font-semibold text-[#161515] md:text-[30px] md:font-medium">
                Latest Market Listings
              </h2>
              <CarouselNav onPrev={latestCarousel.prev} onNext={latestCarousel.next} canPrev={latestCarousel.canPrev} canNext={latestCarousel.canNext} />
            </div>
            <div
              ref={latestCarousel.ref}
              className="flex items-stretch gap-[11px] overflow-x-auto scroll-smooth pb-[8px] no-scrollbar md:gap-[20px]"
              style={{ scrollbarWidth: "none" }}
            >
              {latestLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} className="shrink-0" />
                  ))
                : latest.map((p) => (
                    <PropertyCard
                      key={p.id}
                      data={p}
                      isFavourited={isFavourited(p.id)}
                      onToggleFavourite={toggleFavourite}
                      className="shrink-0"
                    />
                  ))}
              {!latestLoading && latest.length > 0 && (
                <SeeAllCard href={seeAllLatest} images={latest.slice(0, 3).map((p) => p.photos[0]?.url)} className="shrink-0" />
              )}
            </div>
          </div>
        </section>

        {/* ── Top Listings Ewet Housing ──────────────────────── */}
        <section className="mt-[36px] md:mt-[60px]">
          <div className="mx-auto max-w-[1440px] px-[16px] md:px-[40px]">
            {/* Header row */}
            <div className="mb-[16px] flex items-start justify-between gap-[12px]">
              <div className="flex items-center gap-[10px]">
                <h2 className="text-[20px] font-semibold text-[#161515] md:text-[30px] md:font-medium">
                  Top Listings {activeTab}
                </h2>
                <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-[#f5d0d0]">
                  <MapPin size={14} className="text-[#af2525]" />
                </div>
              </div>
              <CarouselNav onPrev={topCarousel.prev} onNext={topCarousel.next} canPrev={topCarousel.canPrev} canNext={topCarousel.canNext} />
            </div>

            {/* Neighbourhood tabs */}
            <div className="mb-[16px] flex items-center gap-[18px] overflow-x-auto no-scrollbar md:mb-[20px] md:gap-[24px]">
              {NEIGHBORHOOD_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={[
                    "shrink-0 whitespace-nowrap pb-[6px] text-[13px] transition-colors md:text-[16px]",
                    activeTab === tab
                      ? "border-b-2 border-[#151515] font-medium text-[#151515]"
                      : "text-[rgba(0,0,0,0.5)] hover:text-[rgba(0,0,0,0.8)]",
                  ].join(" ")}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Cards */}
            <div
              ref={topCarousel.ref}
              className="flex items-stretch gap-[11px] overflow-x-auto scroll-smooth pb-[8px] no-scrollbar md:gap-[20px]"
              style={{ scrollbarWidth: "none" }}
            >
              {topLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} className="shrink-0" />
                  ))
                : topListings.map((p) => (
                    <PropertyCard
                      key={p.id}
                      data={p}
                      isFavourited={isFavourited(p.id)}
                      onToggleFavourite={toggleFavourite}
                      className="shrink-0"
                    />
                  ))}
              {!topLoading && topListings.length > 0 && (
                <SeeAllCard href={seeAllTop} images={topListings.slice(0, 3).map((p) => p.photos[0]?.url)} className="shrink-0" />
              )}
            </div>
          </div>
        </section>

        {/* ── Hot Properties ─────────────────────────────────── */}
        <section className="mt-[36px] md:mt-[60px]">
          <div className="mx-auto max-w-[1440px] px-[16px] md:px-[40px]">
            <div className="mb-[16px] flex items-center justify-between md:mb-[21px]">
              <h2 className="text-[20px] font-semibold text-[#161515] md:text-[30px] md:font-medium">
                Hot Properties
              </h2>
              <CarouselNav onPrev={hotCarousel.prev} onNext={hotCarousel.next} canPrev={hotCarousel.canPrev} canNext={hotCarousel.canNext} />
            </div>
            <div
              ref={hotCarousel.ref}
              className="flex items-stretch gap-[11px] overflow-x-auto scroll-smooth pb-[8px] no-scrollbar md:gap-[20px]"
              style={{ scrollbarWidth: "none" }}
            >
              {hotLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} className="shrink-0" />
                  ))
                : hot.map((p) => (
                    <PropertyCard
                      key={p.id}
                      data={p}
                      isFavourited={isFavourited(p.id)}
                      onToggleFavourite={toggleFavourite}
                      className="shrink-0"
                    />
                  ))}
              {!hotLoading && hot.length > 0 && (
                <SeeAllCard href={seeAllHot} images={hot.slice(0, 3).map((p) => p.photos[0]?.url)} className="shrink-0" />
              )}
            </div>
          </div>
        </section>

        {/* ── CTA Banner ─────────────────────────────────────── */}
        <section className="mx-auto mt-[40px] max-w-[1440px] px-[16px] md:mt-[80px] md:px-[40px]">
          <div className="relative flex flex-col items-center overflow-hidden rounded-[15px] bg-[#af2525] px-[24px] py-[32px] text-center md:flex-row md:items-center md:justify-between md:px-[60px] md:py-[50px] md:text-left">
            {/* Left: text + button */}
            <div className="flex max-w-[520px] flex-col items-center gap-[12px] md:items-start md:gap-[16px]">
              <h2 className="text-[26px] font-normal leading-[1.2] text-white md:text-[46px]">
                Find your dream home today
              </h2>
              <p className="text-[12px] leading-[1.5] text-white/75 md:text-[14px]">
                Professional property snagging that catches defects developers hope
                you&apos;ll miss, ensuring your dream home meets the highest quality
                standards.
              </p>
              <Link
                href="/login"
                className="mt-[4px] flex h-[36px] items-center rounded-full bg-[#0a0a0a] px-[24px] text-[14px] font-normal text-white transition-opacity hover:opacity-90 md:h-[41px] md:px-[28px] md:text-[15px]"
              >
                Join / Sign In
              </Link>
            </div>

            {/* Right: house illustration */}
            <div className="hidden shrink-0 items-center justify-center md:flex">
              <Home
                size={220}
                strokeWidth={1}
                className="text-white/90"
              />
            </div>
          </div>
        </section>

        {/* Spacer before footer */}
        <div className="h-[40px] md:h-[80px]" />
      </main>
      <Footer />
    </>
  );
}
