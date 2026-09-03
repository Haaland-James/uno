import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { contactCreateSchema, contactListQuerySchema } from "@/lib/validators/contact";
import { contactRequestLimiter } from "@/lib/ratelimit";
import { sendContactLeadEmail } from "@/lib/email";

const IDEMPOTENCY_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

/**
 * GET /api/contacts — landlord inbox.
 * Lists ContactRequest rows for properties owned by the current user.
 */
export async function GET(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to view your messages", 401);
	}

	const { searchParams } = new URL(req.url);
	const parsed = contactListQuerySchema.safeParse({
		status: searchParams.get("status") ?? undefined,
		cursor: searchParams.get("cursor") ?? undefined,
		limit: searchParams.get("limit") ?? undefined,
	});
	if (!parsed.success) return zodErr(parsed.error);

	const { status, cursor, limit = 30 } = parsed.data;

	const where = {
		property: { landlordId: session.user.id, deletedAt: null },
		...(status && status !== "ALL" ? { status } : {}),
	} as const;

	const rows = await db.contactRequest.findMany({
		where,
		orderBy: { createdAt: "desc" },
		take: limit + 1,
		...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
		include: {
			property: {
				select: {
					id: true,
					title: true,
					city: true,
					area: true,
					photos: { orderBy: { order: "asc" }, take: 1, select: { url: true } },
				},
			},
		},
	});

	const hasMore = rows.length > limit;
	const items = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
		id: r.id,
		propertyId: r.propertyId,
		property: {
			id: r.property.id,
			title: r.property.title,
			city: r.property.city,
			area: r.property.area,
			photo: r.property.photos[0]?.url ?? null,
		},
		tenantName: r.tenantName,
		tenantPhone: r.tenantPhone,
		tenantEmail: r.tenantEmail,
		message: r.message,
		contactMethod: r.contactMethod,
		status: r.status,
		source: r.source,
		readAt: r.readAt,
		respondedAt: r.respondedAt,
		createdAt: r.createdAt,
	}));

	const [unreadCount, totalCount] = await Promise.all([
		db.contactRequest.count({
			where: { property: { landlordId: session.user.id, deletedAt: null }, status: "UNREAD" },
		}),
		db.contactRequest.count({
			where: { property: { landlordId: session.user.id, deletedAt: null } },
		}),
	]);

	return ok({
		items,
		hasMore,
		nextCursor: hasMore ? items[items.length - 1]?.id ?? null : null,
		counts: { unread: unreadCount, total: totalCount },
	});
}

/**
 * POST /api/contacts — log a contact intent and return the channel target.
 *
 * Authenticated renter taps Call/WhatsApp/Email on a property page → we record
 * a ContactRequest (so the landlord sees the lead) and return the contact
 * coordinates so the client can open tel:/wa.me/mailto:.
 *
 * Idempotency: same tenant+property+method inside 10 minutes returns the
 * existing record instead of inserting a dup (defeats double-taps).
 */
export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to contact the lister", 401);
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return err("bad_request", "Invalid JSON body", 400);
	}
	const parsed = contactCreateSchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);
	const { propertyId, contactMethod, message, source } = parsed.data;

	// Rate-limit per tenant
	const rl = await contactRequestLimiter.limit(session.user.id);
	if (!rl.success) {
		return err(
			"rate_limited",
			"You've contacted a lot of listers recently — try again later.",
			429
		);
	}

	const [property, tenant] = await Promise.all([
		db.property.findUnique({
			where: { id: propertyId },
			include: {
				landlord: { include: { landlordProfile: true } },
			},
		}),
		db.user.findUnique({
			where: { id: session.user.id },
			select: { id: true, name: true, email: true, phone: true },
		}),
	]);

	if (!property || property.deletedAt) {
		return err("not_found", "Property not found", 404);
	}
	if (property.status !== "ACTIVE") {
		return err("not_available", "This listing isn't currently available", 400);
	}
	if (!tenant) {
		return err("unauthorized", "Session user not found", 401);
	}
	if (property.landlordId === tenant.id) {
		return err("self_contact", "You can't send yourself an enquiry", 400);
	}

	// Resolve contact target for the requested channel
	const landlord = property.landlord;
	const whatsapp = landlord.landlordProfile?.whatsappNumber || landlord.phone || null;
	let target: { phone?: string; whatsapp?: string; email?: string } = {};
	if (contactMethod === "WHATSAPP") {
		if (!whatsapp) return err("no_whatsapp", "This lister hasn't set up WhatsApp yet", 400);
		target = { whatsapp };
	} else if (contactMethod === "PHONE") {
		if (!landlord.phone) return err("no_phone", "This lister hasn't added a phone number yet", 400);
		target = { phone: landlord.phone };
	} else {
		if (!landlord.email) return err("no_email", "This lister hasn't added an email yet", 400);
		target = { email: landlord.email };
	}

	// Idempotency lookup — same (tenant, property, method) inside the window
	const since = new Date(Date.now() - IDEMPOTENCY_WINDOW_MS);
	const existing = await db.contactRequest.findFirst({
		where: {
			tenantId: tenant.id,
			propertyId,
			contactMethod,
			createdAt: { gte: since },
		},
		orderBy: { createdAt: "desc" },
	});

	if (existing) {
		return ok({ id: existing.id, deduped: true, contactTarget: target });
	}

	const created = await db.$transaction(async (tx) => {
		const row = await tx.contactRequest.create({
			data: {
				propertyId,
				tenantId: tenant.id,
				tenantName: tenant.name,
				tenantPhone: tenant.phone ?? "",
				tenantEmail: tenant.email,
				message: message ?? null,
				contactMethod,
				source: source ?? null,
			},
			select: { id: true },
		});
		await tx.property.update({
			where: { id: propertyId },
			data: { contactCount: { increment: 1 } },
		});
		return row;
	});

	try {
		await sendContactLeadEmail({
			to: landlord.email,
			tenantName: tenant.name,
			tenantPhone: tenant.phone ?? "",
			tenantEmail: tenant.email,
			message: message ?? null,
			contactMethod,
			propertyTitle: property.title,
			propertyLocation: `${property.area}, ${property.city}`,
			inboxUrl: `${process.env.NEXTAUTH_URL}/listing/contacts`,
		});
	} catch (error) {
		// The ContactRequest row is already the source of truth — a failed
		// notification email shouldn't fail the renter's contact action.
		console.error("Failed to send contact lead email", error);
	}

	return ok({ id: created.id, deduped: false, contactTarget: target }, { status: 201 });
}
