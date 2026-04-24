"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Home,
  Search,
  X,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  Menu,
  Map,
  List,
} from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { BedsDropDown } from "@/components/property/BedsDropDown";
import { PropertyTypesDropDown } from "@/components/property/PropertyTypesDropDown";
import { PricingDropDown } from "@/components/property/PricingDropDown";
import { propertiesClient } from "@/lib/clients/properties";
import { useFavourites } from "@/hooks/useFavourites";
import type { PropertyCardData } from "@/types/property";
import { cn } from "@/lib/utils";

type OpenFilter = "beds" | "type" | "price" | "sort" | "listingType" | null;

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price_asc" },
  { label: "Price: High to Low", value: "price_desc" },
];

const PAGE_SIZE = 8;

export default function SearchPage() {
  const [searchText, setSearchText] = useState("");
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const [listingType, setListingType] = useState<"rent" | "sale">("rent");
  const [beds, setBeds] = useState(0);
  const [baths, setBaths] = useState(0);
  const [propertyTypes, setPropertyTypes] = useState<string[]>([]);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(100_000_000);
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const { isFavourited, toggleFavourite } = useFavourites();
  const [mobileView, setMobileView] = useState<"map" | "list">("list");
  const [serverItems, setServerItems] = useState<PropertyCardData[]>([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(true);
  const [sheetPosition, setSheetPosition] = useState<"half" | "full">("half");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const sheetScrollRef = useRef<HTMLDivElement>(null);
  const sheetContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);
  const sheetPositionRef = useRef(sheetPosition);

  // Keep ref in sync with state for use in touch handlers
  useEffect(() => { sheetPositionRef.current = sheetPosition; }, [sheetPosition]);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node))
        setOpenFilter(null);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  /* ── Scroll-to-expand bottom sheet (Airbnb pattern) ── */
  // When sheet is "half": intercept upward scroll → expand to full (no content scroll)
  // When sheet is "full" and scrollTop===0: intercept downward scroll → collapse to half
  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    const scrollEl = sheetScrollRef.current;
    if (!scrollEl) return;
    const deltaY = e.touches[0].clientY - touchStartY.current;
    const pos = sheetPositionRef.current;

    if (pos === "half") {
      // Sheet is half-open: block all content scroll, any upward swipe expands
      e.preventDefault();
    } else if (pos === "full" && scrollEl.scrollTop <= 0 && deltaY > 0) {
      // Sheet is full, content at top, swiping down: block scroll so we can collapse
      e.preventDefault();
    }
  }, []);

  const handleSheetTouchEnd = useCallback((e: React.TouchEvent) => {
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;
    const threshold = 30;
    const pos = sheetPositionRef.current;
    const scrollEl = sheetScrollRef.current;

    if (pos === "half" && deltaY < -threshold) {
      setSheetPosition("full");
    } else if (pos === "full" && scrollEl && scrollEl.scrollTop <= 0 && deltaY > threshold) {
      setSheetPosition("half");
    }
  }, []);

  const toggleFav = toggleFavourite;

  // Map UI prop type tokens to schema enum values
  const propTypeEnum = propertyTypes
    .filter((t) => t !== "Any")
    .map((t) => t.toUpperCase().replace(/[\s-]/g, "_"))
    .filter((t) => ["FLAT", "HOUSE", "DUPLEX", "SELF_CONTAIN", "BUNGALOW", "COMMERCIAL", "LAND"].includes(t));

  // Fetch from API whenever filters change (debounced)
  useEffect(() => {
    let cancelled = false;
    setSearchLoading(true);
    const handle = setTimeout(() => {
      propertiesClient
        .list({
          q: searchText.trim() || undefined,
          beds: beds > 0 ? [beds] : undefined,
          baths: baths > 0 ? [baths] : undefined,
          type: propTypeEnum.length ? propTypeEnum : undefined,
          listingType: listingType === "sale" ? ["SALE"] : ["RENT", "LEASE"],
          minPrice: minPrice > 0 ? minPrice : undefined,
          maxPrice: maxPrice < 100_000_000 ? maxPrice : undefined,
          sort: sortBy as "newest" | "price_asc" | "price_desc",
          page,
          pageSize: PAGE_SIZE,
        })
        .then((res) => {
          if (cancelled) return;
          setServerItems(res.items);
          setServerTotal(res.total);
          setSearchLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setServerItems([]);
          setServerTotal(0);
          setSearchLoading(false);
        });
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [searchText, beds, baths, propTypeEnum.join(","), listingType, minPrice, maxPrice, sortBy, page]);

  const paginated = serverItems;
  const totalPages = Math.max(1, Math.ceil(serverTotal / PAGE_SIZE));
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Newest";

  useEffect(() => { setPage(1); }, [beds, baths, propertyTypes, minPrice, maxPrice]);

  const bedsLabel = beds === 0 && baths === 0 ? "Beds & Baths" : `${beds} bed / ${baths} bath`;
  const typeLabel = propertyTypes.length === 0 ? "Home Type" : propertyTypes.slice(0, 2).join(", ");
  const listingLabel = listingType === "rent" ? "For Rent" : "For Sale";

  const goToPage = (n: number) => {
    setPage(n);
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* ── Map content (shared) ───────────────────────────── */
  const mapContent = (
    <>
      <iframe
        title="Map"
        src="https://www.openstreetmap.org/export/embed.html?bbox=7.8%2C4.9%2C8.1%2C5.1&layer=mapnik"
        className="h-full w-full border-0"
        loading="lazy"
      />
      {[
        { top: "22%", left: "30%", price: "₦3M" },
        { top: "35%", left: "55%", price: "₦8M" },
        { top: "28%", left: "72%", price: "₦1.8M" },
        { top: "48%", left: "40%", price: "₦15M" },
        { top: "55%", left: "65%", price: "₦8.5M" },
        { top: "40%", left: "20%", price: "₦5M" },
        { top: "62%", left: "50%", price: "₦3.5M" },
        { top: "30%", left: "85%", price: "₦2M" },
      ].map(({ top, left, price }) => (
        <button
          key={price + top}
          style={{ top, left }}
          className="absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#1a4d2e] px-[8px] py-[3px] text-[11px] font-semibold text-white shadow-md transition-colors hover:bg-[#af2525]"
        >
          {price}
        </button>
      ))}
    </>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-white">
      {/* ═══════════════════════════════════════════════════
           DESKTOP HEADER
         ═══════════════════════════════════════════════════ */}
      <header className="z-50 hidden flex-shrink-0 border-b border-[rgba(0,0,0,0.1)] bg-[#fbfbfb] md:block">
        <div className="flex items-center justify-between px-[41px] py-[6px]">
          <div className="flex items-center gap-[50px]">
            <Link href="/" className="flex items-center gap-[6px]">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#f5d0d0]">
                <Home className="h-[18px] w-[18px] text-[#af2525]" strokeWidth={2.5} />
              </div>
              <span className="text-[28px] font-normal leading-none text-[#af2525]">uno</span>
            </Link>

            <div className="flex h-[48px] w-[570px] items-center justify-between rounded-[40px] border border-[rgba(186,186,186,0.65)] px-[23px]">
              <div className="flex flex-1 items-center gap-[6px]">
                <div className={cn(
                  "flex h-[25px] w-[25px] flex-shrink-0 items-center justify-center rounded-full transition-colors",
                  searchText ? "bg-[#af2525]" : "bg-[rgba(175,37,37,0.3)]"
                )}>
                  <Search className="h-[14px] w-[14px] text-white" />
                </div>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="City, Address, Neighbourhood..."
                  className={cn(
                    "w-full bg-transparent text-[16px] outline-none placeholder:text-[rgba(10,10,10,0.4)]",
                    searchText ? "text-[#0a0a0a]" : "text-[rgba(10,10,10,0.4)]"
                  )}
                />
              </div>
              {searchText && (
                <button onClick={() => setSearchText("")} className="flex-shrink-0 text-[rgba(0,0,0,0.35)] transition-colors hover:text-[rgba(0,0,0,0.7)]">
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          <Link href="/login" className="flex h-[41px] items-center justify-center rounded-full bg-[#af2525] px-[30px] text-[15px] font-normal tracking-[-0.3px] text-white transition-opacity hover:opacity-90">
            Join / Sign In
          </Link>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
           MOBILE HEADER (h-[64px], matches Figma 226:18847)
         ═══════════════════════════════════════════════════ */}
      <header className="z-50 flex h-[64px] flex-shrink-0 items-center justify-between border-b border-[rgba(0,0,0,0.1)] bg-[#fbfbfb] px-[15px] md:hidden">
        {/* Search + filter */}
        <div className="flex items-center gap-[10px]">
          <div className="flex h-[37px] w-[204px] items-center justify-between rounded-[40px] border border-[rgba(186,186,186,0.65)] px-[12px]">
            <div className="flex items-center gap-[6px]">
              <div className={cn(
                "flex h-[21px] w-[21px] flex-shrink-0 items-center justify-center rounded-full transition-colors",
                searchText ? "bg-[#af2525]" : "bg-[rgba(175,37,37,0.3)]"
              )}>
                <Search className="h-[10px] w-[10px] text-white" />
              </div>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search..."
                className={cn(
                  "w-full bg-transparent text-[14px] outline-none placeholder:text-[rgba(10,10,10,0.4)]",
                  searchText ? "text-[#0a0a0a]" : "text-[rgba(10,10,10,0.4)]"
                )}
              />
            </div>
            {searchText && (
              <button onClick={() => setSearchText("")} className="flex-shrink-0 text-[rgba(0,0,0,0.3)]">
                <X size={15} />
              </button>
            )}
          </div>
          <button onClick={() => setMobileFilterOpen((v) => !v)} className="flex-shrink-0" aria-label="Filters">
            <SlidersHorizontal size={16} className="text-[#0a0a0a]" />
          </button>
        </div>

        {/* Menu */}
        <Menu size={24} className="flex-shrink-0 text-[#0a0a0a]" />
      </header>

      {/* ═══════════════════════════════════════════════════
           DESKTOP SPLIT PANE
         ═══════════════════════════════════════════════════ */}
      <div className="hidden flex-1 overflow-hidden md:flex">
        {/* Left: results */}
        <div className="flex w-[55%] max-w-[820px] flex-shrink-0 flex-col overflow-hidden border-r border-[rgba(0,0,0,0.06)]">
          {/* Filter bar */}
          <div ref={filterRef} className="relative flex-shrink-0 border-b border-[rgba(0,0,0,0.06)] px-[24px] py-[14px]">
            <div className="flex items-end gap-[20px]">
              <div className="flex flex-1 items-center gap-[6px] overflow-x-auto no-scrollbar">
                {/* Listing type */}
                <div className="relative flex-shrink-0">
                  <button
                    onClick={() => setOpenFilter(openFilter === "listingType" ? null : "listingType")}
                    className={cn("flex h-[40px] w-[109px] items-center justify-between rounded-[33px] border px-[12px]", openFilter === "listingType" ? "border-[#af2525]" : "border-[#e4e4e7]")}
                  >
                    <span className="text-[14px] font-medium text-[#18181b]">{listingLabel}</span>
                    <ChevronsUpDown size={15} className="text-[#71717a]" />
                  </button>
                  {openFilter === "listingType" && (
                    <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[140px] rounded-[10px] border border-[#e4e4e7] bg-white py-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                      {(["rent", "sale"] as const).map((v) => (
                        <button key={v} onClick={() => { setListingType(v); setOpenFilter(null); }} className={cn("w-full px-[14px] py-[8px] text-left text-[14px] transition-colors hover:bg-[rgba(0,0,0,0.03)]", listingType === v ? "font-semibold text-[#af2525]" : "text-[#18181b]")}>
                          {v === "rent" ? "For Rent" : "For Sale"}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button onClick={() => setOpenFilter(openFilter === "beds" ? null : "beds")} className={cn("flex h-[40px] flex-shrink-0 items-center gap-[11px] rounded-[33px] border px-[12px]", openFilter === "beds" ? "border-[#af2525]" : "border-[#e4e4e7]")}>
                  <span className="whitespace-nowrap text-[14px] font-medium text-[#18181b]">{bedsLabel}</span>
                  <ChevronsUpDown size={15} className="text-[#71717a]" />
                </button>

                <button onClick={() => setOpenFilter(openFilter === "type" ? null : "type")} className={cn("flex h-[40px] w-[130px] flex-shrink-0 items-center justify-between rounded-[33px] border px-[12px]", openFilter === "type" ? "border-[#af2525]" : "border-[#e4e4e7]")}>
                  <span className="truncate text-[14px] font-medium text-[#18181b]">{typeLabel}</span>
                  <ChevronsUpDown size={15} className="flex-shrink-0 text-[#71717a]" />
                </button>

                <button onClick={() => setOpenFilter(openFilter === "price" ? null : "price")} className={cn("flex h-[40px] w-[109px] flex-shrink-0 items-center justify-between rounded-[33px] border px-[12px]", openFilter === "price" ? "border-[#af2525]" : "border-[#e4e4e7]")}>
                  <span className="text-[14px] font-medium text-[#18181b]">Price</span>
                  <ChevronsUpDown size={15} className="text-[#71717a]" />
                </button>
              </div>

              <button className="flex h-[41px] flex-shrink-0 items-center justify-center rounded-[50px] bg-[#af2525] px-[24px] text-[15px] font-normal tracking-[-0.3px] text-white transition-opacity hover:opacity-90">
                Save Search
              </button>
            </div>

            {openFilter === "beds" && (
              <div className="absolute left-[140px] top-[calc(100%+4px)] z-50">
                <BedsDropDown beds={beds} baths={baths} onApply={(b, ba) => { setBeds(b); setBaths(ba); setOpenFilter(null); }} />
              </div>
            )}
            {openFilter === "type" && (
              <div className="absolute left-[290px] top-[calc(100%+4px)] z-50">
                <PropertyTypesDropDown selected={propertyTypes} onChange={setPropertyTypes} />
              </div>
            )}
            {openFilter === "price" && (
              <div className="absolute left-[430px] top-[calc(100%+4px)] z-50">
                <PricingDropDown minPrice={minPrice} maxPrice={maxPrice} onApply={(min, max) => { setMinPrice(min); setMaxPrice(max); setOpenFilter(null); }} />
              </div>
            )}
          </div>

          {/* Results meta */}
          <div className="flex flex-shrink-0 items-end justify-between border-b border-[rgba(0,0,0,0.06)] px-[24px] py-[12px]">
            <div className="flex flex-col gap-[3px]">
              <p className="text-[15px] font-medium text-[#161515]">
                {serverTotal} Properties listed for {listingType === "rent" ? "rent" : "sale"}
              </p>
              <p className="text-[20px] font-semibold text-[#161515]">
                {searchText || "Uyo"}, Uyo, Akwa Ibom
              </p>
            </div>
            <div className="relative flex items-center gap-px">
              <span className="text-[12px] text-black">Sort:</span>
              <button onClick={() => setOpenFilter(openFilter === "sort" ? null : "sort")} className="flex items-center gap-[2px] text-[12px] font-medium text-[#18181b]">
                {currentSortLabel}
                <ChevronDown size={15} className="text-[#71717a]" />
              </button>
              {openFilter === "sort" && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[180px] rounded-[10px] border border-[#e4e4e7] bg-white py-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  {SORT_OPTIONS.map((opt) => (
                    <button key={opt.value} onClick={() => { setSortBy(opt.value); setOpenFilter(null); }} className={cn("w-full px-[14px] py-[7px] text-left text-[13px] transition-colors hover:bg-[rgba(0,0,0,0.03)]", sortBy === opt.value ? "font-semibold text-[#af2525]" : "text-[#18181b]")}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable card grid */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-[24px] py-[24px]">
            {paginated.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <p className="text-[15px] text-[rgba(0,0,0,0.4)]">No properties match your filters</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-[20px]">
                {paginated.map((p) => (
                  <PropertyCard key={p.id} data={p} isFavourited={isFavourited(p.id)} onToggleFavourite={toggleFav} className="w-full md:w-full" />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-[40px] flex flex-col gap-[7px]">
                <div className="p-[10px]">
                  <p className="text-[16px] font-normal text-black">Showing page {page} of {totalPages}</p>
                </div>
                <div className="flex items-center gap-[7px] p-[10px]">
                  <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="flex h-[20px] w-[20px] rotate-180 items-center justify-center rounded-full bg-[#af2525] transition-opacity disabled:opacity-30" aria-label="Previous page">
                    <ChevronRight size={13} className="text-white" />
                  </button>
                  <div className="flex items-center gap-[29px]">
                    <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="text-[14px] font-medium text-[#18181b] disabled:opacity-30">Previous</button>
                    <div className="flex items-center gap-[25px]">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button key={n} onClick={() => goToPage(n)} className={cn("text-[14px] font-medium text-[#18181b] transition-colors", page === n ? "rounded-[2px] border border-[#e4e4e7] px-[8px] py-[4px]" : "hover:text-[#af2525]")}>{n}</button>
                      ))}
                    </div>
                    <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="text-[14px] font-medium text-[#18181b] disabled:opacity-30">Next</button>
                  </div>
                  <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#af2525] transition-opacity disabled:opacity-30" aria-label="Next page">
                    <ChevronRight size={13} className="text-white" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Map with padding + rounded */}
        <div className="relative flex-1 p-[10px]">
          <div className="relative h-full overflow-hidden rounded-[20px]">
            {mapContent}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
           MOBILE VIEW (Airbnb-style draggable sheet)
         ═══════════════════════════════════════════════════ */}
      <div ref={sheetContainerRef} className="relative flex flex-1 flex-col overflow-hidden md:hidden">
        {/* Map — always rendered behind */}
        <div className="absolute inset-0 z-0">
          {mapContent}
        </div>

        {/* Bottom sheet — scroll-to-expand over map */}
        {mobileView === "list" && (
          <div
            ref={sheetRef}
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            className={cn(
              "absolute inset-x-0 bottom-0 z-10 flex flex-col bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.1)] transition-[top] duration-300 ease-out",
              sheetPosition === "full" ? "top-0" : "top-[55%] rounded-t-[26px]"
            )}
          >
            {/* Pull indicator */}
            <div className="flex flex-shrink-0 items-center justify-center py-[12px]">
              <div className="h-[8px] w-[66px] rounded-[50px] bg-[#af2525]" />
            </div>

            {/* Location heading + sort */}
            <div className="flex-shrink-0 px-[15px] pb-[10px]">
              <p className="text-[16px] font-medium leading-[18px] text-[#161515]">
                {searchText || "Uyo"} Uyo, Akwa Ibom{"\n"}homes for sale &amp; real estate
              </p>
              <div className="mt-[6px] flex items-center justify-between">
                <p className="text-[11px] font-medium text-[rgba(22,21,21,0.64)]">
                  {serverTotal} properties for {listingType === "rent" ? "rent" : "sale"}
                </p>
                <div className="flex items-center gap-px">
                  <span className="text-[12px] text-black">Sort:</span>
                  <span className="text-[12px] font-medium text-[#18181b]">{currentSortLabel}</span>
                  <ChevronDown size={15} className="text-[#71717a]" />
                </div>
              </div>
            </div>

            {/* Scrollable cards — only scrolls when sheet is fully expanded */}
            <div
              ref={sheetScrollRef}
              className={cn(
                "flex-1 px-[23px] pb-[90px] pt-[10px]",
                sheetPosition === "full" ? "overflow-y-auto" : "overflow-hidden"
              )}
            >
              <div className="flex flex-col gap-[15px]">
                {paginated.map((p) => (
                  <PropertyCard
                    key={p.id}
                    data={p}
                    isFavourited={isFavourited(p.id)}
                    onToggleFavourite={toggleFav}
                    className="w-full"
                  />
                ))}
              </div>

              {/* Mobile pagination */}
              {totalPages > 1 && (
                <div className="mt-[20px] flex flex-col gap-[10px]">
                  <p className="text-[12px] font-normal text-black">
                    Showing page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-[7px]">
                    <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="flex h-[20px] w-[20px] rotate-180 items-center justify-center rounded-full bg-[#af2525] transition-opacity disabled:opacity-30">
                      <ChevronRight size={13} className="text-white" />
                    </button>
                    <div className="flex items-center gap-[29px]">
                      <button onClick={() => goToPage(page - 1)} disabled={page === 1} className="text-[14px] font-medium text-[#18181b] disabled:opacity-30">Previous</button>
                      <div className="flex items-center gap-[16px]">
                        {Array.from({ length: Math.min(totalPages, 4) }, (_, i) => i + 1).map((n) => (
                          <button key={n} onClick={() => goToPage(n)} className={cn("text-[14px] font-medium text-[#18181b]", page === n ? "rounded-[2px] border border-[#e4e4e7] px-[8px] py-[4px]" : "")}>
                            {n}
                          </button>
                        ))}
                        {totalPages > 4 && <span className="text-[12px] text-[rgba(0,0,0,0.3)]">…</span>}
                      </div>
                      <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="text-[14px] font-medium text-[#18181b] disabled:opacity-30">Next</button>
                    </div>
                    <button onClick={() => goToPage(page + 1)} disabled={page === totalPages} className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#af2525] transition-opacity disabled:opacity-30">
                      <ChevronRight size={13} className="text-white" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile filter overlay */}
        {mobileFilterOpen && (
          <div className="absolute inset-0 z-40 flex flex-col bg-white">
            <div className="flex h-[56px] flex-shrink-0 items-center justify-between border-b border-[rgba(0,0,0,0.08)] px-[16px]">
              <span className="text-[18px] font-semibold text-[#161515]">Filters</span>
              <button onClick={() => setMobileFilterOpen(false)} className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-[rgba(0,0,0,0.05)]">
                <X size={18} className="text-[#0a0a0a]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-[16px] py-[20px]">
              {/* Listing type */}
              <div className="mb-[24px]">
                <p className="mb-[10px] text-[14px] font-semibold text-[#161515]">Listing Type</p>
                <div className="flex gap-[10px]">
                  {(["rent", "sale"] as const).map((v) => (
                    <button
                      key={v}
                      onClick={() => setListingType(v)}
                      className={cn(
                        "flex h-[40px] items-center justify-center rounded-[33px] border px-[20px] text-[14px] font-medium transition-colors",
                        listingType === v
                          ? "border-[#af2525] bg-[#af2525] text-white"
                          : "border-[#e4e4e7] text-[#18181b]"
                      )}
                    >
                      {v === "rent" ? "For Rent" : "For Sale"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Beds & Baths */}
              <div className="mb-[24px]">
                <p className="mb-[10px] text-[14px] font-semibold text-[#161515]">Beds & Baths</p>
                <BedsDropDown
                  beds={beds}
                  baths={baths}
                  onApply={(b, ba) => { setBeds(b); setBaths(ba); }}
                  className="shadow-none border border-[#e4e4e7]"
                />
              </div>

              {/* Home Type */}
              <div className="mb-[24px]">
                <p className="mb-[10px] text-[14px] font-semibold text-[#161515]">Home Type</p>
                <PropertyTypesDropDown
                  selected={propertyTypes}
                  onChange={setPropertyTypes}
                />
              </div>

              {/* Price */}
              <div className="mb-[24px]">
                <p className="mb-[10px] text-[14px] font-semibold text-[#161515]">Price Range</p>
                <PricingDropDown
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  onApply={(min, max) => { setMinPrice(min); setMaxPrice(max); }}
                />
              </div>
            </div>

            {/* Apply + Reset buttons */}
            <div className="flex flex-shrink-0 gap-[10px] border-t border-[rgba(0,0,0,0.08)] px-[16px] py-[14px]">
              <button
                onClick={() => {
                  setBeds(0); setBaths(0); setPropertyTypes([]); setMinPrice(0); setMaxPrice(100_000_000); setListingType("rent");
                }}
                className="flex h-[44px] flex-1 items-center justify-center rounded-[50px] border border-[#e4e4e7] text-[14px] font-medium text-[#18181b]"
              >
                Reset
              </button>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="flex h-[44px] flex-1 items-center justify-center rounded-[50px] bg-[#af2525] text-[14px] font-medium text-white"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Floating Maps/List toggle */}
        <button
          onClick={() => {
            setMobileView((v) => (v === "map" ? "list" : "map"));
          }}
          className="absolute bottom-[24px] left-1/2 z-30 flex h-[41px] -translate-x-1/2 items-center gap-[6px] rounded-[50px] bg-[#af2525] px-[30px] text-[14px] font-normal tracking-[-0.28px] text-white shadow-[0_4px_24px_rgba(0,0,0,0.25)] transition-transform active:scale-95"
        >
          {mobileView === "map" ? (
            <>
              <List size={20} />
              List
            </>
          ) : (
            <>
              <Map size={20} />
              Maps
            </>
          )}
        </button>
      </div>
    </div>
  );
}
