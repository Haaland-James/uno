import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_PRICE, propertyWizardSubmitSchema } from "@/lib/validators/property";
import { plainErrorMap } from "@/lib/validators/plain-errors";
import { listPropertyInitialData, useListPropertyStore, type ListPropertyData } from "@/stores/listPropertyStore";
import { useListingErrorsStore } from "@/stores/listingErrorsStore";
import { fieldProblem, isStepValid, stepProblems } from "./validation";
import { dropHiddenFields } from "./field-steps";
import { getSteps, type WizardKind } from "./steps";
import { BLUR_CHECK_DELAY_MS, checkFieldOnBlur } from "./field-check";

const draft = (over: Partial<ListPropertyData> = {}): ListPropertyData => ({ ...listPropertyInitialData, ...over });
const photos = Array.from({ length: 5 }, (_, i) => `https://images.unsplash.com/photo-${i}.jpg`);

// A draft the server accepts, per kind and objective.
function validDraft(kind: "RESIDENTIAL" | "COMMERCIAL" | "LAND", objective: "SELL" | "RENT" | "LEASE"): ListPropertyData {
	return draft({
		objective, role: "OWNER", propertyKind: kind,
		propertyType: { RESIDENTIAL: "FLAT", COMMERCIAL: "OFFICE", LAND: "RESIDENTIAL_PLOT" }[kind],
		state: "Akwa Ibom", lga: "Uyo", city: "Uyo", area: "Ewet", streetAddress: "1 Test Street",
		bedrooms: kind === "RESIDENTIAL" ? 2 : null, bathrooms: kind === "RESIDENTIAL" ? 2 : null,
		floorAreaSqm: kind === "COMMERCIAL" ? 120 : null, fitOutState: kind === "COMMERCIAL" ? "FITTED" : "",
		size: kind === "COMMERCIAL" ? 120 : null,
		plotSizeSqm: kind === "LAND" ? 450 : null, titleDocType: kind === "LAND" ? "C_OF_O" : "",
		condition: "GOOD", ownershipType: "FREEHOLD",
		photoUrls: photos,
		salePrice: objective === "SELL" ? 25_000_000 : null,
		rent: objective === "SELL" ? null : 1_500_000, minimumLease: objective === "SELL" ? "" : "1_YEAR",
		contactFirstName: "Ada", contactLastName: "Obi", contactEmail: "ada@example.com", contactPhone: "08012345678",
	});
}
const payload = (d: ListPropertyData) => ({ ...d, photos: d.photoUrls.map((url, i) => ({ url, isMain: i === d.mainPhotoIndex })) });
const flowOf = (d: ListPropertyData) => getSteps(d.objective, d.propertyKind as WizardKind, true).map((s) => s.key);

describe("a complete draft has no problems on any step (no false alarms)", () => {
	for (const kind of ["RESIDENTIAL", "COMMERCIAL", "LAND"] as const) {
		for (const objective of ["SELL", "RENT", "LEASE"] as const) {
			it(`${kind} / ${objective}`, () => {
				const d = { ...validDraft(kind, objective), offPlatformOwnerName: "Chief Udo", offPlatformOwnerPhone: "08099999999" };
				// The fixture itself is something the server accepts, so "no problems" means what it says.
				const server = propertyWizardSubmitSchema.safeParse(payload(d), { errorMap: plainErrorMap });
				expect(server.success, JSON.stringify(server.success ? "" : server.error.flatten().fieldErrors)).toBe(true);
				for (const step of flowOf(d)) expect(stepProblems(step, d), step).toEqual({});
			});
		}
	}
});

