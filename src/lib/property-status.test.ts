import { describe, it, expect } from "vitest";
import {
  deriveStatusFields,
  notDeleted,
  statusLabel,
  statusColor,
  verificationLabel,
} from "./property-status";

const future = () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
const past = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

describe("deriveStatusFields", () => {
  it("makes an ACTIVE listing available now when there is no availableFrom", () => {
    expect(deriveStatusFields("ACTIVE")).toEqual({
      isRented: false,
      availabilityStatus: "AVAILABLE_NOW",
    });
    expect(deriveStatusFields("ACTIVE", null)).toEqual({
      isRented: false,
      availabilityStatus: "AVAILABLE_NOW",
    });
  });

  it("makes an ACTIVE listing available-from when the date is still ahead", () => {
    expect(deriveStatusFields("ACTIVE", future())).toEqual({
      isRented: false,
      availabilityStatus: "AVAILABLE_FROM",
    });
  });

  it("collapses a past availableFrom back to available now", () => {
    // A listing whose move-in date has come and gone is simply available.
    expect(deriveStatusFields("ACTIVE", past())).toEqual({
      isRented: false,
      availabilityStatus: "AVAILABLE_NOW",
    });
  });

  it("ignores availableFrom entirely for PAUSED", () => {
    expect(deriveStatusFields("PAUSED", future())).toEqual({
      isRented: false,
      availabilityStatus: "AVAILABLE_NOW",
    });
  });

  it("marks RENTED as rented on both fields together", () => {
    // The whole point of this helper is that isRented and availabilityStatus
    // can never disagree.
    expect(deriveStatusFields("RENTED")).toEqual({
      isRented: true,
      availabilityStatus: "RENTED",
    });
  });

  it("leaves the display fields alone for statuses that are not publicly visible", () => {
    expect(deriveStatusFields("DRAFT")).toBeNull();
    expect(deriveStatusFields("PENDING")).toBeNull();
    expect(deriveStatusFields("REJECTED")).toBeNull();
  });

  it("never reports a not-rented listing as RENTED, or vice versa", () => {
    for (const s of ["ACTIVE", "PAUSED", "RENTED"] as const) {
      const out = deriveStatusFields(s);
      expect(out).not.toBeNull();
      expect(out!.isRented).toBe(out!.availabilityStatus === "RENTED");
    }
  });
});

describe("notDeleted", () => {
  it("is the soft-delete guard spread into where clauses", () => {
    expect(notDeleted).toEqual({ deletedAt: null });
  });
});

describe("statusLabel", () => {
  it("renames ACTIVE to the lister-facing word", () => {
    // Listers think in terms of "is it live", not in terms of the enum.
    expect(statusLabel("ACTIVE")).toBe("Live");
  });

  it("labels the remaining lifecycle states", () => {
    expect(statusLabel("PAUSED")).toBe("Paused");
    expect(statusLabel("RENTED")).toBe("Rented");
    expect(statusLabel("PENDING")).toBe("Pending");
    expect(statusLabel("REJECTED")).toBe("Rejected");
  });

  it("passes an unknown status through unchanged", () => {
    expect(statusLabel("DRAFT")).toBe("DRAFT");
    expect(statusLabel("WAT")).toBe("WAT");
  });
});

describe("statusColor", () => {
  it("gives every labelled status its own badge classes", () => {
    const known = ["ACTIVE", "PAUSED", "RENTED", "PENDING", "REJECTED"];
    const colors = known.map(statusColor);
    expect(new Set(colors).size).toBe(known.length);
    for (const c of colors) expect(c).toContain("text-white");
  });

  it("falls back to a neutral badge for an unknown status", () => {
    expect(statusColor("WAT")).toBe("bg-black/10 text-black/60");
  });

  it("covers exactly the statuses statusLabel covers", () => {
    // If these two drift apart a listing gets a label with no matching colour.
    for (const s of ["ACTIVE", "PAUSED", "RENTED", "PENDING", "REJECTED"]) {
      expect(statusLabel(s)).not.toBe(s);
      expect(statusColor(s)).not.toBe("bg-black/10 text-black/60");
    }
  });
});

describe("verificationLabel", () => {
  it("labels the wizard-only IN_PROGRESS state", () => {
    // IN_PROGRESS is UI-only — it is not in Prisma's VerificationStatus enum.
    expect(verificationLabel("IN_PROGRESS")).toBe("Listing in progress");
  });

  it("labels the real verification states", () => {
    expect(verificationLabel("PENDING")).toBe("Verification in progress");
    expect(verificationLabel("VERIFIED")).toBe("Verification Complete");
    expect(verificationLabel("REJECTED")).toBe("Verification failed");
  });

  it("passes an unknown state through unchanged", () => {
    expect(verificationLabel("WAT")).toBe("WAT");
  });

  it("distinguishes a rejected verification from a rejected listing", () => {
    // Both enums have a REJECTED member but they mean different things to the
    // lister, so the two label functions must not collide.
    expect(verificationLabel("REJECTED")).not.toBe(statusLabel("REJECTED"));
  });
});
