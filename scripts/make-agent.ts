/**
 * One-off: promote a user to in-house UNO agent.
 *
 * Usage:
 *   npx tsx scripts/make-agent.ts <email> [slug]
 *
 * Sets agentStatus=VERIFIED, agentEmployment=IN_HOUSE, and assigns a unique
 * slug derived from the user's name if one isn't provided. Leaves bio/photo/
 * territory blank — set those via Prisma Studio or the (forthcoming) admin UI.
 *
 * This script exists because the admin "convert user → agent" UI is deferred
 * to a later pass. Once that ships, retire this script.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function slugify(s: string): string {
	return s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, 50);
}

async function main() {
	const [email, slugArg] = process.argv.slice(2);
	if (!email) {
		console.error("Usage: npx tsx scripts/make-agent.ts <email> [slug]");
		process.exit(1);
	}

	const user = await db.user.findUnique({
		where: { email: email.toLowerCase().trim() },
	});
	if (!user) {
		console.error(`No user found with email: ${email}`);
		process.exit(1);
	}

	// Derive slug from the name if none was passed. If the derived slug is taken,
	// append a short suffix from the user id so we still end up unique.
	let slug = slugArg ?? slugify(user.name || email.split("@")[0]);
	const existing = await db.user.findUnique({ where: { agentSlug: slug } });
	if (existing && existing.id !== user.id) {
		slug = `${slug}-${user.id.slice(-4)}`;
	}

	const updated = await db.user.update({
		where: { id: user.id },
		data: {
			agentStatus: "VERIFIED",
			agentEmployment: "IN_HOUSE",
			agentSlug: slug,
			agentVerifiedAt: new Date(),
		},
		select: {
			id: true,
			email: true,
			name: true,
			agentStatus: true,
			agentEmployment: true,
			agentSlug: true,
		},
	});

	console.log("\n✓ Promoted to in-house UNO agent:\n");
	console.log(updated);
	console.log(`\nPublic profile will appear at: /agents/${updated.agentSlug}`);
	console.log(`Sign-in URL: /agent/login\n`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => db.$disconnect());
