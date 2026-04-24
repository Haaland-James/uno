"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, MapPin, Bath, BedDouble, ChevronLeft, ChevronRight } from "lucide-react";
import { cn, formatNaira } from "@/lib/utils";
import type { PropertyCardData } from "@/types/property";

interface PropertyCardProps {
  data: PropertyCardData;
  isFavourited?: boolean;
  onToggleFavourite?: (id: string) => void;
  className?: string;
}

const BED_LABELS: Record<string, string> = {
  FLAT: "Flat",
  HOUSE: "House",
  DUPLEX: "Duplex",
  SELF_CONTAIN: "Self-con",
  BUNGALOW: "Bungalow",
  COMMERCIAL: "Commercial",
  LAND: "Land",
};

export function PropertyCard({
  data,
  isFavourited = false,
  onToggleFavourite,
  className,
}: PropertyCardProps) {
  const [imgIndex, setImgIndex] = useState(0);

  const photos = data.photos.filter((p) => p.url);
  const currentPhoto = photos[imgIndex] ?? photos[0];
  const hasMultiple = photos.length > 1;

  const goPrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => i - 1);
  };

  const goNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setImgIndex((i) => i + 1);
  };

  // Bed label: use property type for self-contain, otherwise show bedroom count
  const bedLabel =
    data.propertyType === "SELF_CONTAIN"
      ? "Self-con"
      : `${data.bedrooms} bed`;

  // Pick up to 3 amenities for the features row
  const features = data.amenities.slice(0, 3);

  const detailHref = `/property/${data.id}`;

  return (
    <Link
      href={detailHref}
      className={cn(
        "flex flex-col bg-white border border-[rgba(0,0,0,0.06)] rounded-[15px] pb-[10px]",
        "w-[234px] md:w-[325px]",
        "transition-shadow duration-200 hover:shadow-lg cursor-pointer",
        className
      )}
    >
      {/* Image carousel */}
      <div className="group relative w-full h-[160px] md:h-[216px] rounded-t-[15px] overflow-hidden flex-shrink-0">
        {currentPhoto ? (
          <Image
            src={currentPhoto.url}
            alt={data.title}
            fill
            className="object-cover transition-opacity duration-200"
            sizes="(max-width: 768px) 234px, 325px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#e8e0e0] to-[#c9b8b8]" />
        )}

        {/* Carousel arrows — visible only on hover */}
        {hasMultiple && (
          <>
            {imgIndex > 0 && (
              <button
                onClick={goPrev}
                className="absolute left-[8px] top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center h-7 w-7 rounded-full bg-white/90 shadow-md focus:outline-none"
                aria-label="Previous photo"
              >
                <ChevronLeft size={15} className="text-[#0a0a0a]" />
              </button>
            )}
            {imgIndex < photos.length - 1 && (
              <button
                onClick={goNext}
                className="absolute right-[8px] top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center h-7 w-7 rounded-full bg-white/90 shadow-md focus:outline-none"
                aria-label="Next photo"
              >
                <ChevronRight size={15} className="text-[#0a0a0a]" />
              </button>
            )}

            {/* Dot indicators */}
            <div className="absolute bottom-[8px] left-1/2 -translate-x-1/2 flex items-center gap-[5px]">
              {photos.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setImgIndex(i);
                  }}
                  className={cn(
                    "rounded-full transition-all duration-150 focus:outline-none",
                    i === imgIndex
                      ? "w-[10px] h-[5px] bg-white"
                      : "w-[5px] h-[5px] bg-white/60"
                  )}
                  aria-label={`Photo ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}

        {/* Heart button — auth gate lives inside useFavourites */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavourite?.(data.id);
          }}
          className="absolute top-[12px] right-[9px] z-10 focus:outline-none"
          aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart
            size={24}
            className={cn(
              "transition-colors duration-150",
              isFavourited
                ? "fill-[#af2525] stroke-[#af2525]"
                : "fill-transparent stroke-white"
            )}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-[16px] px-[6px] pt-[10px]">
        <div className="flex flex-col gap-[15px]">
          {/* Price + badges row */}
          <div className="flex items-end justify-between">
            {/* Left: price + location */}
            <div className="flex flex-col gap-[8px] min-w-0">
              <span className="font-extrabold text-[16px] md:text-[25px] text-[#161515] leading-tight truncate">
                {formatNaira(data.rent)}
              </span>
              <div className="flex items-center gap-[4px]">
                <MapPin size={14} className="text-[rgba(0,0,0,0.6)] flex-shrink-0" />
                <span className="text-[8px] md:text-[10px] text-[rgba(0,0,0,0.6)] truncate">
                  {data.area}, {data.city}
                </span>
              </div>
            </div>

            {/* Right: bath + bed badges stacked */}
            <div className="flex flex-col gap-[4px] flex-shrink-0">
              <span className="flex items-center gap-[4px] md:gap-[6px] border border-[rgba(0,0,0,0.6)] rounded-[14px] h-[24px] md:h-[27px] w-[72px] md:w-[84px] px-[8px] md:px-[12px] text-[9px] md:text-[10px] text-[rgba(0,0,0,0.6)] whitespace-nowrap">
                <Bath size={14} className="flex-shrink-0 md:w-[16px] md:h-[16px]" />
                {data.bathrooms} bath
              </span>
              <span className="flex items-center gap-[4px] md:gap-[6px] border border-[rgba(0,0,0,0.6)] rounded-[14px] h-[24px] md:h-[27px] w-[72px] md:w-[84px] px-[8px] md:px-[12px] text-[9px] md:text-[10px] text-[rgba(0,0,0,0.6)] whitespace-nowrap">
                <BedDouble size={13} className="flex-shrink-0 md:w-[15px] md:h-[15px]" />
                {bedLabel}
              </span>
            </div>
          </div>

          {/* Features row */}
          {features.length > 0 && (
            <div className="flex items-center gap-[9px] flex-wrap">
              {features.map((feature, index) => (
                <span key={feature} className="flex items-center gap-[9px]">
                  <span className="text-[10px] md:text-[12px] text-[rgba(0,0,0,0.84)] whitespace-nowrap">{feature}</span>
                  {index < features.length - 1 && (
                    <span className="w-[3px] h-[3px] rounded-full bg-[rgba(0,0,0,0.4)]" />
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* CTA button — navigates to detail page (same target as the card body) */}
        <div
          className={cn(
            "flex items-center justify-center",
            "bg-[#af2525] rounded-[50px] h-[30px] md:h-[41px] w-full",
            "text-white text-[14px] md:text-[15px] font-normal tracking-[-0.3px] select-none",
            "transition-opacity duration-150 hover:opacity-90 active:opacity-80"
          )}
        >
          Contact for Details
        </div>
      </div>
    </Link>
  );
}

export default PropertyCard;
