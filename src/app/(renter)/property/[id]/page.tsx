"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Heart,
  Share2,
  Bath,
  BedDouble,
  MapPin,
  Phone,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  ChevronRight as PlayIcon,
  Camera,
  User,
  X,
} from "lucide-react";
import { cn, formatNaira } from "@/lib/utils";
import { propertiesClient } from "@/lib/clients/properties";
import { trackPropertyView } from "@/hooks/useRecentlyViewed";
import { shareOrCopy } from "@/lib/share";
import { Footer } from "@/components/layout/Footer";
import { toast } from "@/stores/toastStore";
import type { PropertyDetailData, PropertyCardData } from "@/types/property";
import { PropertyCard } from "@/components/property/PropertyCard";
import { ReportListingButton } from "@/components/property/ReportListingButton";
import { useSession } from "next-auth/react";
import { useFavourites } from "@/hooks/useFavourites";
import { useContact } from "@/hooks/useContact";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

// ─── Photo Gallery (Desktop) ───────────────────────────────────────

function DesktopGallery({
  photos,
  onSeeMore,
  onPhotoClick,
}: {
  photos: { url: string; isMain: boolean }[];
  onSeeMore: () => void;
  onPhotoClick: (index: number) => void;
}) {
  const main = photos[0];
  const thumbs = photos.slice(1, 5);

  return (
    <div className="hidden md:flex gap-[10px]">
      {/* Main large image */}
      <button
        onClick={() => onPhotoClick(0)}
        className="relative flex-1 min-h-[340px] rounded-[15px] overflow-hidden cursor-pointer"
      >
        {main && (
          <Image
            src={main.url}
            alt="Property main"
            fill
            className="object-cover"
            sizes="60vw"
            priority
          />
        )}
      </button>

      {/* Thumbnail 2x2 grid */}
      <div className="grid grid-cols-2 gap-[10px] w-[40%] shrink-0">
        {thumbs.map((photo, i) => (
          <div
            key={i}
            className="relative rounded-[15px] overflow-hidden cursor-pointer"
            onClick={() => {
              if (i === thumbs.length - 1 && photos.length > 5) {
                onSeeMore();
              } else {
                onPhotoClick(i + 1);
              }
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === "Enter") onPhotoClick(i + 1); }}
          >
            <Image
              src={photo.url}
              alt={`Property photo ${i + 2}`}
              fill
              className="object-cover"
              sizes="20vw"
            />
            {i === thumbs.length - 1 && photos.length > 5 && (
              <>
                <div className="absolute inset-0 bg-black/50 rounded-[15px]" />
                <span className="absolute bottom-[15px] right-[10px] bg-white border border-black/28 rounded-[50px] px-[20px] h-[36px] flex items-center justify-center text-[13px] text-black tracking-[-0.3px]">
                  +{photos.length - 5} more
                </span>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Photo Gallery (Mobile) ────────────────────────────────────────

function MobileGallery({
  photos,
  onPhotoClick,
}: {
  photos: { url: string; isMain: boolean }[];
  onPhotoClick: (index: number) => void;
}) {
  const [imgIndex, setImgIndex] = useState(0);
  const current = photos[imgIndex];
  const hasMultiple = photos.length > 1;

  return (
    <div className="md:hidden relative w-full h-[431px]" onClick={() => onPhotoClick(imgIndex)} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter") onPhotoClick(imgIndex); }}>
      {current && (
        <Image
          src={current.url}
          alt="Property"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      )}
      <div className="absolute inset-0 bg-black/30" />

      {/* Photo counter */}
      <div className="absolute bottom-[30px] right-[20px] bg-black/45 rounded-[50px] px-[8px] py-[2px] flex items-center gap-[5px]">
        <Camera size={16} className="text-[#fbfbfb]" />
        <span className="text-[12px] font-semibold text-[#fbfbfb]">
          {imgIndex + 1}/{photos.length}
        </span>
      </div>

      {/* Carousel arrows */}
      {hasMultiple && (
        <>
          {imgIndex > 0 && (
            <button
              onClick={() => setImgIndex((i) => i - 1)}
              className="absolute left-[10px] top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-white/80"
              aria-label="Previous"
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {imgIndex < photos.length - 1 && (
            <button
              onClick={() => setImgIndex((i) => i + 1)}
              className="absolute right-[10px] top-1/2 -translate-y-1/2 z-10 flex items-center justify-center h-8 w-8 rounded-full bg-white/80"
              aria-label="Next"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─── Photo Grid Modal (all photos) ────────────────────────────────

function PhotoGridModal({
  photos,
  onClose,
  onPhotoClick,
}: {
  photos: { url: string; isMain: boolean }[];
  onClose: () => void;
  onPhotoClick: (index: number) => void;
}) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/10 px-[20px] py-[14px] shrink-0">
        <span className="text-[18px] font-semibold text-[#161515]">
          Photos ({photos.length})
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-[36px] h-[36px] rounded-full hover:bg-black/5 transition-colors"
          aria-label="Close"
        >
          <X size={22} className="text-[#161515]" />
        </button>
      </div>

      {/* Photo grid */}
      <div className="flex-1 overflow-y-auto px-[20px] md:px-[60px] py-[20px]">
        <div className="mx-auto max-w-[1200px] columns-1 md:columns-2 lg:columns-3 gap-[12px]">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => onPhotoClick(i)}
              className="mb-[12px] block w-full overflow-hidden rounded-[10px] break-inside-avoid cursor-pointer group"
            >
              <div className="relative w-full aspect-[4/3]">
                <Image
                  src={photo.url}
                  alt={`Property photo ${i + 1}`}
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Lightbox Slideshow ───────────────────────────────────────────

function Lightbox({
  photos,
  startIndex,
  onClose,
}: {
  photos: { url: string; isMain: boolean }[];
  startIndex: number;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(startIndex);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const goPrev = useCallback(() => {
    setCurrent((i) => (i > 0 ? i - 1 : photos.length - 1));
  }, [photos.length]);

  const goNext = useCallback(() => {
    setCurrent((i) => (i < photos.length - 1 ? i + 1 : 0));
  }, [photos.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose, goPrev, goNext]);

  return (
    <div className="fixed inset-0 z-[110] flex flex-col bg-black/80 backdrop-blur-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-[20px] py-[14px] shrink-0">
        <span className="text-[15px] text-white/80">
          {current + 1} / {photos.length}
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-[36px] h-[36px] rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X size={22} className="text-white" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 relative flex items-center justify-center px-[60px]">
        <div className="relative w-full h-full max-w-[1200px]">
          <Image
            src={photos[current].url}
            alt={`Photo ${current + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>

        {/* Navigation arrows */}
        <button
          onClick={goPrev}
          className="absolute left-[12px] top-1/2 -translate-y-1/2 flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Previous"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
        <button
          onClick={goNext}
          className="absolute right-[12px] top-1/2 -translate-y-1/2 flex items-center justify-center w-[44px] h-[44px] rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Next"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// ─── Static Map Thumbnail ─────────────────────────────────────────

function StaticMapThumbnail({
  lat,
  lng,
  address,
  title,
  className,
  pinSize = 24,
}: {
  lat?: number | null;
  lng?: number | null;
  address?: string | null;
  title: string;
  className?: string;
  pinSize?: number;
}) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const mapsHref =
    lat && lng
      ? `https://www.google.com/maps?q=${lat},${lng}`
      : `https://www.google.com/maps/search/${encodeURIComponent(address ?? title)}`;

  if (token && lat && lng) {
    const src = `https://api.mapbox.com/styles/v1/mapbox/streets-v11/static/pin-s+af2525(${lng},${lat})/${lng},${lat},13,0/300x300@2x?access_token=${token}`;
    return (
      <a href={mapsHref} target="_blank" rel="noopener noreferrer" className={cn("block overflow-hidden rounded-[20px] relative group", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="Map location" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200" />
      </a>
    );
  }

  // Fallback: OpenStreetMap tile (no key needed). We show a 2×2 tile grid
  // centred on the property, or a styled placeholder when no coords.
  if (lat && lng) {
    const zoom = 14;
    const latRad = (lat * Math.PI) / 180;
    const tanVal = Math.tan(latRad) + 1 / Math.cos(latRad);
    const x = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
    const y = !isFinite(tanVal) || tanVal <= 0
      ? 0
      : Math.floor(((1 - Math.log(tanVal) / Math.PI) / 2) * Math.pow(2, zoom));
    const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
    return (
      <a href={mapsHref} target="_blank" rel="noopener noreferrer" className={cn("block overflow-hidden rounded-[20px] relative group bg-[#e8e0d0]", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={tileUrl} alt="Map location" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <MapPin size={pinSize} className="text-[#af2525] drop-shadow-md" />
        </div>
      </a>
    );
  }

  // No coords at all — static placeholder
  return (
    <a href={mapsHref} target="_blank" rel="noopener noreferrer" className={cn("block overflow-hidden rounded-[20px] relative bg-[#f0e8d8] group", className)}>
      <div className="absolute inset-0 flex items-center justify-center">
        <MapPin size={pinSize} className="text-[#af2525]" />
      </div>
    </a>
  );
}

// ─── Info Card ─────────────────────────────────────────────────────

function InfoCard({
  children,
  className,
  id,
  sectionRef,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  sectionRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <div
      id={id}
      ref={sectionRef}
      className={cn(
        "bg-[#fdfdfd] border border-black/11 rounded-[20px] px-[16px] md:px-[18px] py-[17px] md:py-[21px] scroll-mt-[120px]",
        className
      )}
    >
      {children}
    </div>
  );
}

// ─── Bullet Item ───────────────────────────────────────────────────

function BulletItem({
  children,
  bold,
}: {
  children: React.ReactNode;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center gap-[6px]">
      <PlayIcon
        size={10}
        className={cn(
          "flex-shrink-0",
          bold ? "text-black fill-black" : "text-black/60"
        )}
      />
      <span
        className={cn(
          "text-[15px] md:text-[16px] tracking-[-0.3px] leading-[22px] md:leading-[26px]",
          bold ? "font-bold text-black" : "font-light text-black"
        )}
      >
        {children}
      </span>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────

export default function PropertyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const propertyId = params.id as string;
  const { toggleFavourite, isFavourited } = useFavourites();
  const { status } = useSession();
  const { contact: sendContact, pending: contactPending } = useContact();
  const saved = isFavourited(propertyId);
  const [showPhotoGrid, setShowPhotoGrid] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState("about");
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [property, setProperty] = useState<PropertyDetailData | null>(null);
  const [similar, setSimilar] = useState<PropertyCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  async function handleShare() {
    if (!property) return;
    const url = typeof window !== "undefined" ? window.location.href : `https://uno.ng/property/${propertyId}`;
    const result = await shareOrCopy({
      title: property.title,
      text: `Check out ${property.title} on UNO`,
      url,
    });
    if (result.kind === "copied") toast.success("Link copied to clipboard");
    else if (result.kind === "shared") toast.success("Shared");
    else if (result.kind === "error") toast.error(result.message);
  }

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    trackPropertyView(propertyId);
    propertiesClient
      .detail(propertyId)
      .then((d) => {
        if (cancelled) return;
        setProperty(d);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setNotFound(true);
        setLoading(false);
      });
    propertiesClient
      .similar(propertyId, 6)
      .then((items) => {
        if (cancelled) return;
        setSimilar(items);
      })
      .catch(() => {
        // similar is best-effort — keep empty array on failure
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const handleBack = () => {
    // When the user opened this in a new tab (no history), router.back() is a no-op,
    // so route to a sensible hub instead. Guests must NOT land on /find — it's
    // auth-protected and would bounce them to /login. /properties is public.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(status === "authenticated" ? "/find" : "/properties");
  };

  useEffect(() => {
    const ids = ["about", "fees", "things-to-know"];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-140px 0px -60% 0px", threshold: 0 }
    );
    ids.forEach((id) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white animate-pulse">
        {/* Gallery skeleton */}
        <div className="hidden md:flex gap-[10px] px-[42px] max-w-[1440px] mx-auto w-full mt-[20px]">
          <div className="flex-1 min-h-[340px] rounded-[15px] bg-neutral-200" />
          <div className="grid grid-cols-2 gap-[10px] w-[40%]">
            {[0,1,2,3].map(i => <div key={i} className="rounded-[15px] bg-neutral-200 min-h-[162px]" />)}
          </div>
        </div>
        <div className="md:hidden w-full h-[431px] bg-neutral-200" />

        {/* Content skeleton */}
        <div className="flex-1 md:px-[42px] md:max-w-[1440px] md:mx-auto md:w-full md:pb-[60px]">
          <div className="flex gap-[42px] md:mt-[30px]">
            <div className="flex flex-col gap-[15px] w-full flex-1 px-[16px] md:px-0 pt-[20px] md:pt-0">
              {/* Price line */}
              <div className="flex gap-[12px] items-end">
                <div className="h-[44px] w-[52%] rounded-[8px] bg-neutral-200" />
                <div className="h-[20px] w-[80px] rounded-[8px] bg-neutral-200 mb-[4px]" />
              </div>
              {/* Address */}
              <div className="h-[18px] w-[38%] rounded-[6px] bg-neutral-200" />
              {/* Badges */}
              <div className="flex gap-[8px]">
                <div className="h-[34px] w-[90px] rounded-[14px] bg-neutral-200" />
                <div className="h-[34px] w-[90px] rounded-[14px] bg-neutral-200" />
              </div>
              {/* Info cards */}
              <div className="h-[160px] rounded-[20px] bg-neutral-200 mt-[4px]" />
              <div className="h-[180px] rounded-[20px] bg-neutral-200" />
              <div className="h-[140px] rounded-[20px] bg-neutral-200" />
            </div>
            <div className="hidden md:block w-[327px] flex-shrink-0">
              <div className="h-[260px] rounded-[20px] bg-neutral-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || !property) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-[24px] font-bold text-[#161515] mb-2">
            Property not found
          </h1>
          <Link href="/" className="text-[#af2525] underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const photos = property.photos.filter((p) => p.url);

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* ── PHOTO MODALS ── */}
      {showPhotoGrid && (
        <PhotoGridModal
          photos={photos}
          onClose={() => setShowPhotoGrid(false)}
          onPhotoClick={(i) => {
            setShowPhotoGrid(false);
            setLightboxIndex(i);
          }}
        />
      )}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* ── MOBILE BACK BUTTON (floating, over the gallery) ── */}
      <button
        onClick={handleBack}
        aria-label="Go back"
        className="md:hidden fixed top-3 left-3 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-md backdrop-blur-sm hover:bg-white"
      >
        <ChevronLeft size={20} className="text-[#161515]" />
      </button>

      {/* ── DESKTOP SUB-NAV BAR (sticky below header) ── */}
      <div className="hidden md:block sticky top-16 z-40 bg-white border-b border-black/10">
        <div className="flex items-center justify-between px-[42px] max-w-[1440px] mx-auto w-full">
          <nav className="flex items-center gap-[20px]">
            <button
              onClick={handleBack}
              aria-label="Go back"
              className="flex items-center justify-center h-[36px] w-[36px] rounded-full bg-[#af2525] hover:bg-[#93191d] transition-colors"
            >
              <ChevronLeft size={20} className="text-white" />
            </button>
            {([["About", "about"], ["Fees", "fees"], ["Things to Know", "things-to-know"]] as const).map(([label, id]) => (
              <button
                key={id}
                onClick={() => {
                  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
                className={cn(
                  "py-[14px] text-[15px] font-medium transition-colors border-b-2",
                  activeSection === id
                    ? "text-[#161515] border-[#161515]"
                    : "text-[#161515]/60 border-transparent hover:text-[#161515]"
                )}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-[20px]">
            <button
              onClick={() => toggleFavourite(propertyId)}
              className={cn(
                "flex items-center gap-[6px] text-[14px] transition-colors",
                saved ? "text-[#af2525]" : "text-[#161515] hover:text-[#af2525]"
              )}
              aria-pressed={saved}
            >
              <Heart
                size={18}
                className={saved ? "fill-[#af2525] text-[#af2525]" : ""}
              />
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="flex items-center gap-[6px] text-[14px] text-[#161515] hover:text-[#af2525] transition-colors"
            >
              <Share2 size={18} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── PHOTO GALLERY ── */}
      <section className="md:px-[42px] md:max-w-[1440px] md:mx-auto md:w-full md:mt-[20px]">
        <DesktopGallery
          photos={photos}
          onSeeMore={() => setShowPhotoGrid(true)}
          onPhotoClick={(i) => setLightboxIndex(i)}
        />
        <MobileGallery photos={photos} onPhotoClick={(i) => setLightboxIndex(i)} />
      </section>

      {/* Mobile action buttons (heart + share) overlaying the photo */}
      <div className="md:hidden absolute right-[15px] top-[80px] z-30 flex flex-col gap-[15px]">
        <button
          onClick={() => toggleFavourite(propertyId)}
          aria-label={saved ? "Remove from favourites" : "Save to favourites"}
          className={cn(
            "flex items-center justify-center w-[32px] h-[32px] rounded-full",
            saved ? "bg-[#af2525]" : "bg-black"
          )}
        >
          <Heart
            size={16}
            className={cn("text-white", saved && "fill-white")}
          />
        </button>
        <button onClick={handleShare} className="flex items-center justify-center w-[32px] h-[32px] rounded-full bg-[#ffcfcf]" aria-label="Share">
          <Share2 size={15} className="text-[#af2525]" />
        </button>
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 md:px-[42px] md:max-w-[1440px] md:mx-auto md:w-full md:pb-[60px]">
        <div className="flex gap-[42px] justify-center md:mt-[30px]">
          {/* ─── LEFT COLUMN ─── */}
          <div className="flex flex-col gap-[15px] w-full md:max-w-[680px] px-[16px] md:px-0 pt-[20px] md:pt-0">
            {/* Property header */}
            <div className="flex items-end justify-between">
              <div className="flex flex-col gap-[8px] p-0 md:p-[10px]">
                {/* Status badge */}
                <div className="flex items-center gap-[6px]">
                  <span className="w-[8px] h-[8px] rounded-full bg-green-500 flex-shrink-0" />
                  <span className="text-[14px] md:text-[15px] font-medium text-[#0a0a0a]/78">
                    {property.listingStatus}
                  </span>
                </div>

                {/* Stats line */}
                <p className="text-[12px] md:text-[13px] font-semibold text-[#93191d] leading-[16px]">
                  {property.daysOnUno} days on UNO &bull;{" "}
                  {property.views.toLocaleString()} views &bull;{" "}
                  {property.favourites} favorites
                </p>

                {/* Price */}
                <div className="flex flex-col gap-[4px]">
                  <div className="flex items-center gap-[7px]">
                    <span className="text-[35px] md:text-[44px] font-extrabold text-[#161515] leading-tight">
                      {formatNaira(property.rent)}
                    </span>
                    {property.listingType !== "SALE" && (
                      <span className="text-[12px] md:text-[16px] font-medium text-black/71 self-end mb-[4px]">
                        {property.rentPeriod === "MONTH" ? "/ month" : "/ year"}
                      </span>
                    )}
                  </div>
                  <span className="text-[13px] md:text-[16px] text-black/66">
                    {property.streetAddress}
                  </span>
                </div>

                {/* Bed / Bath badges — only for residential types with non-zero values */}
                {["FLAT","HOUSE","DUPLEX","SELF_CONTAIN","BUNGALOW","PENTHOUSE","MINI_FLAT","STUDIO","TERRACE","DETACHED","SEMI_DETACHED","SHARED_ROOM"].includes(property.propertyType) && (
                  <div className="flex items-center gap-[7px] mt-[4px]">
                    {(property.bathrooms ?? 0) > 0 && (
                      <span className="flex items-center gap-[6px] border border-black/60 rounded-[14px] h-[30px] md:h-[34px] px-[14px] text-[11px] md:text-[14px] text-black/60">
                        <Bath size={16} className="flex-shrink-0" />
                        {property.bathrooms} bath
                      </span>
                    )}
                    {(property.bedrooms ?? 0) > 0 && (
                      <span className="flex items-center gap-[6px] border border-black/60 rounded-[14px] h-[30px] md:h-[34px] px-[14px] text-[11px] md:text-[14px] text-black/60">
                        <BedDouble size={15} className="flex-shrink-0" />
                        {property.bedrooms} bed
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Map thumbnail (desktop) */}
              <div className="hidden md:flex flex-col items-center gap-[7px] w-[110px]">
                <StaticMapThumbnail
                  lat={property.latitude}
                  lng={property.longitude}
                  address={property.streetAddress}
                  title={property.title}
                  className="w-[110px] h-[110px]"
                  pinSize={24}
                />
                <span className="text-[10px] font-bold text-[#93191d] text-center">
                  View in Map
                </span>
              </div>
            </div>

            {/* Map (mobile only — before info cards) */}
            <StaticMapThumbnail
              lat={property.latitude}
              lng={property.longitude}
              address={property.streetAddress}
              title={property.title}
              className="md:hidden w-full h-[373px]"
              pinSize={40}
            />

            {/* ─── INFO CARDS ─── */}
            <div className="flex flex-col gap-[13px]">
              {/* About — hidden when no description */}
              {property.description && (
                <InfoCard id="about" sectionRef={(el) => { sectionRefs.current["about"] = el; }}>
                  <h2 className="text-[22px] md:text-[24px] font-medium text-[#161515] mb-[13px]">
                    About
                  </h2>
                  <p className="text-[15px] md:text-[16px] text-black/80 leading-[22px] md:leading-[26px] tracking-[-0.3px]">
                    {property.description}
                  </p>
                </InfoCard>
              )}

              {/* Fees */}
              <InfoCard id="fees" sectionRef={(el) => { sectionRefs.current["fees"] = el; }}>
                <h2 className="text-[22px] md:text-[24px] font-medium text-[#161515] mb-[21px]">
                  Fees
                </h2>
                <div className="flex flex-col md:flex-row gap-[24px]">
                  {/* Standard Pricing */}
                  <div className="flex flex-col gap-[12px] md:w-[280px]">
                    <span className="text-[12px] font-semibold uppercase tracking-wide text-black/50">
                      Standard Pricing
                    </span>
                    <div className="flex flex-col gap-[12px]">
                      <div className="flex flex-col gap-[5px]">
                        <BulletItem>
                          {property.fees.priceLabel}: {formatNaira(property.fees.annualRent)}
                        </BulletItem>
                        {property.listingType !== "SALE" && (
                          <>
                            <BulletItem>
                              Legal Fee: {property.fees.legalFeePercent}%
                            </BulletItem>
                            <BulletItem>
                              Agent Fee: {property.fees.agentFeePercent}%
                            </BulletItem>
                          </>
                        )}
                      </div>
                      {/* Total package — prominent row */}
                      <div className="flex items-center gap-[8px] bg-black/[0.04] rounded-[10px] px-[12px] py-[10px] mt-[4px]">
                        <span className="text-[15px] md:text-[16px] font-bold text-[#161515]">
                          Total package:
                        </span>
                        <span className="text-[15px] md:text-[16px] font-extrabold text-[#af2525]">
                          {property.fees.totalPackage}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Additional Fees — hidden when empty */}
                  {property.fees.additional.length > 0 && (
                    <div className="flex flex-col gap-[18px] md:w-[217px]">
                      <div className="flex flex-col gap-[9px]">
                        <span className="text-[12px] font-semibold uppercase tracking-wide text-black/50">
                          Additional Fees
                        </span>
                        <div className="flex flex-col gap-[5px]">
                          {property.fees.additional.map((fee) => (
                            <BulletItem key={fee.label}>
                              {fee.label}: {formatNaira(fee.amount)}{" "}
                              <span className="text-[11px]">{fee.period}</span>
                            </BulletItem>
                          ))}
                        </div>
                      </div>
                      {property.fees.additionalNote && (
                        <p className="text-[12px] font-light text-[#161515] leading-[16px]">
                          Note: {property.fees.additionalNote}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </InfoCard>

              {/* Things to Know */}
              <InfoCard id="things-to-know" sectionRef={(el) => { sectionRefs.current["things-to-know"] = el; }}>
                <h2 className="text-[22px] md:text-[24px] font-medium text-[#161515] mb-[21px]">
                  Things to Know
                </h2>
                <div className="flex flex-col md:flex-row gap-[24px]">
                  {property.additionalInfo.length > 0 && (
                    <div className="flex flex-col gap-[12px] md:w-[280px]">
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-black/50">
                        Additional Information
                      </span>
                      <div className="flex flex-col gap-[5px]">
                        {property.additionalInfo.map((info) => (
                          <BulletItem key={info.label}>
                            {info.label}: {info.value}
                          </BulletItem>
                        ))}
                      </div>
                    </div>
                  )}
                  {property.features.length > 0 && (
                    <div className="flex flex-col gap-[12px] md:w-[219px]">
                      <span className="text-[12px] font-semibold uppercase tracking-wide text-black/50">
                        Features
                      </span>
                      <div className="flex flex-col gap-[5px]">
                        {property.features.map((feature) => (
                          <BulletItem key={feature}>{feature}</BulletItem>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </InfoCard>
            </div>

            {/* Listing metadata */}
            <div className="flex flex-col text-[15px] font-light text-black leading-[25px] mt-[6px]">
              <p>
                Listed by {property.listedBy.name} &bull;{" "}
                {property.listedBy.company}
              </p>
              <p>Listing updated: {property.listingUpdated}</p>
              <p>Uno checked: {property.unoChecked}</p>
            </div>

            {/* Agent reveal — when a UNO agent listed this property on
                behalf of an off-platform owner. The card and "Listed by"
                line stay UNO-first (institutional trust); this block
                reveals the agent as a friendly human face below. */}
            {property.agent && (
              <div className="mt-6 rounded-[15px] border border-black/10 bg-white p-4">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-black/[0.05]">
                    {property.agent.photo ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={property.agent.photo}
                        alt={property.agent.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-black/60">
                        {property.agent.name?.[0]?.toUpperCase() ?? "?"}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] text-black/60">Your UNO agent</div>
                    <div className="truncate text-[15px] font-semibold text-[#161515]">
                      {property.agent.name}
                    </div>
                    {property.agent.bio && (
                      <p className="mt-1 line-clamp-2 text-[13px] text-black/60">
                        {property.agent.bio}
                      </p>
                    )}
                  </div>
                  {property.agent.slug && (
                    <Link
                      href={`/agents/${property.agent.slug}`}
                      className="shrink-0 rounded-full border border-black/15 px-3 py-1.5 text-[13px] font-medium text-[#161515] hover:bg-black/5"
                    >
                      View profile
                    </Link>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* ─── RIGHT SIDEBAR (Desktop) ─── */}
          <div className="hidden md:block flex-shrink-0 w-[327px] sticky top-[96px] self-start">
            <div className="bg-[#fafafa] border border-black/11 rounded-[20px] px-[7px] py-[30px]">
              <div className="flex flex-col gap-[13px] items-center">
                {/* Profile avatar */}
                <div className="flex items-center justify-center w-[70px] h-[70px] rounded-full bg-[#e8e8e8]">
                  {property.listedBy.name ? (
                    <span className="text-[22px] font-semibold text-[#161515]">
                      {property.listedBy.name
                        .split(/\s+/)
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((w) => w[0]?.toUpperCase())
                        .join("")}
                    </span>
                  ) : (
                    <User size={36} className="text-[#888]" />
                  )}
                </div>
                {property.listedBy.name && (
                  <div className="text-[13px] text-black/70">
                    Listed by {property.listedBy.name}
                  </div>
                )}
                <div className="flex flex-col gap-[15px] w-[301px]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[22px] font-semibold text-[#161515]">
                      Send Message
                    </h3>
                    <div className="flex gap-[12px]">
                      {property.contact.hasPhone && (
                        <button
                          onClick={() =>
                            sendContact({
                              propertyId,
                              method: "PHONE",
                              source: "detail-desktop",
                            })
                          }
                          disabled={contactPending === "PHONE"}
                          aria-label="Call lister"
                          className="bg-[#af2525] rounded-full w-[40px] h-[41px] flex items-center justify-center hover:bg-[#93191d] transition-colors disabled:opacity-60"
                        >
                          <Phone size={16} className="text-white" />
                        </button>
                      )}
                      {property.contact.hasWhatsApp && (
                        <button
                          onClick={() =>
                            sendContact({
                              propertyId,
                              method: "WHATSAPP",
                              source: "detail-desktop",
                              whatsappMessage: `Hi, I'm interested in your listing "${property.title}" on UNO.`,
                            })
                          }
                          disabled={contactPending === "WHATSAPP"}
                          aria-label="Message on WhatsApp"
                          className="bg-[#25D366] rounded-full w-[41px] h-[41px] flex items-center justify-center hover:bg-[#1ebe5d] transition-colors disabled:opacity-60"
                        >
                          <WhatsAppIcon size={20} className="text-white" />
                        </button>
                      )}
                    </div>
                  </div>
                  <hr className="border-t border-black/10" />
                </div>
                <button
                  onClick={() =>
                    sendContact({
                      propertyId,
                      method: property.contact.hasWhatsApp ? "WHATSAPP" : "PHONE",
                      source: "detail-inspect",
                      whatsappMessage: `Hi, I'd like to inspect "${property.title}" listed for ${formatNaira(
                        property.rent
                      )}. When would be a good time?`,
                    })
                  }
                  disabled={!property.contact.hasWhatsApp && !property.contact.hasPhone}
                  className="border border-[#161515] rounded-[50px] h-[41px] w-[301px] flex items-center justify-center text-[15px] text-black tracking-[-0.3px] hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Message for Inspection
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SIMILAR HOMES ─── */}
        {similar.length > 0 && (
          <section className="mt-[40px] md:mt-[60px] px-[16px] md:px-0 md:w-[1049px] md:mx-auto">
            <h2 className="text-[20px] md:text-[30px] font-medium text-[#161515] mb-[25px] md:mb-[35px]">
              Similar homes you might like
            </h2>

            {/* Desktop: 3-column grid */}
            <div className="hidden md:grid md:grid-cols-3 gap-[20px]">
              {similar.map((prop) => (
                <Link key={prop.id} href={`/property/${prop.id}`}>
                  <PropertyCard data={prop} className="w-full" />
                </Link>
              ))}
            </div>

            {/* Mobile: horizontal scroll */}
            <div className="md:hidden flex gap-[12px] overflow-x-auto pb-[8px] no-scrollbar" style={{ scrollbarWidth: "none" }}>
              {similar.map((prop) => (
                <Link key={prop.id} href={`/property/${prop.id}`} className="shrink-0">
                  <PropertyCard data={prop} className="w-[234px]" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="mt-6 flex justify-center border-t border-black/5 pt-6">
          <ReportListingButton propertyId={property.id} />
        </div>

        <div className="h-[40px] md:h-[60px]" />
      </main>

      {/* Footer — extra bottom padding on mobile to clear the sticky CTA bar */}
      <div className="pb-[120px] md:pb-0">
        <Footer />
      </div>

      {/* ── MOBILE STICKY BOTTOM BAR ── */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#fafafa] border-t border-black/26 rounded-t-[15px] shadow-[0px_0px_24px_0px_rgba(0,0,0,0.3)] px-[15px] pb-[15px] pt-[12px]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-[8px]">
            <div className="flex items-center gap-[7px]">
              <button
                onClick={() => toggleFavourite(propertyId)}
                aria-label={saved ? "Remove from favourites" : "Save to favourites"}
                className={cn(
                  "flex items-center justify-center w-[27px] h-[27px] rounded-full",
                  saved ? "bg-[#af2525]" : "bg-black"
                )}
              >
                <Heart
                  size={15}
                  className={cn("text-white", saved && "fill-white")}
                />
              </button>
              <button onClick={handleShare} className="flex items-center justify-center w-[27px] h-[27px] rounded-full bg-[#ffcfcf]" aria-label="Share">
                <Share2 size={14} className="text-[#af2525]" />
              </button>
            </div>
            <span className="text-[24px] font-extrabold text-[#161515]">
              {formatNaira(property.rent)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-[8px]">
            <span className="text-[15px] font-medium text-[#161515]">
              Send a Message
            </span>
            <div className="flex items-center gap-[16px]">
              {property.contact.hasPhone && (
                <button
                  onClick={() =>
                    sendContact({
                      propertyId,
                      method: "PHONE",
                      source: "detail-mobile",
                    })
                  }
                  disabled={contactPending === "PHONE"}
                  aria-label="Call lister"
                  className="bg-[#af2525] rounded-full w-[32px] h-[33px] flex items-center justify-center disabled:opacity-60"
                >
                  <Phone size={14} className="text-white" />
                </button>
              )}
              {property.contact.hasWhatsApp && (
                <button
                  onClick={() =>
                    sendContact({
                      propertyId,
                      method: "WHATSAPP",
                      source: "detail-mobile",
                      whatsappMessage: `Hi, I'm interested in your listing "${property.title}" on UNO.`,
                    })
                  }
                  disabled={contactPending === "WHATSAPP"}
                  aria-label="Message on WhatsApp"
                  className="bg-[#25D366] rounded-full w-[33px] h-[33px] flex items-center justify-center disabled:opacity-60"
                >
                  <WhatsAppIcon size={18} className="text-white" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom spacer for mobile sticky bar */}
      <div className="md:hidden h-[100px]" />
    </div>
  );
}
