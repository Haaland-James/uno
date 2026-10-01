import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
	searchFindMany: vi.fn(),
	propertyFindMany: vi.fn(),
	sendEmail: vi.fn(),
	searchUpdateMany: vi.fn(),
	searchUpdate: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
	db: {
		savedSearch: { findMany: mocks.searchFindMany, updateMany: mocks.searchUpdateMany, update: mocks.searchUpdate },
		property: { findMany: mocks.propertyFindMany },
	},
}));
// Keep the real template helpers (escaping, shell) and replace only the network send.
vi.mock("@/lib/email/render", async (importOriginal) => ({
	...(await importOriginal<typeof import("@/lib/email/render")>()),
	sendEmail: mocks.sendEmail,
}));
import { deliverSavedSearchMatches } from "./saved-search-delivery";
import { formatListingPrice } from "@/lib/email/saved-search-matches";

const user = (over = {}) => ({ id: "u1", name: "Ada", email: "ada@example.com", notifyNewProperties: true, deactivatedAt: null, ...over });
const search = (over: Record<string, unknown> = {}) => ({
	id: "s1", name: "2-bed in Uyo", criteria: { v: 1, category: "rent" },
	notifyEmail: true, notifyInstant: true, user: user(), ...over,
});
const listing = (id: string, over = {}) => ({
	id, title: `Flat ${id}`, area: "Ewet", city: "Uyo", rent: 1_500_000, rentPeriod: "YEAR", listingType: "RENT",
	photos: [{ url: `https://images.unsplash.com/${id}.jpg` }], ...over,
});
const result = (searchId: string, ids: string[], userId = "u1") => ({ searchId, userId, newListingIds: ids });

beforeEach(() => {
	vi.resetAllMocks();
	vi.spyOn(console, "error").mockImplementation(() => {});
	mocks.sendEmail.mockResolvedValue({});
	mocks.searchFindMany.mockResolvedValue([search()]);
	mocks.propertyFindMany.mockResolvedValue([listing("p1"), listing("p2")]);
});
afterEach(() => vi.restoreAllMocks());

const sentHtml = () => mocks.sendEmail.mock.calls[0][0].html as string;

