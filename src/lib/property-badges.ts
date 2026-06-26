import type { PropertyCardData } from "@/types/property";

const NEW_LISTING_DAYS = 7;
const LISTED_AGO_MAX_DAYS = 60;

export type TopLeftBadge =
  | { kind: "new" }
  | { kind: "listed_ago"; days: number }
  | null;

export function getTopLeftBadge(createdAt: Date): TopLeftBadge {
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days <= NEW_LISTING_DAYS) return { kind: "new" };
  if (days <= LISTED_AGO_MAX_DAYS) return { kind: "listed_ago", days };
  return null;
}

export function isOffMarket(data: Pick<PropertyCardData, "availabilityStatus">): boolean {
  // status is the listing-management display type; availabilityStatus is the canonical availability signal
  return data.availabilityStatus === "RENTED";
}
