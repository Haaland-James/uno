import { existsSync } from "node:fs";
import { expect, it } from "vitest";

it("does not expose the unused search API stub", () => {
	expect(existsSync("src/app/api/search/route.ts")).toBe(false);
});