describe("stepProblems: every problem on the step, as field → sentence, top to bottom", () => {
	it("overview: choose an objective first; the role only once an objective is chosen", () => {
		expect(stepProblems("overview", draft())).toEqual({ objective: "Choose what you're listing" });
		expect(stepProblems("overview", draft({ objective: "SELL" }))).toEqual({ role: "Choose your role" });
		expect(stepProblems("overview", draft({ objective: "SELL", role: "OWNER" }))).toEqual({});
	});

	it("kind: choose a kind, then a type", () => {
		expect(stepProblems("kind", draft())).toEqual({ propertyKind: "Choose a property kind" });
		expect(stepProblems("kind", draft({ propertyKind: "LAND" }))).toEqual({ propertyType: "Choose a property type" });
	});

	it("an empty location step lists all four, in screen order", () => {
		const problems = stepProblems("location", draft());
		expect(Object.keys(problems)).toEqual(["state", "lga", "area", "streetAddress"]);
		expect(problems).toEqual({
			state: "Choose a state", lga: "Choose an LGA", area: "Enter the area", streetAddress: "Enter the street address",
		});
	});

	it("property info asks for bedrooms and bathrooms on a house, and for floor area and fit-out on commercial (never both)", () => {
		expect(stepProblems("property-info", draft({ propertyKind: "RESIDENTIAL" }))).toEqual({
			bedrooms: "Choose the number of bedrooms", bathrooms: "Choose the number of bathrooms",
		});
		expect(stepProblems("property-info", draft({ propertyKind: "COMMERCIAL" }))).toEqual({
			floorAreaSqm: "Enter the floor area", fitOutState: "Choose the fit-out state",
		});
	});

	it("land details: required fields, and a plot size with a decimal is refused with the server's sentence", () => {
		expect(stepProblems("land-details", draft({ propertyKind: "LAND" }))).toEqual({
			plotSizeSqm: "Enter the plot size", titleDocType: "Choose the title document",
		});
		expect(stepProblems("land-details", draft({ propertyKind: "LAND", titleDocType: "C_OF_O", plotSizeSqm: 450.5 }))).toEqual({
			plotSizeSqm: "Plot size must be a whole number",
		});
		expect(stepProblems("land-details", draft({ propertyKind: "LAND", titleDocType: "C_OF_O", plotSizeSqm: 0 }))).toEqual({
			plotSizeSqm: "Plot size must be more than zero",
		});
	});

	it("description: condition and ownership are required; a year built in the future gets the server's sentence", () => {
		const d = draft({ propertyKind: "RESIDENTIAL" });
		expect(stepProblems("description", d)).toEqual({ condition: "Choose the property condition", ownershipType: "Choose the ownership type" });
		const future = new Date().getFullYear() + 1;
		expect(stepProblems("description", { ...d, condition: "GOOD", ownershipType: "FREEHOLD", yearBuilt: future })).toEqual({
			yearBuilt: "Year built can't be in the future",
		});
	});

	it("photos: fewer than five", () => {
		expect(stepProblems("photos", draft({ propertyKind: "RESIDENTIAL", photoUrls: photos.slice(0, 3) }))).toEqual({ photos: "Add at least 5 photos" });
	});

	it("pricing: sale and rent each say what to do, and the limit uses the server's sentence", () => {
		expect(stepProblems("pricing", draft({ objective: "SELL", propertyKind: "RESIDENTIAL" }))).toEqual({ salePrice: "Enter a price" });
		expect(stepProblems("pricing", draft({ objective: "SELL", propertyKind: "RESIDENTIAL", salePrice: MAX_PRICE + 1 }))).toEqual({
			salePrice: "Maximum price is ₦1,000,000,000,000",
		});
		expect(stepProblems("pricing", draft({ objective: "RENT", propertyKind: "RESIDENTIAL", minimumLease: "1_YEAR" }))).toEqual({ rent: "Enter a price" });
		expect(stepProblems("pricing", draft({ objective: "RENT", propertyKind: "RESIDENTIAL", minimumLease: "1_YEAR", rent: 9_999 }))).toEqual({
			rent: "Price must be at least ₦10,000",
		});
		expect(stepProblems("pricing", draft({ objective: "RENT", propertyKind: "RESIDENTIAL", rent: 50_000 }))).toEqual({
			minimumLease: "Choose the minimum lease period",
		});
		// Land listings don't need a minimum lease; the sale-price field is absent from a rental.
		expect(stepProblems("pricing", draft({ objective: "RENT", propertyKind: "LAND", rent: 50_000 }))).toEqual({});
	});

	it("contact: names, a valid email and a phone", () => {
		expect(stepProblems("contact", draft())).toEqual({
			contactFirstName: "Enter your first name", contactLastName: "Enter your last name",
			contactEmail: "Enter a valid contact email", contactPhone: "Enter a valid contact phone number",
		});
		expect(stepProblems("contact", { ...validDraft("RESIDENTIAL", "SELL"), contactEmail: "nope" })).toEqual({ contactEmail: "Enter a valid contact email" });
	});

	it("owner (agents only): name and phone", () => {
		expect(stepProblems("owner", draft())).toEqual({
			offPlatformOwnerName: "Enter the owner's name", offPlatformOwnerPhone: "Enter a valid phone number for the owner",
		});
	});

	it("steps with nothing required have no problems", () => {
		expect(stepProblems("amenities", draft({ propertyKind: "RESIDENTIAL" }))).toEqual({});
		expect(stepProblems("lease-terms", draft({ objective: "RENT", propertyKind: "RESIDENTIAL" }))).toEqual({});
		expect(stepProblems("review", draft())).toEqual({});
	});

	it("isStepValid is exactly 'no problems', and an unknown step is never valid", () => {
		expect(isStepValid("location", draft())).toBe(false);
		expect(isStepValid("location", draft({ state: "Akwa Ibom", lga: "Uyo", area: "Ewet", streetAddress: "1 Test St" }))).toBe(true);
		expect(isStepValid("no-such-step", draft())).toBe(false);
	});

	it("never uses Zod's wording", () => {
		const all = ["overview", "kind", "location", "owner", "property-info", "land-details", "description", "photos", "pricing", "contact"].flatMap(
			(s) => Object.values(stepProblems(s, draft({ propertyKind: "COMMERCIAL", objective: "RENT" })))
		);
		for (const m of all) expect(m).not.toMatch(/Expected|received|Invalid|Required/);
	});
});

