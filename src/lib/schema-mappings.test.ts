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

// Item 55: prices above ₦2,147,483,647 overflow a 32-bit Int. Pin the six money
// columns as Float (DOUBLE PRECISION) so a regenerated schema can't revert them.
it("keeps every money column a Float, backed by the double-precision migration", () => {
	const schema = readFileSync("prisma/schema.prisma", "utf8");
	// schema.prisma may be CRLF on Windows checkouts, so normalise before slicing models.
	const text = schema.replace(/\r\n/g, "\n");
	const model = (name: string) => text.match(new RegExp(String.raw`model ${name} \{[\s\S]*?\n\}`))![0];
	const type = (body: string, field: string) => body.match(new RegExp(String.raw`^\s+${field}\s+(\S+)`, "m"))![1];
	const property = model("Property");
	for (const field of ["rent", "agencyFee", "legalFee", "cautionDeposit", "serviceCharge"]) {
		expect(type(property, field), `Property.${field}`).toMatch(/^Float\??$/);
	}
	expect(type(model("PriceHistory"), "rent"), "PriceHistory.rent").toBe("Float");

	const sql = readFileSync("prisma/migrations/20260929000000_money_columns_to_double/migration.sql", "utf8");
	expect(sql.match(/TYPE DOUBLE PRECISION/g)).toHaveLength(6);
});
