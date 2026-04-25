import { z } from "zod";

/**
 * Versioned criteria shape — what we serialize from a SearchState into
 * SavedSearch.criteria. Keep it slug-based (small, stable, restorable
 * via coverage.ts findBySlug).
 *
 * When we change the shape, bump `v` and add a migration in
 * `criteriaToSearchState` that handles old versions.
 */
export const savedSearchCriteriaSchema = z.object({
  v: z.literal(1),
  category: z.enum(["rent", "sale", "lease"]).optional(),
  stateSlug: z.string().min(1).optional(),
  citySlug: z.string().min(1).optional(),
  areaSlug: z.string().min(1).optional(),
  q: z.string().max(200).optional(),
  beds: z.array(z.number().int().min(0).max(20)).max(10).optional(),
  baths: z.array(z.number().int().min(0).max(20)).max(10).optional(),
  type: z.array(z.string().max(40)).max(10).optional(),
  furnishing: z.array(z.string().max(40)).max(5).optional(),
  amenities: z.array(z.string().max(60)).max(20).optional(),
  minPrice: z.number().int().min(0).optional(),
  maxPrice: z.number().int().min(0).optional(),
  verifiedOnly: z.boolean().optional(),
  availableNow: z.boolean().optional(),
  sort: z.enum(["price_asc", "price_desc", "newest", "most_viewed"]).optional(),
});

export type SavedSearchCriteria = z.infer<typeof savedSearchCriteriaSchema>;

export const createSavedSearchSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  criteria: savedSearchCriteriaSchema,
  notifyInstant: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
});

export const updateSavedSearchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  isActive: z.boolean().optional(),
  notifyInstant: z.boolean().optional(),
  notifyEmail: z.boolean().optional(),
});

export type CreateSavedSearchInput = z.infer<typeof createSavedSearchSchema>;
export type UpdateSavedSearchInput = z.infer<typeof updateSavedSearchSchema>;