describe("fieldProblem", () => {
	it("an empty optional field has no problem", () => {
		expect(fieldProblem("yearBuilt", draft({ propertyKind: "RESIDENTIAL" }))).toBeNull();
		expect(fieldProblem("briefDescription", draft())).toBeNull();
		expect(fieldProblem("agencyFee", draft())).toBeNull();
	});
	it("an empty required field says what to do; a bad value gets the server's sentence", () => {
		expect(fieldProblem("streetAddress", draft())).toBe("Enter the street address");
		expect(fieldProblem("contactEmail", draft({ contactEmail: "nope" }))).toBe("Enter a valid contact email");
		expect(fieldProblem("plotSizeSqm", draft({ plotSizeSqm: 450.5 }))).toBe("Plot size must be a whole number");
	});
});

describe("hidden fields are dropped from what is sent (B27)", () => {
	const flow = (d: ListPropertyData, agent = false) => ({
		kind: d.propertyKind as WizardKind, objective: d.objective, flowKeys: getSteps(d.objective, d.propertyKind as WizardKind, agent).map((s) => s.key),
	});

	it("a house draft with a year, switched to land: the year is not sent, and the draft is untouched", () => {
		const d = draft({ ...validDraft("RESIDENTIAL", "SELL"), propertyKind: "LAND", yearBuilt: 2027, bedrooms: 3, condition: "GOOD" });
		const sent = dropHiddenFields(d, flow(d));
		expect(sent.yearBuilt).toBeNull();
		expect(sent.bedrooms).toBeNull();
		expect(sent.condition).toBe("");
		expect(d.yearBuilt).toBe(2027); // what the person sees is unchanged
		expect(d.bedrooms).toBe(3);
	});

	it("and the server then accepts it (a leftover future year was the refusal)", () => {
		const d = draft({ ...validDraft("LAND", "SELL"), yearBuilt: new Date().getFullYear() + 5, bedrooms: 3 });
		expect(propertyWizardSubmitSchema.safeParse(payload(d), { errorMap: plainErrorMap }).success).toBe(false);
		const sent = dropHiddenFields(d, flow(d));
		expect(propertyWizardSubmitSchema.safeParse(payload(sent), { errorMap: plainErrorMap }).success).toBe(true);
	});

	it("keeps everything the chosen kind shows", () => {
		const d = validDraft("LAND", "SELL");
		const sent = dropHiddenFields(d, flow(d));
		expect(sent.plotSizeSqm).toBe(450);
		expect(sent.titleDocType).toBe("C_OF_O");
		expect(sent.salePrice).toBe(25_000_000);
		expect(sent.state).toBe("Akwa Ibom");
		expect(sent.photoUrls).toEqual(photos); // not a validated field: passes through
	});

	it("commercial drops bedrooms/bathrooms; a house drops the commercial-only fields", () => {
		const c = draft({ ...validDraft("COMMERCIAL", "RENT"), bedrooms: 2, bathrooms: 2 });
		expect(dropHiddenFields(c, flow(c)).bedrooms).toBeNull();
		const h = draft({ ...validDraft("RESIDENTIAL", "RENT"), floorAreaSqm: 80, fitOutState: "SHELL", units: 3, floorLevel: "2nd" });
		const sent = dropHiddenFields(h, flow(h));
		expect([sent.floorAreaSqm, sent.fitOutState, sent.units, sent.floorLevel]).toEqual([null, "", null, ""]);
	});

	it("a sale drops the rent fields, a rental drops the sale fields", () => {
		const sell = draft({ ...validDraft("RESIDENTIAL", "SELL"), rent: 500_000, minimumLease: "1_YEAR", cautionDeposit: 1 });
		const s1 = dropHiddenFields(sell, flow(sell));
		expect([s1.rent, s1.minimumLease, s1.cautionDeposit, s1.salePrice]).toEqual([null, "", null, 25_000_000]);
		const rent = draft({ ...validDraft("RESIDENTIAL", "RENT"), salePrice: 9_000_000, titleDocuments: "x" });
		const s2 = dropHiddenFields(rent, flow(rent));
		expect([s2.salePrice, s2.titleDocuments, s2.rent]).toEqual([null, "", 1_500_000]);
	});

	it("someone who isn't an in-house agent doesn't send owner details; an agent does", () => {
		const d = draft({ ...validDraft("RESIDENTIAL", "SELL"), offPlatformOwnerName: "Chief Udo", offPlatformOwnerPhone: "08099999999" });
		expect(dropHiddenFields(d, flow(d, false)).offPlatformOwnerName).toBe("");
		expect(dropHiddenFields(d, flow(d, true)).offPlatformOwnerName).toBe("Chief Udo");
	});
});

