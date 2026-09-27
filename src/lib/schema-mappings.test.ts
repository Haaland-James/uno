import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("maps the property search column and composite index to their migration names", () => {
	const schema = readFileSync("prisma/schema.prisma", "utf8");
	expect(schema).toMatch(/searchVector\s+Unsupported\("tsvector"\)\?\s+@map\("search_vector"\)/);
	expect(schema).toContain('@@index([status, city, area, propertyType, bedrooms, rent], map: "Property_status_city_area_type_beds_rent_idx")');
});

// These are the names Prisma derives for the PriceHistory / PropertyView schema
// (no `map:` overrides). If the hand-edited migration drifts from them, the next
// `prisma migrate dev` would generate a drop/recreate — the item 14 failure.
it("creates price-history and view objects under Prisma's default names", () => {
	const sql = readFileSync("prisma/migrations/20260927000000_price_history_and_property_views/migration.sql", "utf8");
	for (const name of [
		"PriceHistory_pkey",
		"PriceHistory_propertyId_createdAt_idx",
		"PriceHistory_createdAt_idx",
		"PriceHistory_propertyId_fkey",
		"PropertyView_pkey",
		"PropertyView_propertyId_viewerKey_day_key",
		"PropertyView_propertyId_createdAt_idx",
		"PropertyView_propertyId_fkey",
	]) {
		expect(sql).toContain(`"${name}"`);
	}
});
