import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Returns the admin session, or null if the caller is not an authenticated admin.
 * Use in admin API routes; pair with `err("forbidden", ...)` on null.
 */
export async function requireAdmin() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) return null;
	if (session.user.role !== "ADMIN") return null;
	return session;
}
