"use client";

import { signOutAndToast } from "@/lib/auth-actions";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Home,
  Search,
  X,
  ChevronsUpDown,
  ChevronDown,
  Menu,
  Map,
  List,
} from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { PropertyCardSkeleton } from "@/components/property/PropertyCardSkeleton";
import { BedsDropDown } from "@/components/property/BedsDropDown";
import { PropertyTypesDropDown } from "@/components/property/PropertyTypesDropDown";
import { PricingDropDown } from "@/components/property/PricingDropDown";
import { LocationAutocomplete } from "@/components/search/LocationAutocomplete";
import { SaveSearchPopover } from "@/components/search/SaveSearchPopover";
import { searchStateToCriteria, summarizeCriteria } from "@/lib/saved-search-mapper";
import { GuestMobileDrawer } from "@/components/layout/GuestMobileDrawer";
import { MobileDrawer } from "@/components/layout/MobileDrawer";
import { SearchPageFooter } from "@/components/layout/SearchPageFooter";
import { propertiesClient } from "@/lib/clients/properties";
import { useFavourites } from "@/hooks/useFavourites";
import { useAuthModalStore } from "@/stores/authModalStore";
import {
  parseSearchUrl,
  buildSearchUrl,
  searchStateToApiParams,
  describePlace,
  type SearchCategory,
  type SearchState,
} from "@/lib/search-url";
import { findBySlug, type LocationNode } from "@/lib/coverage";
import type { PropertyCardData } from "@/types/property";
import { cn } from "@/lib/utils";

type OpenFilter = "beds" | "type" | "price" | "sort" | "listingType" | null;

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" as const },
  { label: "Price: Low to High", value: "price_asc" as const },
  { label: "Price: High to Low", value: "price_desc" as const },
  { label: "Most Viewed", value: "most_viewed" as const },
];

const PAGE_SIZE = 8;

// First-filter dropdown options — matches user's design: For Rent / For Sale / For Lease
const LISTING_OPTIONS: { value: SearchCategory; label: string }[] = [
  { value: "rent", label: "For Rent" },
  { value: "sale", label: "For Sale" },
  { value: "lease", label: "For Lease" },
];

