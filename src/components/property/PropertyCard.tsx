"use client";

import { Heart, MapPin, BadgeCheck, BedDouble, Bath, Tag } from "lucide-react";
import { cn, formatRentPrice } from "@/lib/utils";
import type { PropertyCardData } from "@/types";

interface PropertyCardProps {
	property: PropertyCardData;
	isFavourited?: boolean;
	onToggleFavourite?: (id: string) => void;
	className?: string;
}

const propertyTypeLabels: Record<string, string> = {
	FLAT: "Flat",
	HOUSE: "House",
	DUPLEX: "Duplex",
	SELF_CONTAIN: "Self Contain",
	BUNGALOW: "Bungalow",
	COMMERCIAL: "Commercial",
	LAND: "Land",
};

export function PropertyCard({
	property,
	isFavourited = false,
	onToggleFavourite,
	className,
}: PropertyCardProps) {
	const mainPhoto = property.photos.find((p) => p.isMain) || property.photos[0];
	const isVerified = property.verificationStatus === "VERIFIED";

	return (
		<article
			className={cn(
				"group card-uno overflow-hidden cursor-pointer",
				"active:scale-[0.98] transition-all duration-200",
				className
			)}
		>
			{/* Image Section */}
			<div className="relative -mx-card-padding -mt-card-padding mb-3">
				<div className="aspect-[16/10] bg-surface-tertiary overflow-hidden rounded-t-card">
					{/* Placeholder gradient since we don't have real images yet */}
					<div
						className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 flex items-center justify-center"
					>
						<div className="text-center text-content-muted">
							<BedDouble className="h-8 w-8 mx-auto mb-1 opacity-40" />
							<span className="text-tiny opacity-60">
								{property.bedrooms} Bed {propertyTypeLabels[property.propertyType]}
							</span>
						</div>
					</div>
				</div>

				{/* Favourite Button */}
				<button
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						onToggleFavourite?.(property.id);
					}}
					className="absolute top-3 right-3 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-sm hover:bg-white transition-colors touch-target"
					aria-label={isFavourited ? "Remove from favourites" : "Add to favourites"}
				>
					<Heart
						className={cn(
							"h-5 w-5 transition-colors",
							isFavourited
								? "fill-uno-red text-uno-red"
								: "text-content-secondary"
						)}
					/>
				</button>

				{/* Verification Badge */}
				{isVerified && (
					<div className="absolute top-3 left-3 badge-verified bg-white/90 backdrop-blur-sm shadow-sm">
						<BadgeCheck className="h-3.5 w-3.5" />
						<span>Verified</span>
					</div>
				)}

				{/* Availability Badge */}
				{property.availabilityStatus === "AVAILABLE_FROM" && (
					<div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm text-pending text-tiny font-medium px-2 py-0.5 rounded-full shadow-sm">
						Available Soon
					</div>
				)}
			</div>

			{/* Content Section */}
			<div className="space-y-2">
				{/* Price */}
				<div className="flex items-baseline justify-between">
					<span className="price-display">
						{formatRentPrice(property.rent, property.rentPeriod)}
					</span>
					{property.negotiable && (
						<span className="flex items-center gap-0.5 text-tiny text-pending font-medium">
							<Tag className="h-3 w-3" />
							Negotiable
						</span>
					)}
				</div>

				{/* Property Info */}
				<h3 className="text-body font-medium text-content-primary leading-snug line-clamp-2 group-hover:text-uno-red transition-colors">
					{property.bedrooms} Bedroom {propertyTypeLabels[property.propertyType]} • {property.area}
				</h3>

				{/* Location */}
				<div className="flex items-center gap-1 text-small text-content-secondary">
					<MapPin className="h-3.5 w-3.5 flex-shrink-0" />
					<span className="truncate">
						{property.area}, {property.city}
					</span>
				</div>

				{/* Key Details */}
				<div className="flex items-center gap-3 text-small text-content-secondary">
					<div className="flex items-center gap-1">
						<BedDouble className="h-3.5 w-3.5" />
						<span>{property.bedrooms} {property.bedrooms === 1 ? "Bed" : "Beds"}</span>
					</div>
					<div className="flex items-center gap-1">
						<Bath className="h-3.5 w-3.5" />
						<span>{property.bathrooms} {property.bathrooms === 1 ? "Bath" : "Baths"}</span>
					</div>
				</div>

				{/* Amenity Pills */}
				{property.amenities.length > 0 && (
					<div className="flex flex-wrap gap-1.5 pt-1">
						{property.amenities.slice(0, 3).map((amenity) => (
							<span
								key={amenity}
								className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-tertiary text-tiny text-content-secondary"
							>
								{amenity}
							</span>
						))}
						{property.amenities.length > 3 && (
							<span className="inline-flex items-center px-2 py-0.5 rounded-full bg-surface-tertiary text-tiny text-content-muted">
								+{property.amenities.length - 3} more
							</span>
						)}
					</div>
				)}
			</div>
		</article>
	);
}
