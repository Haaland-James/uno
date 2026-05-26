/**
 * Gate-1: automated checks on submit. Decides whether a new listing auto-publishes
 * (status=ACTIVE) or is held in PENDING for human review. Cheap signals only —
 * heavier checks (reverse image search, NIN match, registry cross-check) live
 * elsewhere or in later phases.
 *
 * Each signal is a tri-state: pass | fail | unknown. A listing auto-publishes
 * iff every gating signal is `pass`. `unknown` does NOT pass — it routes to
 * review so we add evidence later without silently letting fraud through.
 */

import { db } from "./db";

export type SignalState = "pass" | "fail" | "unknown";

export type GateSignals = {
	hasMinPhotos: SignalState; // ≥ 5 photos
	hasGeoPin: SignalState; // latitude + longitude provided
	hasPhone: SignalState; // lister has a phone on file (proxy for OTP)
	titleLengthOk: SignalState; // sanity check on title
	descriptionOk: SignalState; // sanity check on description
	noNearbyDuplicate: SignalState; // no active listing within ~30m / same beds / ±30% price
};

export type GateResult = {
	signals: GateSignals;
	autoPublish: boolean;
	failures: string[]; // human-readable list of which signals failed/are unknown
};

const MIN_PHOTOS = 5;
const TITLE_MIN = 12;
const DESC_MIN = 60;
const DUP_RADIUS_DEG = 0.00027; // ≈ 30m at the equator
const DUP_PRICE_TOLERANCE = 0.3; // ±30%

type GateInput = {
	listerUserId: string;
	title: string;
	description: string | null;
	photoCount: number;
	latitude: number | null;
	longitude: number | null;
	bedrooms: number;
	rent: number;
};

export async function computeGateSignals(input: GateInput): Promise<GateResult> {
	const signals: GateSignals = {
		hasMinPhotos: input.photoCount >= MIN_PHOTOS ? "pass" : "fail",
		hasGeoPin:
			typeof input.latitude === "number" && typeof input.longitude === "number"
				? "pass"
				: "fail",
		hasPhone: "unknown",
		titleLengthOk: input.title.trim().length >= TITLE_MIN ? "pass" : "fail",
		descriptionOk:
			(input.description ?? "").trim().length >= DESC_MIN ? "pass" : "fail",
		noNearbyDuplicate: "unknown",
	};

	// Phone-on-file (proxy for OTP — we don't have OTP'd phone yet, but having any
	// phone is a step up from anonymous accounts).
	const lister = await db.user.findUnique({
		where: { id: input.listerUserId },
		select: { phone: true },
	});
	signals.hasPhone = lister?.phone ? "pass" : "fail";

	// Duplicate detection — only meaningful if we have a pin.
	if (signals.hasGeoPin === "pass") {
		const lat = input.latitude as number;
		const lng = input.longitude as number;
		const minRent = Math.round(input.rent * (1 - DUP_PRICE_TOLERANCE));
		const maxRent = Math.round(input.rent * (1 + DUP_PRICE_TOLERANCE));
		const dupCount = await db.property.count({
			where: {
				deletedAt: null,
				status: "ACTIVE",
				bedrooms: input.bedrooms,
				latitude: { gte: lat - DUP_RADIUS_DEG, lte: lat + DUP_RADIUS_DEG },
				longitude: { gte: lng - DUP_RADIUS_DEG, lte: lng + DUP_RADIUS_DEG },
				rent: { gte: minRent, lte: maxRent },
			},
		});
		signals.noNearbyDuplicate = dupCount === 0 ? "pass" : "fail";
	}

	const failures: string[] = [];
	if (signals.hasMinPhotos !== "pass") failures.push(`needs at least ${MIN_PHOTOS} photos`);
	if (signals.hasGeoPin !== "pass") failures.push("missing map pin");
	if (signals.hasPhone !== "pass") failures.push("lister has no phone on file");
	if (signals.titleLengthOk !== "pass") failures.push("title too short");
	if (signals.descriptionOk !== "pass") failures.push("description too short");
	if (signals.noNearbyDuplicate === "fail") failures.push("possible duplicate within 30m");
	if (signals.noNearbyDuplicate === "unknown") failures.push("duplicate check skipped");

	const autoPublish = (Object.values(signals) as SignalState[]).every((s) => s === "pass");

	return { signals, autoPublish, failures };
}
