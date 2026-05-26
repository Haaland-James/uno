/**
 * One-off: promote a user to ADMIN, creating them if they don't exist yet.
 *
 *   npx tsx scripts/promote-admin.ts nonso@uno.com "Nonso"
 *
 * After the first admin exists you can promote others from /admin/users.
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
	const [emailArg, nameArg] = process.argv.slice(2);
	if (!emailArg) {
		console.error("Usage: tsx scripts/promote-admin.ts <email> [name]");
		process.exit(1);
	}
	const email = emailArg.toLowerCase().trim();
	const name = nameArg ?? email.split("@")[0];

	const user = await db.user.upsert({
		where: { email },
		update: { role: "ADMIN" },
		create: { email, name, emailVerified: true, role: "ADMIN" },
		select: { id: true, email: true, name: true, role: true },
	});

	console.log("✓ Admin ready:", user);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => db.$disconnect());
