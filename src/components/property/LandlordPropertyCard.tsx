"use client";

import Image from "next/image";
import { MoreVertical, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

type ListingStatus = "DRAFT" | "PENDING" | "ACTIVE" | "PAUSED" | "RENTED" | "REJECTED";

interface LandlordPropertyCardProps {
  id: string;
  title: string;
  address: string;
  imageUrl?: string;
  status: ListingStatus;
  onAction?: (id: string, action: string) => void;
  onMoreMenu?: (id: string) => void;
  className?: string;
}

interface StatusConfig {
  dotColor: string;
  label: string;
  ctaLabel: string;
  ctaAction: string;
}

const STATUS_CONFIG: Record<ListingStatus, StatusConfig> = {
  DRAFT: {
    dotColor: "bg-yellow-400",
    label: "Listing in progress",
    ctaLabel: "Complete",
    ctaAction: "complete",
  },
  PENDING: {
    dotColor: "bg-yellow-400",
    label: "Listing in progress",
    ctaLabel: "Complete",
    ctaAction: "complete",
  },
  ACTIVE: {
    dotColor: "bg-green-500",
    label: "Live",
    ctaLabel: "View",
    ctaAction: "view",
  },
  PAUSED: {
    dotColor: "bg-orange-400",
    label: "Paused",
    ctaLabel: "Resume",
    ctaAction: "resume",
  },
  RENTED: {
    dotColor: "bg-blue-500",
    label: "Rented out",
    ctaLabel: "Mark Available",
    ctaAction: "mark_available",
  },
  REJECTED: {
    dotColor: "bg-red-500",
    label: "Rejected",
    ctaLabel: "Edit",
    ctaAction: "edit",
  },
};

export function LandlordPropertyCard({
  id,
  title,
  address,
  imageUrl,
  status,
  onAction,
  onMoreMenu,
  className,
}: LandlordPropertyCardProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div
      className={cn(
        "flex flex-col gap-[15px] w-[311px] bg-white border border-[rgba(0,0,0,0.1)] rounded-[16px] overflow-hidden",
        "transition-shadow duration-200 hover:shadow-md",
        className
      )}
    >
      {/* Image */}
      <div className="relative w-full h-[199px] flex-shrink-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            sizes="311px"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#e8e0e0] to-[#c9b8b8]" />
        )}

        {/* More menu button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onMoreMenu?.(id);
          }}
          className="absolute top-[10px] right-[10px] z-10 h-[32px] w-[32px] rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525]"
          aria-label="More options"
        >
          <MoreVertical size={16} className="text-[#161515]" />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-[10px] px-[14px] pb-[14px]">
        {/* Status indicator */}
        <div className="flex items-center gap-[6px]">
          <span
            className={cn("w-[8px] h-[8px] rounded-full flex-shrink-0", config.dotColor)}
          />
          <span className="text-[12px] text-[rgba(0,0,0,0.84)]">{config.label}</span>
        </div>

        {/* Title */}
        <h3 className="font-extrabold text-[20px] text-[#161515] leading-tight line-clamp-2">
          {title}
        </h3>

        {/* Address */}
        <div className="flex items-center gap-[4px]">
          <MapPin size={12} className="text-[rgba(0,0,0,0.6)] flex-shrink-0" />
          <span className="text-[10px] text-[rgba(0,0,0,0.6)] truncate">{address}</span>
        </div>

        {/* CTA button */}
        <button
          onClick={() => onAction?.(id, config.ctaAction)}
          className={cn(
            "flex items-center justify-center",
            "bg-[#af2525] rounded-[50px] h-[36px] w-full",
            "text-white font-bold text-[15px] font-sans",
            "transition-opacity duration-150 hover:opacity-90 active:opacity-80",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#af2525] focus-visible:ring-offset-2"
          )}
        >
          {config.ctaLabel}
        </button>
      </div>
    </div>
  );
}

export default LandlordPropertyCard;
