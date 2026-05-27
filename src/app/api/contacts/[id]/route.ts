import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { contactStatusSchema } from "@/lib/validators/contact";

/**
 * PATCH /api/contacts/[id] — landlord transitions a ContactRequest status.
 * Only the property owner (or an admin) can modify.
 */
export async function PATCH(
	req: NextRequest,
	ctx: { params: { id: string } }
) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to update this message", 401);
	}

	const { id } = ctx.params;

	const contact = await db.contactRequest.findUnique({
		where: { id },
		include: { property: { select: { landlordId: true } } },
	});
	if (!contact) return err("not_found", "Message not found", 404);

	const isOwner = contact.property.landlordId === session.user.id;
	const isAdmin = session.user.role === "ADMIN";
	if (!isOwner && !isAdmin) {
		return err("forbidden", "You don't have permission to update this message", 403);
	}

	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return err("bad_request", "Invalid JSON body", 400);
	}
	const parsed = contactStatusSchema.safeParse(body);
	if (!parsed.success) return zodErr(parsed.error);
	const { status } = parsed.data;

	const now = new Date();
	const updated = await db.contactRequest.update({
		where: { id },
		data: {
			status,
			...(status === "READ" && !contact.readAt ? { readAt: now } : {}),
			...(status === "RESPONDED"
				? { respondedAt: now, readAt: contact.readAt ?? now }
				: {}),
			...(status === "UNREAD" ? { readAt: null } : {}),
		},
		select: { id: true, status: true, readAt: true, respondedAt: true },
	});

	return ok(updated);
}