describe("deliverSavedSearchMatches", () => {
	it("sends one email for a search with new matches", async () => {
		const summary = await deliverSavedSearchMatches([result("s1", ["p1", "p2"])]);
		expect(summary).toEqual({ users: 1, emailed: 1, failed: 0, skipped: 0 });
		const mail = mocks.sendEmail.mock.calls[0][0];
		expect(mail.to).toBe("ada@example.com");
		expect(mail.subject).toBe('2 new homes matching "2-bed in Uyo"');
		expect(mail.html).toContain("Flat p1");
		expect(mail.html).toContain("/property/p2");
		expect(mail.html).toContain("/settings"); // every notification email links to the settings page
	});

	it.each([
		["the search has email off", { notifyEmail: false }],
		["the search has instant off", { notifyInstant: false }],
		["the user turned off new-property notifications", { user: user({ notifyNewProperties: false }) }],
		["the user is deactivated", { user: user({ deactivatedAt: new Date() }) }],
		["the user has no email", { user: user({ email: "" }) }],
	])("sends nothing when %s", async (_label, over) => {
		mocks.searchFindMany.mockResolvedValue([search(over)]);
		const summary = await deliverSavedSearchMatches([result("s1", ["p1"])]);
		expect(mocks.sendEmail).not.toHaveBeenCalled();
		expect(summary).toMatchObject({ users: 1, emailed: 0, skipped: 1 });
	});

	it("never writes to saved searches: the badge and watermark belong to the matcher", async () => {
		mocks.sendEmail.mockRejectedValue(new Error("resend down"));
		await deliverSavedSearchMatches([result("s1", ["p1"])]);
		expect(mocks.searchUpdateMany).not.toHaveBeenCalled();
		expect(mocks.searchUpdate).not.toHaveBeenCalled();
	});

	it("puts two searches of one user in one email", async () => {
		mocks.searchFindMany.mockResolvedValue([search(), search({ id: "s2", name: "Land in Eket" })]);
		mocks.propertyFindMany.mockResolvedValue([listing("p1"), listing("p9")]);
		const summary = await deliverSavedSearchMatches([result("s1", ["p1"]), result("s2", ["p9"])]);
		expect(mocks.sendEmail).toHaveBeenCalledTimes(1);
		expect(summary.emailed).toBe(1);
		const mail = mocks.sendEmail.mock.calls[0][0];
		expect(mail.subject).toBe("2 new homes matching your saved searches");
		expect(mail.html).toContain("2-bed in Uyo");
		expect(mail.html).toContain("Land in Eket");
	});

	it("sends separate emails to different users", async () => {
		mocks.searchFindMany.mockResolvedValue([search(), search({ id: "s2", user: user({ id: "u2", email: "bo@example.com" }) })]);
		await deliverSavedSearchMatches([result("s1", ["p1"]), result("s2", ["p2"], "u2")]);
		expect(mocks.sendEmail.mock.calls.map((c) => c[0].to).sort()).toEqual(["ada@example.com", "bo@example.com"]);
	});

	it("a failed send doesn't throw, is counted, and doesn't stop the next user", async () => {
		mocks.searchFindMany.mockResolvedValue([search(), search({ id: "s2", user: user({ id: "u2", email: "bo@example.com" }) })]);
		mocks.sendEmail.mockRejectedValueOnce(new Error("resend down")).mockResolvedValueOnce({});
		const summary = await deliverSavedSearchMatches([result("s1", ["p1"]), result("s2", ["p2"], "u2")]);
		expect(summary).toMatchObject({ users: 2, emailed: 1, failed: 1 });
		expect(mocks.sendEmail).toHaveBeenCalledTimes(2);
	});

	it("shows at most 5 listings per search, and 'See all N' with the true total", async () => {
		const ids = Array.from({ length: 12 }, (_, i) => `p${i + 1}`);
		mocks.propertyFindMany.mockResolvedValue(ids.map((id) => listing(id)));
		await deliverSavedSearchMatches([result("s1", ids)]);
		const html = sentHtml();
		expect(html).toContain("/property/p5");
		expect(html).not.toContain("/property/p6");
		expect(html).toContain("See all 12");
		expect(mocks.sendEmail.mock.calls[0][0].subject).toContain("12 new homes");
		// only the listings that are shown get loaded, and only live ones
		const where = mocks.propertyFindMany.mock.calls[0][0].where;
		expect(where.id.in).toEqual(["p1", "p2", "p3", "p4", "p5"]);
		expect(where).toMatchObject({ status: "ACTIVE", deletedAt: null });
	});

	it("skips a user whose shown listings have all been paused since", async () => {
		mocks.propertyFindMany.mockResolvedValue([]);
		const summary = await deliverSavedSearchMatches([result("s1", ["p1"])]);
		expect(mocks.sendEmail).not.toHaveBeenCalled();
		expect(summary).toMatchObject({ emailed: 0, skipped: 1 });
	});

	it("escapes the search name and listing text so one user can't inject markup into another's inbox", async () => {
		mocks.searchFindMany.mockResolvedValue([search({ name: '<script>alert(1)</script> "x"' })]);
		mocks.propertyFindMany.mockResolvedValue([
			listing("p1", {
				title: "<img src=x onerror=alert(1)>",
				area: "<b>Ewet</b>",
				photos: [{ url: 'https://x.test/a.jpg"onerror="alert(1)' }],
			}),
		]);
		await deliverSavedSearchMatches([result("s1", ["p1"])]);
		const html = sentHtml();
		expect(html).not.toContain("<script>");
		expect(html).not.toContain("<img src=x");
		expect(html).not.toContain("<b>Ewet</b>");
		expect(html).not.toContain('"onerror="'); // the photo URL's quote can't break out of the attribute
		expect(html).toContain("&lt;script&gt;");
	});

	it("drops a non-https photo instead of embedding it", async () => {
		mocks.propertyFindMany.mockResolvedValue([listing("p1", { photos: [{ url: "javascript:alert(1)" }] })]);
		await deliverSavedSearchMatches([result("s1", ["p1"])]);
		expect(sentHtml()).not.toContain("javascript:");
		expect(sentHtml()).not.toContain("<img");
	});

	it("does nothing for an empty run", async () => {
		expect(await deliverSavedSearchMatches([])).toEqual({ users: 0, emailed: 0, failed: 0, skipped: 0 });
		expect(mocks.searchFindMany).not.toHaveBeenCalled();
	});
});

describe("prices in the email", () => {
	it("formats a ₦6.5B sale without a period suffix", () => {
		const text = formatListingPrice({ listingType: "SALE", rent: 6_500_000_000, rentPeriod: "YEAR" });
		expect(text).toContain("6,500,000,000");
		expect(text).not.toMatch(/\/(yr|mo)/);
	});
	it("keeps the period on rent and lease", () => {
		expect(formatListingPrice({ listingType: "RENT", rent: 1_500_000, rentPeriod: "YEAR" })).toMatch(/1,500,000\/yr$/);
		expect(formatListingPrice({ listingType: "LEASE", rent: 120_000, rentPeriod: "MONTH" })).toMatch(/120,000\/mo$/);
	});
});
