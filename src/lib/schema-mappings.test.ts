import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("maps the property search column and composite index to their migration names", () => {
	const schema = readFileSync("prisma/schema.prisma", "utf8");
	expect(schema).toMatch(/searchVector\s+Unsupported\("tsvector"\)\?\s+@map\("search_vector"\)/);
	expect(schema).toContain('@@index([status, city, area, propertyType, bedrooms, rent], map: "Property_status_city_area_type_beds_rent_idx")');
});
