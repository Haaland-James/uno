"use client";

import Image from "next/image";
import { Heart, MapPin, Bath, BedDouble } from "lucide-react";
import { cn, formatRentPrice } from "@/lib/utils";
import type { PropertyCardData } from "@/types/property";

interface PropertyCardProps {
  data: PropertyCardData;
  isFavourited?: boolean;
  onToggleFavourite?: (id: string) => void;
  className?: string;
}

const BED_TYPE_LABELS: Record<string, string> = {
  FLAT: "Flat",
  HOUSE: "House",
  DUPLEX: "Duplex",
  SELF_CONTAIN: "Self Contain",
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
  const mainPhoto = data.photos.find((p) => p.isMain) ?? data.photos[0];
  const hasPhoto = !!mainPhoto?.url;

  const features = [data.amenities[0], data.amenities[1], data.amenities[2]].filter(
    Boolean
  ) as string[];

  const formattedPrice = formatRentPrice(data.rent, data.currency, data.rentPeriod);

  return (
    <div
      className={cn(
        "flex flex-col gap-[10px] bg-white border border-[rgba(0,0,0,0.13)] rounded-[20px] p-[10px]",
        "w-[234px] md:w-[377px]",
        "transition-shadow duration-200 hover:shadow-lg",
        className
      )}
    >
      {/* Image */}
      <div className="relative w-full h-[140px] md:h-[216px] rounded-[15px] overflow-hidden flex-shrink-0">
        {hasPhoto ? (
          <Image
            src={mainPhoto!.url}
            alt={data.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 234px, 377px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#e8e0e0] to-[#c9b8b8]" />
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-[rgba(0,0,0,0.5)]" />

        {/* Heart button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleFavourite?.(data.id);
          }}
          className="absolute top-[10px] right-[10px] z-10 p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-full"
          aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
        >
          <Heart
            size={22}
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
      <div className="flex flex-col gap-[6px] px-[4px]">
        {/* Price + badges row */}
        <div className="flex items-center justify-between gap-[8px]">
          <span className="font-extrabold text-[20px] md:text-[25px] text-[#161515] leading-tight truncate">
            {formattedPrice}
          </span>

          <div className="flex items-center gap-[6px] flex-shrink-0">
            <span className="flex items-center gap-[4px] border border-[rgba(0,0,0,0.15)] rounded-[14px] h-[27px] px-[12px] text-[12px] text-[rgba(0,0,0,0.7)] whitespace-nowrap">
              <Bath size={12} />
              {data.bathrooms} bath
            </span>
            <span className="flex items-center gap-[4px] border border-[rgba(0,0,0,0.15)] rounded-[14px] h-[27px] px-[12px] text-[12px] text-[rgba(0,0,0,0.7)] whitespace-nowrap">
              <BedDouble size={12} />
              {BED_TYPE_LABELS[data.propertyType] ?? data.propertyType}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-[4px]">
          <MapPin size={16} className="text-[rgba(0,0,0,0.6)] flex-shrink-0" />
          <span className="text-[14px] text-[rgba(0,0,0,0.6)] truncate">
            {data.area}, {data.city}
          </span>
        </div>

        {/* Features row */}
        {features.length > 0 && (
          <div className="flex items-center gap-[4px] flex-wrap">
            {features.map((feature, index) => (
              <span key={feature} className="flex items-center gap-[4px]">
                <span className="text-[14px] text-[rgba(0,0,0,0.84)]">{feature}</span>
                {index < features.length - 1 && (
                  <span className="text-[rgba(0,0,0,0.4)] text-[14px] select-none">·</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* CTA */}
        <div
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") e.currentTarget.click();
          }}
          className={cn(
            "mt-[4px] flex items-center justify-center",
            "bg-[#af2525] rounded-[50px] h-[41px] w-full",
            "text-white text-[16px] font-semibold font-sans cursor-pointer select-none",
            "transition-opacity duration-150 hover:opacity-90 active:opacity-80"
          )}
        >
          View Home
        </div>
      </div>
    </div>
  );
}

export default PropertyCard;
