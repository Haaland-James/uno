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
