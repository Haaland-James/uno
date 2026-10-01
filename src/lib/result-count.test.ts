import { describe, expect, it } from "vitest";
import { describeKindContext, resultNoun } from "./result-count";

describe("describeKindContext", () => {
	it("names the kind of a commercial filter, whether it is the legacy value or a specific type", () => {
		expect(describeKindContext(["COMMERCIAL"])).toBe("commercial");
		expect(describeKindContext(["OFFICE", "SHOP"])).toBe("commercial");
	});
	it("names land and residential filters", () => {
		expect(describeKindContext(["LAND"])).toBe("land");
		expect(describeKindContext(["RESIDENTIAL_PLOT"])).toBe("land");
		expect(describeKindContext(["FLAT", "DUPLEX"])).toBe("residential");
	});
	it("says nothing when there is no filter, the kinds are mixed, or the types are unknown", () => {
		expect(describeKindContext([])).toBeNull();
		expect(describeKindContext(["FLAT", "OFFICE"])).toBeNull();
		expect(describeKindContext(["NOT_A_TYPE"])).toBeNull();
	});
});

describe("resultNoun", () => {
	it("keeps the existing wording when nothing is filtered", () => {
		expect(resultNoun(9)).toBe("properties");
		expect(resultNoun(1)).toBe("property");
		expect(resultNoun(0)).toBe("properties");
	});
	it("names the kind: '9 commercial properties listed for rent'", () => {
		expect(`9 ${resultNoun(9, { kindContext: "commercial" })} listed for rent`).toBe("9 commercial properties listed for rent");
	});
	it("keeps singular and plural right: '1 commercial property'", () => {
		expect(resultNoun(1, { kindContext: "commercial" })).toBe("commercial property");
		expect(resultNoun(1, { kindContext: "land" })).toBe("land property");
	});
	it("puts a sort context first: '20 latest commercial properties'", () => {
		expect(resultNoun(20, { sortContext: "Latest", kindContext: "commercial" })).toBe("latest commercial properties");
		expect(resultNoun(20, { sortContext: "Hot" })).toBe("hot properties");
	});
});
