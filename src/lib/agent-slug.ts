import { db } from "@/lib/db";

/** Lower-case, hyphenated, alnum-only, capped at 50 chars. */
export function slugify(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50);
}

/**
 * Produce an agentSlug unique across users. Derives from `name`, and if the
 * derived slug is already taken by a different user, appends a short suffix
 * from `userId` so we still land on something unique.
 */
export async function uniqueAgentSlug(name: string, userId: string): Promise<string> {
	const base = slugify(name) || `agent-${userId.slice(-6)}`;
	const existing = await db.user.findUnique({
		where: { agentSlug: base },
		select: { id: true },
	});
	if (existing && existing.id !== userId) {
		return `${base}-${userId.slice(-4)}`;
	}
	return base;
}
