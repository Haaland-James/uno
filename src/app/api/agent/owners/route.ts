import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { requireAgent } from "@/lib/agent";

/**
 * GET /api/agent/owners — list off-platform owners grouped by phone
 */
export async function GET() {
	const session = await requireAgent();
	if (!session) return err("unauthorized", "Agent sign-in required", 401);

	const properties = await db.property.findMany({
		where: {
			landlordId: session.user.id,
			listedByAgent: true,
			deletedAt: null,
			offPlatformOwnerPhone: { not: null },
		},
		select: {
			id: true,
			title: true,
			area: true,
			city: true,
			offPlatformOwnerName: true,
			offPlatformOwnerPhone: true,
		},
		orderBy: { createdAt: "desc" },
	});

	const byPhone = new Map<string, { name: string | null; phone: string; properties: typeof properties }>();
	for (const p of properties) {
		const phone = p.offPlatformOwnerPhone!;
		const existing = byPhone.get(phone);
		if (existing) {
			existing.properties.push(p);
			if (!existing.name && p.offPlatformOwnerName) existing.name = p.offPlatformOwnerName;
		} else {
			byPhone.set(phone, { name: p.offPlatformOwnerName, phone, properties: [p] });
		}
	}

	const owners = Array.from(byPhone.values()).sort((a, b) => b.properties.length - a.properties.length);
	return ok(owners);
}

/**
 * PATCH /api/agent/owners
 * Update offPlatformOwnerName and/or offPlatformOwnerPhone across all
 * properties this agent owns with the given phone number.
 */

const bodySchema = z.object({
	currentPhone: z.string().min(1),
	name: z.string().trim().min(1).max(100),
	phone: z.string().trim().min(7).max(20),
});

export async function PATCH(req: NextRequest) {
	const session = await requireAgent();
	if (!session) return err("unauthorized", "Agent sign-in required", 401);

	let body: unknown;
	try { body = await req.json(); } catch { return err("bad_json", "Invalid JSON", 400); }

	const parsed = bodySchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);

	const { currentPhone, name, phone } = parsed.data;

	const result = await db.property.updateMany({
		where: {
			landlordId: session.user.id,
			offPlatformOwnerPhone: currentPhone,
			deletedAt: null,
		},
		data: {
			offPlatformOwnerName: name,
			offPlatformOwnerPhone: phone,
		},
	});

	return ok({ updated: result.count });
}
