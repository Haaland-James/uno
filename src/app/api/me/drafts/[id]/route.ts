import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err } from "@/lib/api";
import type { Prisma } from "@prisma/client";

/**
 * GET    /api/me/drafts/[id] — fetch a single draft for resume.
 * PATCH  /api/me/drafts/[id] — overwrite draft data (used when user re-saves an
 *                              existing draft after edits).
 * DELETE /api/me/drafts/[id] — delete the draft (kebab menu "Delete Draft").
 */

async function loadOwnedDraft(id: string, userId: string) {
	const draft = await db.propertyDraft.findUnique({ where: { id } });
	if (!draft || draft.userId !== userId) return null;
	return draft;
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return err("unauthorized", "Sign in", 401);

	const draft = await loadOwnedDraft(ctx.params.id, session.user.id);
	if (!draft) return err("not_found", "Draft not found", 404);

	return ok(draft);
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return err("unauthorized", "Sign in", 401);

	const draft = await loadOwnedDraft(ctx.params.id, session.user.id);
	if (!draft) return err("not_found", "Draft not found", 404);

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

	const updated = await db.propertyDraft.update({
		where: { id: draft.id },
		data: {
			data: data as Prisma.InputJsonValue,
			currentStep: typeof body.currentStep === "number" ? body.currentStep : draft.currentStep,
			completedSteps: Array.isArray(body.completedSteps) ? body.completedSteps : draft.completedSteps,
			titleHint: pickStr(data.title),
			addressHint: buildAddress(data),
			mainPhotoUrl: pickMainPhoto(data),
		},
	});

	return ok(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return err("unauthorized", "Sign in", 401);

	const draft = await loadOwnedDraft(ctx.params.id, session.user.id);
	if (!draft) return err("not_found", "Draft not found", 404);

	await db.propertyDraft.delete({ where: { id: draft.id } });
	return ok({ ok: true });
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
