import { getKindForPropertyType } from "../../config/constants";

/**
 * The grey line under the title in the map popup. Beds and baths only make sense
 * for residential listings; land and commercial show just the place.
 */
export function popupMetaLine(p: { propertyType: string; bedrooms: number; bathrooms: number; area: string; city: string }): string {
	const place = `${p.area}, ${p.city}`;
	const kind = getKindForPropertyType(p.propertyType);
	if (kind === "LAND" || kind === "COMMERCIAL") return place;
	return `${p.bedrooms} bd · ${p.bathrooms} ba · ${place}`;
}
