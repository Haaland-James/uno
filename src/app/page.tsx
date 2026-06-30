"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Home,
} from "lucide-react";
import { GuestHeader } from "@/components/layout/GuestHeader";
import { Footer } from "@/components/layout/Footer";
import { MobileNav } from "@/components/layout/MobileNav";
import { PropertyCard } from "@/components/property/PropertyCard";
import { HeroSearch } from "@/components/search/HeroSearch";
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

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("Ewet Housing");
  const { isFavourited, toggleFavourite } = useFavourites();

  const { items: latest, isLoading: latestLoading } = useFeaturedProperties("latest", 7, { listingType: "RENT" });
  const { items: topListings, isLoading: topLoading } = useFeaturedProperties("top", 7, { area: activeTab, listingType: "RENT" });
  const { items: hot, isLoading: hotLoading } = useFeaturedProperties("hot", 7, { listingType: "SALE" });

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

          {/* HeroSearch — unified for desktop and mobile */}
          <div className="relative z-10 mx-auto mt-[-56px] md:mt-[-76px] max-w-[560px] px-[16px] md:px-0">
            <HeroSearch />
          </div>
        </section>

        {/* ── Latest Market Listings ─────────────────────────── */}
        <section className="mt-[32px] md:mt-[32px]">
          <div className="mx-auto max-w-[1440px] px-[16px] md:px-[40px]">
            <div className="mb-[16px] flex items-center justify-between md:mb-[21px]">
              <h2 className="text-[20px] font-semibold text-[#161515] md:text-[30px] md:font-medium">
                Latest Market Listings <span className="text-[#af2525]">for Rent</span>
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
                  Top Listings <span className="text-[#af2525]">for Rent</span>{" "}
                  <span className="text-[#161515]/50">({activeTab})</span>
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
                Hot Properties <span className="text-[#af2525]">for Sale</span>
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
      <MobileNav />
    </>
  );
}
