import { ok, err } from "@/lib/api";
import { requireAdmin } from "@/lib/admin";

/**
 * GET /api/admin/reports — stub for user-submitted reports.
 *
 * The `Report` model isn't in the Prisma schema yet (see plan doc for the
 * proposed shape). This endpoint exists so the client wiring is in place;
 * it always returns an empty list until the migration lands.
 */
export async function GET() {
	const admin = await requireAdmin();
	if (!admin) return err("forbidden", "Admin only", 403);
	return ok({ items: [], total: 0 });
}
