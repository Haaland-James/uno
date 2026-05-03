import { z } from "zod";

const PropertyTypeEnum = z.enum([
  "FLAT", "HOUSE", "DUPLEX", "SELF_CONTAIN", "BUNGALOW", "COMMERCIAL", "LAND",
  "TERRACE", "DETACHED", "SEMI_DETACHED", "PENTHOUSE", "STUDIO", "MINI_FLAT", "SHARED_ROOM",
  "OFFICE", "SHOP", "WAREHOUSE", "COWORKING", "EVENT_CENTRE", "HOTEL_SHORTLET", "PLAZA_UNIT",
  "RESIDENTIAL_PLOT", "COMMERCIAL_PLOT", "AGRICULTURAL_LAND", "MIXED_USE_LAND",
]);

const FurnishingEnum = z.enum(["UNFURNISHED", "SEMI_FURNISHED", "FULLY_FURNISHED"]);
const ListingTypeEnum = z.enum(["RENT", "LEASE", "SALE"]);

/**
 * URL-query variant of the property filters. Coerces stringy params from
 * `URLSearchParams` and accepts comma-separated repeats (e.g. `?type=FLAT,HOUSE`).
 */
export const propertyListQuerySchema = z.object({
  q: z.string().trim().optional(),
  ids: z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean)
    )
    .pipe(z.array(z.string().min(1)).max(50))
    .optional(),
  city: z.string().trim().optional(),
  cities: z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean)
    )
    .pipe(z.array(z.string().min(1)))
    .optional(),
  area: z.string().trim().optional(),
  listingType: z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean)
    )
    .pipe(z.array(ListingTypeEnum))
    .optional(),
  type: z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean)
    )
    .pipe(z.array(PropertyTypeEnum))
    .optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  beds: z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean)
    )
    .pipe(z.array(z.coerce.number().int().min(0).max(20)))
    .optional(),
  baths: z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean)
    )
    .pipe(z.array(z.coerce.number().int().min(0).max(20)))
    .optional(),
  furnishing: z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean)
    )
    .pipe(z.array(FurnishingEnum))
    .optional(),
  amenities: z
    .union([z.string(), z.array(z.string())])
    .transform((v) =>
      Array.isArray(v) ? v : v.split(",").map((s) => s.trim()).filter(Boolean)
    )
    .pipe(z.array(z.string().min(1)))
    .optional(),
  verifiedOnly: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  availableNow: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "most_viewed"]).optional(),
  // Map-viewport filter — when present, only properties whose lat/lng fall
  // inside the bbox are returned. Used by the search page's "Search this area".
  minLng: z.coerce.number().optional(),
  minLat: z.coerce.number().optional(),
  maxLng: z.coerce.number().optional(),
  maxLat: z.coerce.number().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export const featuredQuerySchema = z.object({
  type: z.enum(["latest", "hot", "virgin", "top"]).default("latest"),
  limit: z.coerce.number().int().min(1).max(20).default(8),
  area: z.string().trim().optional(),
});

export type PropertyListQuery = z.infer<typeof propertyListQuerySchema>;
export type FeaturedQuery = z.infer<typeof featuredQuerySchema>;