export default function PropertiesSearchPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const slug = useMemo(() => {
    const raw = params?.slug;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") return [raw];
    return [];
  }, [params]);

  // URL is the source of truth for all filter state
  const state = useMemo(
    () => parseSearchUrl(slug, new URLSearchParams(searchParams.toString())),
    [slug, searchParams]
  );

  const { data: session, status } = useSession();
  const isAuthed = status === "authenticated";
  const openLogin = useAuthModalStore((s) => s.openLogin);
  const { isFavourited, toggleFavourite } = useFavourites();

  // ── Local UI state (filter dropdowns + map/list toggle) ─────────
  const [openFilter, setOpenFilter] = useState<OpenFilter>(null);
  const [mobileView, setMobileView] = useState<"map" | "list">("list");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchInline, setShowSearchInline] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Fetched data ──────────────────────────────────────────────
  const [items, setItems] = useState<PropertyCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const reqId = useRef(0);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenFilter(null);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Fetch on URL change
  useEffect(() => {
    const myId = ++reqId.current;
    setLoading(true);
    const apiParams = searchStateToApiParams({ ...state, page: state.page });
    apiParams.pageSize = PAGE_SIZE;
    const handle = setTimeout(() => {
      propertiesClient
        .list(apiParams)
        .then((res) => {
          if (myId !== reqId.current) return;
          setItems(res.items);
          setTotal(res.total);
          setLoading(false);
        })
        .catch(() => {
          if (myId !== reqId.current) return;
          setItems([]);
          setTotal(0);
          setLoading(false);
        });
    }, 200);
    return () => clearTimeout(handle);
  }, [state]);

  // ── URL navigation helpers ─────────────────────────────────────
  const navigate = useCallback(
    (patch: Partial<SearchState>) => {
      router.push(buildSearchUrl({ ...state, ...patch, page: 1 }));
    },
    [router, state]
  );

  function setCategory(cat: SearchCategory) {
    navigate({ category: cat });
  }

  function setLocation(node: LocationNode | null) {
    if (!node) {
      navigate({ state: undefined, city: undefined, area: undefined, q: undefined });
      return;
    }
    if (node.type === "state") {
      navigate({ state: node, city: undefined, area: undefined, q: undefined });
    } else if (node.type === "city") {
      const stateNode = node.parent ? findBySlug(node.parent) : undefined;
      navigate({ state: stateNode ?? state.state, city: node, area: undefined, q: undefined });
    } else if (node.type === "area") {
      const cityNode = node.parent ? findBySlug(node.parent) : undefined;
      const stateNode = cityNode?.parent ? findBySlug(cityNode.parent) : undefined;
      navigate({
        state: stateNode ?? state.state,
        city: cityNode ?? state.city,
        area: node,
        q: undefined,
      });
    }
  }

  function clearLocation() {
    navigate({ state: undefined, city: undefined, area: undefined, q: undefined });
  }

  function setSort(sort: SearchState["sort"]) {
    navigate({ sort });
  }

  function goToPage(n: number) {
    router.push(buildSearchUrl({ ...state, page: n }));
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Derived labels ─────────────────────────────────────────────
  const currentCategory = state.category ?? "rent";
  const listingLabel = LISTING_OPTIONS.find((o) => o.value === currentCategory)?.label ?? "For Rent";
  const bedsLabel =
    state.beds.length === 0 && state.baths.length === 0
      ? "Beds & Baths"
      : `${state.beds.join(",") || 0} bed / ${state.baths.join(",") || 0} bath`;
  const typeLabel = state.type.length === 0 ? "Home Type" : state.type.length === 1 ? state.type[0] : `${state.type.length} types`;
  const priceLabel =
    state.minPrice || state.maxPrice
      ? `₦${(state.minPrice ?? 0).toLocaleString("en-NG")} – ₦${(state.maxPrice ?? 100_000_000).toLocaleString("en-NG")}`
      : "Price";
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === state.sort)?.label ?? "Newest";

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const placeText = describePlace(state);

  // Pre-filled search display value
  const currentLocation = state.area ?? state.city ?? state.state;
  const initials = (session?.user?.name ?? "U").slice(0, 1).toUpperCase();

  // ── Map placeholder content (Stage 5 will replace with Mapbox) ─
  const mapContent = (
    <>
      <iframe
        title="Map"
        src="https://www.openstreetmap.org/export/embed.html?bbox=7.8%2C4.9%2C8.1%2C5.1&layer=mapnik"
        className="h-full w-full rounded-[10px] border-0"
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

            {/* Pre-filled location chip — click to open autocomplete */}
            <div className="relative">
              {!showSearchInline && currentLocation ? (
                <button
                  type="button"
                  onClick={() => setShowSearchInline(true)}
                  className="flex h-[48px] w-[570px] items-center gap-[10px] rounded-[40px] border border-[rgba(186,186,186,0.65)] bg-white px-[20px] text-left transition-colors hover:bg-[#faf9f9]"
                >
                  <Search size={16} className="text-[#af2525]" />
                  <span className="flex-1 truncate text-[15px] text-[#0a0a0a]">
                    {currentLocation.name}
                    {currentLocation.parent && (
                      <span className="ml-2 text-[13px] text-black/40">
                        {currentLocation.type === "area" ? "(area)" : currentLocation.type === "city" ? "(city)" : ""}
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); clearLocation(); }}
                    className="flex h-7 w-7 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/10 hover:text-black/70"
                    aria-label="Clear location"
                  >
                    <X size={16} />
                  </button>
                </button>
              ) : (
                <div className="w-[570px]">
                  <LocationAutocomplete
                    value={currentLocation}
                    onPick={(node) => {
                      setLocation(node);
                      setShowSearchInline(false);
                    }}
                    placeholder="Search by city, state, or area"
                    autoFocus={showSearchInline}
                  />
                </div>
              )}
            </div>
          </div>

          {isAuthed ? (
            <div className="flex items-center gap-3">
              <Link
                href="/feed"
                className="text-[14px] font-medium text-[#af2525] transition-colors hover:text-[#93191d]"
              >
                Go to Feed
              </Link>
              <button
                onClick={() => signOutAndToast()}
                className="flex h-[36px] items-center gap-2 rounded-full border border-black/10 bg-white px-3 text-[14px] text-black/70 transition-colors hover:bg-[#faf9f9]"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#af2525] text-[12px] font-semibold text-white">
                  {initials}
                </span>
                Sign out
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => openLogin()}
              className="flex h-[41px] items-center justify-center rounded-full bg-[#af2525] px-[30px] text-[15px] font-normal tracking-[-0.3px] text-white transition-opacity hover:opacity-90"
            >
              Join / Sign In
            </button>
          )}
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════
           MOBILE HEADER — same chip-with-X pattern as desktop
         ═══════════════════════════════════════════════════ */}
      <header className="z-50 flex h-[64px] flex-shrink-0 items-center justify-between border-b border-[rgba(0,0,0,0.1)] bg-[#fbfbfb] px-[15px] md:hidden">
        <div className="flex flex-1 items-center gap-[10px]">
          <Link href="/" className="flex items-center gap-1.5">
            <div className="flex h-[29px] w-[29px] items-center justify-center rounded-full bg-[#f5d0d0]">
              <Home className="h-[14px] w-[14px] text-[#af2525]" strokeWidth={2.5} />
            </div>
          </Link>
          <div className="flex-1">
            {!showSearchInline && currentLocation ? (
              <button
                type="button"
                onClick={() => setShowSearchInline(true)}
                className="flex h-[40px] w-full items-center gap-[8px] rounded-[20px] border border-[rgba(186,186,186,0.65)] bg-white px-[12px] text-left transition-colors hover:bg-[#faf9f9]"
              >
                <Search size={14} className="flex-shrink-0 text-[#af2525]" />
                <span className="flex-1 truncate text-[14px] text-[#0a0a0a]">
                  {currentLocation.name}
                </span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearLocation(); }}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-black/40 transition-colors hover:bg-black/10 hover:text-black/70"
                  aria-label="Clear location"
                >
                  <X size={14} />
                </button>
              </button>
            ) : (
              <LocationAutocomplete
                value={currentLocation}
                onPick={(node) => {
                  setLocation(node);
                  setShowSearchInline(false);
                }}
                placeholder="Location"
                autoFocus={showSearchInline}
              />
            )}
          </div>
        </div>
        <button
          aria-label="Menu"
          onClick={() => setMobileMenuOpen(true)}
          className="ml-2 flex-shrink-0"
        >
          <Menu size={22} className="text-[#0a0a0a]" />
        </button>
      </header>

      {/* ═══════════════════════════════════════════════════
           DESKTOP SPLIT PANE
         ═══════════════════════════════════════════════════ */}
      <div className="hidden flex-1 overflow-hidden md:flex">
        {/* ── Left: results ─────────────────────────────── */}
        <div className="flex w-[55%] max-w-[820px] flex-shrink-0 flex-col overflow-hidden border-r border-[rgba(0,0,0,0.06)]">
          {/* Filter bar */}
          <div ref={filterRef} className="relative flex-shrink-0 border-b border-[rgba(0,0,0,0.06)] px-[24px] py-[14px]">
            <div className="flex items-end gap-[20px]">
              <div className="flex flex-1 items-center gap-[6px] overflow-x-auto no-scrollbar">
                {/* For Rent / For Sale / For Lease */}
                <FilterChip
                  label={listingLabel}
                  active={openFilter === "listingType"}
                  onClick={() => setOpenFilter(openFilter === "listingType" ? null : "listingType")}
                  width={129}
                />
                {openFilter === "listingType" && (
                  <div className="absolute left-0 top-[calc(100%+4px)] z-50 w-[280px] rounded-[12px] border border-[#e4e4e7] bg-white py-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                    {/* Listing type — radio group */}
                    {LISTING_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => { setCategory(opt.value); }}
                        className="flex w-full items-center justify-between px-[16px] py-[12px] text-left text-[15px] transition-colors hover:bg-[rgba(0,0,0,0.03)]"
                      >
                        <span className={currentCategory === opt.value ? "font-semibold text-[#161515]" : "text-[#161515]"}>
                          {opt.label}
                        </span>
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full border-2",
                            currentCategory === opt.value
                              ? "border-[#1a4d2e] bg-white"
                              : "border-black/25 bg-white"
                          )}
                        >
                          {currentCategory === opt.value && (
                            <span className="h-2.5 w-2.5 rounded-full bg-[#1a4d2e]" />
                          )}
                        </span>
                      </button>
                    ))}

                    {/* Property-type toggles */}
                    <div className="my-1 h-px bg-black/8" />
                    <PropTypeToggle
                      label="Show commercial properties only"
                      active={state.type.includes("COMMERCIAL")}
                      onToggle={(on) =>
                        navigate({
                          type: on ? ["COMMERCIAL"] : state.type.filter((t) => t !== "COMMERCIAL"),
                        })
                      }
                    />
                    <PropTypeToggle
                      label="Show land only"
                      active={state.type.includes("LAND")}
                      onToggle={(on) =>
                        navigate({
                          type: on ? ["LAND"] : state.type.filter((t) => t !== "LAND"),
                        })
                      }
                    />

                    <div className="flex justify-end px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setOpenFilter(null)}
                        className="rounded-full bg-[#af2525] px-5 py-2 text-[14px] font-medium text-white"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}

                <FilterChip
                  label={bedsLabel}
                  active={openFilter === "beds"}
                  onClick={() => setOpenFilter(openFilter === "beds" ? null : "beds")}
                />

                <FilterChip
                  label={typeLabel}
                  active={openFilter === "type"}
                  onClick={() => setOpenFilter(openFilter === "type" ? null : "type")}
                  width={130}
                />

                <FilterChip
                  label={priceLabel}
                  active={openFilter === "price"}
                  onClick={() => setOpenFilter(openFilter === "price" ? null : "price")}
                  width={140}
                />
              </div>

              <div className="relative flex-shrink-0">
                <button
                  onClick={() => {
                    if (!isAuthed) {
                      const criteria = searchStateToCriteria(state);
                      openLogin({
                        type: "save_search",
                        name: summarizeCriteria(criteria),
                        criteria,
                      });
                      return;
                    }
                    setSaveOpen((o) => !o);
                  }}
                  className="flex h-[41px] items-center justify-center rounded-[50px] bg-[#af2525] px-[24px] text-[15px] font-normal tracking-[-0.3px] text-white transition-opacity hover:opacity-90"
                >
                  Save Search
                </button>
                <SaveSearchPopover
                  open={saveOpen}
                  onClose={() => setSaveOpen(false)}
                  defaultName={summarizeCriteria(searchStateToCriteria(state))}
                  criteria={searchStateToCriteria(state)}
                  className="right-0 top-[calc(100%+8px)]"
                />
              </div>
            </div>

            {openFilter === "beds" && (
              <div className="absolute left-[160px] top-[calc(100%+4px)] z-50">
                <BedsDropDown
                  beds={state.beds[0] ?? 0}
                  baths={state.baths[0] ?? 0}
                  onApply={(b, ba) => {
                    navigate({
                      beds: b > 0 ? [b] : [],
                      baths: ba > 0 ? [ba] : [],
                    });
                    setOpenFilter(null);
                  }}
                />
              </div>
            )}
            {openFilter === "type" && (
              <div className="absolute left-[310px] top-[calc(100%+4px)] z-50">
                <PropertyTypesDropDown
                  selected={state.type}
                  onChange={(types) => navigate({ type: types })}
                />
              </div>
            )}
            {openFilter === "price" && (
              <div className="absolute left-[450px] top-[calc(100%+4px)] z-50">
                <PricingDropDown
                  minPrice={state.minPrice ?? 0}
                  maxPrice={state.maxPrice ?? 100_000_000}
                  onApply={(min, max) => {
                    navigate({
                      minPrice: min > 0 ? min : undefined,
                      maxPrice: max < 100_000_000 ? max : undefined,
                    });
                    setOpenFilter(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Results meta */}
          <div className="flex flex-shrink-0 items-end justify-between border-b border-[rgba(0,0,0,0.06)] px-[24px] py-[12px]">
            <div className="flex flex-col gap-[3px]">
              <p className="text-[15px] font-medium text-[#161515]">
                {loading ? "…" : total} {total === 1 ? "property" : "properties"} listed
                {placeText ? ` ${listingLabel.toLowerCase()} in ${placeText}` : ` ${listingLabel.toLowerCase()}`}
              </p>
              {placeText && (
                <p className="text-[20px] font-semibold text-[#161515]">{placeText}</p>
              )}
            </div>
            <div className="relative flex items-center gap-1">
              <span className="text-[12px] text-black">Sort:</span>
              <button
                onClick={() => setOpenFilter(openFilter === "sort" ? null : "sort")}
                className="flex items-center gap-[2px] text-[12px] font-medium text-[#18181b]"
              >
                {currentSortLabel}
                <ChevronDown size={15} className="text-[#71717a]" />
              </button>
              {openFilter === "sort" && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-[200px] rounded-[10px] border border-[#e4e4e7] bg-white py-[4px] shadow-[0_4px_12px_rgba(0,0,0,0.08)]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSort(opt.value); setOpenFilter(null); }}
                      className={cn(
                        "w-full px-[14px] py-[7px] text-left text-[13px] transition-colors hover:bg-[rgba(0,0,0,0.03)]",
                        state.sort === opt.value ? "font-semibold text-[#af2525]" : "text-[#18181b]"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Scrollable card grid */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-[24px] py-[24px]">
            {loading ? (
              <div className="grid grid-cols-2 gap-[20px]">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PropertyCardSkeleton key={i} className="w-full md:w-full" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <p className="text-[15px] text-black/50">No properties match your filters.</p>
                <button
                  onClick={() => router.push(buildSearchUrl({ category: state.category }))}
                  className="text-[13px] text-[#af2525] underline"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-[20px]">
                {items.map((p) => (
                  <PropertyCard
                    key={p.id}
                    data={p}
                    isFavourited={isFavourited(p.id)}
                    onToggleFavourite={toggleFavourite}
                    className="w-full md:w-full"
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="mt-[40px] flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(Math.max(1, state.page - 1))}
                  disabled={state.page === 1}
                  className="rounded border border-black/10 px-3 py-1 text-[13px] disabled:opacity-40"
                >
                  Prev
                </button>
                <span className="text-[13px] text-black/60">
                  Page {state.page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(Math.min(totalPages, state.page + 1))}
                  disabled={state.page >= totalPages}
                  className="rounded border border-black/10 px-3 py-1 text-[13px] disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}

            {/* Compact footer at bottom of scrollable column */}
            <div className="mt-[40px] -mx-[24px] -mb-[24px]">
              <SearchPageFooter />
            </div>
          </div>
        </div>

        {/* ── Right: map ─────────────────────────────────── */}
        <div className="relative flex-1 overflow-hidden bg-white p-[5px]">
          {mapContent}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════
           MOBILE: list OR map (toggle)
         ═══════════════════════════════════════════════════ */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        {mobileView === "list" ? (
          <>
            {/* Mobile filter row — always visible */}
            <div className="relative flex flex-shrink-0 gap-2 overflow-x-auto border-b border-black/5 bg-white px-3 py-2 no-scrollbar">
              <MobileFilterPill
                label={listingLabel}
                active
                onClick={() => setOpenFilter(openFilter === "listingType" ? null : "listingType")}
              />
              <MobileFilterPill
                label={state.beds.length ? `${state.beds.join(",")}+ beds` : "Beds"}
                active={state.beds.length > 0}
                onClick={() => setOpenFilter(openFilter === "beds" ? null : "beds")}
              />
              <MobileFilterPill
                label={state.type.length ? `${state.type.length} type${state.type.length > 1 ? "s" : ""}` : "Type"}
                active={state.type.length > 0}
                onClick={() => setOpenFilter(openFilter === "type" ? null : "type")}
              />
              <MobileFilterPill
                label={state.minPrice || state.maxPrice ? "Price ●" : "Price"}
                active={!!(state.minPrice || state.maxPrice)}
                onClick={() => setOpenFilter(openFilter === "price" ? null : "price")}
              />
              <MobileFilterPill
                label={`Sort: ${currentSortLabel}`}
                onClick={() => setOpenFilter(openFilter === "sort" ? null : "sort")}
              />
            </div>

            {/* Mobile filter sheets — render below the row */}
            {openFilter === "listingType" && (
              <div className="border-b border-black/5 bg-white p-3">
                {LISTING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setCategory(opt.value); setOpenFilter(null); }}
                    className="flex w-full items-center justify-between px-2 py-3 text-left text-[15px] text-[#161515]"
                  >
                    {opt.label}
                    <span className={cn(
                      "flex h-5 w-5 items-center justify-center rounded-full border-2",
                      currentCategory === opt.value ? "border-[#1a4d2e]" : "border-black/25"
                    )}>
                      {currentCategory === opt.value && <span className="h-2.5 w-2.5 rounded-full bg-[#1a4d2e]" />}
                    </span>
                  </button>
                ))}
                <div className="my-2 h-px bg-black/8" />
                <PropTypeToggle
                  label="Show commercial properties only"
                  active={state.type.includes("COMMERCIAL")}
                  onToggle={(on) =>
                    navigate({ type: on ? ["COMMERCIAL"] : state.type.filter((t) => t !== "COMMERCIAL") })
                  }
                />
                <PropTypeToggle
                  label="Show land only"
                  active={state.type.includes("LAND")}
                  onToggle={(on) =>
                    navigate({ type: on ? ["LAND"] : state.type.filter((t) => t !== "LAND") })
                  }
                />
              </div>
            )}
            {openFilter === "beds" && (
              <div className="border-b border-black/5 bg-white p-3">
                <BedsDropDown
                  beds={state.beds[0] ?? 0}
                  baths={state.baths[0] ?? 0}
                  onApply={(b, ba) => {
                    navigate({ beds: b > 0 ? [b] : [], baths: ba > 0 ? [ba] : [] });
                    setOpenFilter(null);
                  }}
                />
              </div>
            )}
            {openFilter === "type" && (
              <div className="border-b border-black/5 bg-white p-3">
                <PropertyTypesDropDown
                  selected={state.type}
                  onChange={(types) => navigate({ type: types })}
                />
              </div>
            )}
            {openFilter === "price" && (
              <div className="border-b border-black/5 bg-white p-3">
                <PricingDropDown
                  minPrice={state.minPrice ?? 0}
                  maxPrice={state.maxPrice ?? 100_000_000}
                  onApply={(min, max) => {
                    navigate({
                      minPrice: min > 0 ? min : undefined,
                      maxPrice: max < 100_000_000 ? max : undefined,
                    });
                    setOpenFilter(null);
                  }}
                />
              </div>
            )}
            {openFilter === "sort" && (
              <div className="border-b border-black/5 bg-white p-2">
                {SORT_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => { setSort(o.value); setOpenFilter(null); }}
                    className={cn(
                      "flex w-full items-center px-3 py-2.5 text-left text-[14px]",
                      state.sort === o.value ? "text-[#af2525] font-semibold" : "text-black/80"
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            )}
            <div className="relative flex-shrink-0 border-b border-black/5 bg-white px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-black/60">
                    {loading ? "Loading…" : `${total} ${total === 1 ? "property" : "properties"} listed`}
                    {placeText ? ` ${listingLabel.toLowerCase()} in ${placeText}` : ` ${listingLabel.toLowerCase()}`}
                  </p>
                  {placeText && (
                    <p className="mt-0.5 truncate text-[16px] font-semibold text-[#161515]">{placeText}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!isAuthed) {
                      const criteria = searchStateToCriteria(state);
                      openLogin({
                        type: "save_search",
                        name: summarizeCriteria(criteria),
                        criteria,
                      });
                      return;
                    }
                    setSaveOpen((o) => !o);
                  }}
                  className="flex-shrink-0 rounded-full bg-[#af2525] px-3 py-1.5 text-[12px] font-medium text-white"
                >
                  Save Search
                </button>
              </div>
              <SaveSearchPopover
                open={saveOpen}
                onClose={() => setSaveOpen(false)}
                defaultName={summarizeCriteria(searchStateToCriteria(state))}
                criteria={searchStateToCriteria(state)}
                className="right-3 top-[calc(100%+4px)]"
              />
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-3">
              {loading ? (
                <div className="grid grid-cols-2 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <PropertyCardSkeleton key={i} className="w-full md:w-full" />
                  ))}
                </div>
              ) : items.length === 0 ? (
                <div className="py-12 text-center text-[14px] text-black/50">No properties match.</div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {items.map((p) => (
                    <PropertyCard
                      key={p.id}
                      data={p}
                      isFavourited={isFavourited(p.id)}
                      onToggleFavourite={toggleFavourite}
                      className="w-full md:w-full"
                    />
                  ))}
                </div>
              )}
              <div className="mt-8 -mx-3">
                <SearchPageFooter />
              </div>
            </div>
          </>
        ) : (
          <div className="relative flex-1 overflow-hidden bg-white p-[5px]">
            {mapContent}
            {/* Click-shield wrapping the iframe so the floating toggle stays clickable.
                The iframe captures pointer events; this overlay sits above only at the
                bottom edge where our toggle lives, leaving the rest of the map interactive. */}
          </div>
        )}
      </div>

      {/* Mobile floating map/list toggle — at page root, above iframe stacking context */}
      <button
        type="button"
        onClick={() => setMobileView((v) => (v === "list" ? "map" : "list"))}
        className="md:hidden fixed bottom-5 left-1/2 z-[100] flex h-12 -translate-x-1/2 items-center gap-2 rounded-full bg-black px-5 text-[14px] font-medium text-white shadow-lg"
      >
        {mobileView === "list" ? <><Map size={16} /> Map</> : <><List size={16} /> List</>}
      </button>

      {/* Authed users get the renter drawer (Find/Feed/Favourites/...);
          guests get the guest drawer (browse + sign in). Same trigger. */}
      {isAuthed ? (
        <MobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      ) : (
        <GuestMobileDrawer open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      )}
    </div>
  );
}

// ─── Tiny presentational helpers ───────────────────────────────────

function MobileFilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-shrink-0 rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
        active
          ? "border border-[#af2525] bg-[#fff5f5] text-[#af2525]"
          : "border border-black/10 bg-white text-black/70"
      )}
    >
      {label}
    </button>
  );
}

function PropTypeToggle({
  label,
  active,
  onToggle,
}: {
  label: string;
  active: boolean;
  onToggle: (on: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!active)}
      className="flex w-full items-center justify-between px-[16px] py-[12px] text-left text-[15px] text-[#161515] transition-colors hover:bg-[rgba(0,0,0,0.03)]"
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative inline-flex h-[24px] w-[40px] items-center rounded-full transition-colors",
          active ? "bg-[#1a4d2e]" : "bg-black/15"
        )}
      >
        <span
          className={cn(
            "absolute h-[18px] w-[18px] rounded-full bg-white shadow transition-transform",
            active ? "translate-x-[19px]" : "translate-x-[3px]"
          )}
        />
      </span>
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  width,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  width?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={width ? { width } : undefined}
      className={cn(
        "flex h-[40px] flex-shrink-0 items-center justify-between gap-[8px] rounded-[33px] border px-[12px] transition-colors",
        active ? "border-[#af2525]" : "border-[#e4e4e7] hover:border-black/30",
        !width && "px-[14px]"
      )}
    >
      <span className="truncate whitespace-nowrap text-[14px] font-medium text-[#18181b]">{label}</span>
      <ChevronsUpDown size={15} className="flex-shrink-0 text-[#71717a]" />
    </button>
  );
}
