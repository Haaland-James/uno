import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import type { Prisma } from "@prisma/client";

/**
 * GET  /api/me/drafts — list signed-in user's drafts (newest first).
 * POST /api/me/drafts — create a new draft from the wizard payload.
 *   Body: { data: ListPropertyData, currentStep: number, completedSteps: number[] }
 */

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to view your drafts", 401);
	}

	const items = await db.propertyDraft.findMany({
		where: { userId: session.user.id },
		orderBy: { updatedAt: "desc" },
	});

	return ok({ items });
}

export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to save a draft", 401);
	}

	let body: { data?: Record<string, unknown>; currentStep?: number; completedSteps?: number[] };
	try {
		body = await req.json();
	} catch {
		return err("bad_request", "Invalid JSON body", 400);
	}
	if (!body?.data || typeof body.data !== "object") {
		return err("validation_error", "Missing draft data", 400);
	}

	const data = body.data as Record<string, unknown>;
	const titleHint = pickStr(data.title);
	const addressHint = buildAddress(data);
	const mainPhotoUrl = pickMainPhoto(data);

	const draft = await db.propertyDraft.create({
		data: {
			userId: session.user.id,
			data: data as Prisma.InputJsonValue,
			currentStep: typeof body.currentStep === "number" ? body.currentStep : 1,
			completedSteps: Array.isArray(body.completedSteps) ? body.completedSteps : [],
			titleHint,
			addressHint,
			mainPhotoUrl,
		},
	});

	return ok(draft, { status: 201 });
}

function pickStr(v: unknown): string | null {
	if (typeof v !== "string") return null;
	const t = v.trim();
	return t.length > 0 ? t : null;
}

function buildAddress(data: Record<string, unknown>): string | null {
	const parts: string[] = [];
	const street = pickStr(data.streetAddress);
	const area = pickStr(data.area);
	const city = pickStr(data.city);
	if (street) parts.push(street);
	if (area) parts.push(area);
	if (city && !parts.includes(city)) parts.push(city);
	return parts.length > 0 ? parts.join(", ") : null;
}

function pickMainPhoto(data: Record<string, unknown>): string | null {
	const urls = data.photoUrls;
	const idx = data.mainPhotoIndex;
	if (!Array.isArray(urls) || urls.length === 0) return null;
	const i = typeof idx === "number" && idx >= 0 && idx < urls.length ? idx : 0;
	const u = urls[i];
	return typeof u === "string" ? u : null;
}