describe("checking a field when it is left (B28)", () => {
	class FakeInput { type = "text"; }
	class FakeTextArea {}
	const input = () => new FakeInput() as unknown as EventTarget;
	const message = (field: string) => useListingErrorsStore.getState().errors[field];
	const setDraft = (d: ListPropertyData) => useListPropertyStore.setState({ data: d });
	const leave = async (field: string, target: EventTarget | null = input()) => {
		checkFieldOnBlur(field, target);
		await vi.advanceTimersByTimeAsync(BLUR_CHECK_DELAY_MS + 10);
	};

	beforeEach(() => {
		vi.useFakeTimers();
		vi.stubGlobal("HTMLInputElement", FakeInput);
		vi.stubGlobal("HTMLTextAreaElement", FakeTextArea);
		useListingErrorsStore.getState().clearAll();
	});
	afterEach(() => {
		vi.useRealTimers();
		vi.unstubAllGlobals();
		useListingErrorsStore.getState().clearAll();
	});

	it("shows the server's sentence under a wrong value, with the same words as a refused save", async () => {
		setDraft(validDraft("LAND", "SELL"));
		setDraft({ ...validDraft("LAND", "SELL"), plotSizeSqm: 450.5 });
		await leave("plotSizeSqm");
		expect(message("plotSizeSqm")).toBe("Plot size must be a whole number");
	});

	it("waits a beat before judging, so picking an option from a list doesn't flash a message", async () => {
		setDraft({ ...validDraft("RESIDENTIAL", "SELL"), area: "" });
		checkFieldOnBlur("area", input());
		expect(message("area")).toBeUndefined(); // not yet
		// the option is chosen before the beat is up
		setDraft({ ...validDraft("RESIDENTIAL", "SELL"), area: "Ewet" });
		await vi.advanceTimersByTimeAsync(BLUR_CHECK_DELAY_MS + 10);
		expect(message("area")).toBeUndefined();
	});

	it("clears the message once the value is right", async () => {
		setDraft({ ...validDraft("RESIDENTIAL", "SELL"), contactEmail: "nope" });
		await leave("contactEmail");
		expect(message("contactEmail")).toBe("Enter a valid contact email");
		setDraft({ ...validDraft("RESIDENTIAL", "SELL"), contactEmail: "ada@example.com" });
		await leave("contactEmail");
		expect(message("contactEmail")).toBeUndefined();
	});

	it("a required field left empty says what to do; an empty optional field says nothing", async () => {
		setDraft({ ...validDraft("RESIDENTIAL", "SELL"), streetAddress: "", yearBuilt: null });
		await leave("streetAddress");
		await leave("yearBuilt");
		expect(message("streetAddress")).toBe("Enter the street address");
		expect(message("yearBuilt")).toBeUndefined();
	});

	it("a too-large price says so as soon as the field is left", async () => {
		setDraft({ ...validDraft("RESIDENTIAL", "SELL"), salePrice: MAX_PRICE + 1 });
		await leave("salePrice");
		expect(message("salePrice")).toBe("Maximum price is ₦1,000,000,000,000");
	});

	it("only text inputs and text areas are checked: a select or a card waits for Continue", async () => {
		setDraft({ ...validDraft("RESIDENTIAL", "SELL"), streetAddress: "" });
		await leave("streetAddress", {} as EventTarget); // not an input
		await leave("streetAddress", null);
		const checkbox = new FakeInput(); checkbox.type = "checkbox";
		await leave("streetAddress", checkbox as unknown as EventTarget);
		expect(message("streetAddress")).toBeUndefined();
		await leave("streetAddress", new FakeTextArea() as unknown as EventTarget);
		expect(message("streetAddress")).toBe("Enter the street address");
	});

	it("never checks a field the chosen kind hides", async () => {
		setDraft({ ...validDraft("LAND", "SELL"), yearBuilt: new Date().getFullYear() + 5 });
		await leave("yearBuilt");
		expect(message("yearBuilt")).toBeUndefined();
	});

	it("never checks while typing: only leaving the field triggers a check", () => {
		setDraft({ ...validDraft("RESIDENTIAL", "SELL"), contactEmail: "nope" });
		useListPropertyStore.getState().updateData({ contactEmail: "nope@" });
		vi.advanceTimersByTime(BLUR_CHECK_DELAY_MS * 5);
		expect(message("contactEmail")).toBeUndefined();
	});

	it("editing a field clears its message", async () => {
		setDraft({ ...validDraft("RESIDENTIAL", "SELL"), contactEmail: "nope" });
		await leave("contactEmail");
		expect(message("contactEmail")).toBeDefined();
		useListPropertyStore.getState().updateData({ contactEmail: "ada@" });
		expect(message("contactEmail")).toBeUndefined();
	});
});
