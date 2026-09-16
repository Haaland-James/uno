import type { PropertyStatus, AvailabilityStatus } from "@prisma/client";

/**
 * Single source of truth for the three overlapping status fields on Property:
 *   - status              (lifecycle: DRAFT/PENDING/ACTIVE/PAUSED/RENTED/REJECTED)
 *   - isRented            (boolean — has the unit been let)
 *   - availabilityStatus  (display: AVAILABLE_NOW / AVAILABLE_FROM / RENTED)
 *
 * Given a lifecycle status + optional availableFrom, return the derived
 * isRented + availabilityStatus that must always be written together.
 *
 * DRAFT/PENDING/REJECTED don't change the display fields — they're not publicly
 * visible anyway, so we leave whatever was there.
 */
export function deriveStatusFields(
  status: PropertyStatus,
  availableFrom?: Date | null
): { isRented: boolean; availabilityStatus: AvailabilityStatus } | null {
  const now = new Date();
  const future = availableFrom && availableFrom.getTime() > now.getTime();

  switch (status) {
    case "ACTIVE":
      return {
        isRented: false,
        availabilityStatus: future ? "AVAILABLE_FROM" : "AVAILABLE_NOW",
      };
    case "PAUSED":
      return { isRented: false, availabilityStatus: "AVAILABLE_NOW" };
    case "RENTED":
      return { isRented: true, availabilityStatus: "RENTED" };
    case "DRAFT":
    case "PENDING":
    case "REJECTED":
      return null;
  }
}

/**
 * Spread into any `where` clause on Property to exclude soft-deleted rows.
 *   db.property.findMany({ where: { ...notDeleted, status: "ACTIVE" } })
 */
export const notDeleted = { deletedAt: null } as const;

/**
 * Lister-facing label for a lifecycle status. "ACTIVE" reads as "Live" to a
 * lister — they think in terms of whether renters can see the listing, not in
 * terms of the enum. Shared by the lister dashboard and analytics pages.
 */
export function statusLabel(s: string): string {
  switch (s) {
    case "ACTIVE": return "Live";
    case "PAUSED": return "Paused";
    case "RENTED": return "Rented";
    case "PENDING": return "Pending";
    case "REJECTED": return "Rejected";
    default: return s;
  }
}

/** Badge classes paired with `statusLabel`. */
export function statusColor(s: string): string {
  switch (s) {
    case "ACTIVE": return "bg-[#22c55e] text-white";
    case "PAUSED": return "bg-[#f5b324] text-white";
    case "RENTED": return "bg-[#6366f1] text-white";
    case "PENDING": return "bg-[#f97316] text-white";
    case "REJECTED": return "bg-[#ef4444] text-white";
    default: return "bg-black/10 text-black/60";
  }
}
