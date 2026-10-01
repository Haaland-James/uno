import { beforeEach, describe, expect, it, vi } from "vitest";

type Hist = {
	propertyId: string;
	rent: number;
	rentPeriod: "MONTH" | "YEAR";
	listingType: "RENT" | "LEASE" | "SALE";
	createdAt: Date;
};
type Prop = { id: string; title: string; area: string; city: string; landlordId: string; status: string; deletedAt: Date | null };
type User = { id: string; email: string; name: string | null; notifyPriceDrops: boolean; deactivatedAt: Date | null };

const state = vi.hoisted(() => ({
	hist: [] as Hist[],
	props: [] as Prop[],
	users: [] as User[],
	favs: [] as { userId: string; propertyId: string }[],
	kv: new Map<string, string>(),
	send: vi.fn(),
}));

// A small in-memory stand-in that honours exactly the filters the job uses, so the
// watermark and "price before the window" logic are exercised for real.
vi.mock("@/lib/db", () => ({
	db: {
		priceHistory: {
			findMany: async (a: {
				where: { createdAt: { gt?: Date; lte?: Date }; propertyId?: { in: string[] } };
				orderBy: { createdAt: "asc" | "desc" };
				take?: number;
				distinct?: string[];
			}) => {
				const { gt, lte } = a.where.createdAt;
				let rows = state.hist.filter(
					(h) =>
						(!gt || h.createdAt > gt) &&
						(!lte || h.createdAt <= lte) &&
						(!a.where.propertyId || a.where.propertyId.in.includes(h.propertyId)),
				);
				rows = [...rows].sort((x, y) =>
					a.orderBy.createdAt === "asc"
						? x.createdAt.getTime() - y.createdAt.getTime()
						: y.createdAt.getTime() - x.createdAt.getTime(),
				);
				if (a.distinct) {
					const seen = new Set<string>();
					rows = rows.filter((r) => (seen.has(r.propertyId) ? false : (seen.add(r.propertyId), true)));
				}
				return a.take ? rows.slice(0, a.take) : rows;
			},
		},
		property: {
			findMany: async (a: { where: { id: { in: string[] }; status: string; deletedAt: null } }) =>
				state.props.filter(
					(p) => a.where.id.in.includes(p.id) && p.status === a.where.status && p.deletedAt === null,
				),
		},
		favourite: {
			findMany: async (a: { where: { propertyId: { in: string[] }; user: { notifyPriceDrops: boolean; deactivatedAt: null } } }) =>
				state.favs
					.filter((f) => a.where.propertyId.in.includes(f.propertyId))
					.map((f) => ({ ...f, user: state.users.find((u) => u.id === f.userId)! }))
					.filter(
						(f) =>
							f.user.notifyPriceDrops === a.where.user.notifyPriceDrops &&
							f.user.deactivatedAt === a.where.user.deactivatedAt,
					),
		},
	},
}));
vi.mock("@/lib/redis", () => ({
	redis: {
		get: async (k: string) => state.kv.get(k) ?? null,
		set: async (k: string, v: string) => void state.kv.set(k, v),
	},
}));
// Keep the real renderers; replace only the Resend boundary.
vi.mock("@/lib/email/render", async (orig) => ({
	...(await orig<typeof import("@/lib/email/render")>()),
	sendEmail: state.send,
}));

import { runPriceDrop, isDrop, priceDropWatermarkKey } from "./price-drop";

const KEY = "jobs:price-drop:last-run:DEV";
const T0 = new Date("2026-10-01T10:00:00Z"); // last run
const IN_WINDOW = (m: number) => new Date(T0.getTime() + m * 60_000);
const NOW = IN_WINDOW(60);

const hist = (propertyId: string, rent: number, at: Date, over: Partial<Hist> = {}): Hist => ({
	propertyId,
	rent,
	rentPeriod: "YEAR",
	listingType: "RENT",
	createdAt: at,
	...over,
});

function seedListing(id = "p1", over: Partial<Prop> = {}) {
	state.props.push({
		id,
		title: `Flat ${id}`,
		area: "Lekki",
		city: "Lagos",
		landlordId: "lister",
		status: "ACTIVE",
		deletedAt: null,
		...over,
	});
}
function seedFan(userId = "u1", propertyId = "p1", over: Partial<User> = {}) {
	if (!state.users.some((u) => u.id === userId))
		state.users.push({ id: userId, email: `${userId}@example.test`, name: "Ada Obi", notifyPriceDrops: true, deactivatedAt: null, ...over });
	state.favs.push({ userId, propertyId });
}

beforeEach(() => {
	vi.stubEnv("NEXT_PUBLIC_APP_ENV", "DEV");
	state.hist = [];
	state.props = [];
	state.users = [];
	state.favs = [];
	state.kv = new Map([[KEY, T0.toISOString()]]);
	state.send.mockReset().mockResolvedValue({ id: "sent" });
	vi.spyOn(console, "error").mockImplementation(() => {});
});

const sentTo = () => state.send.mock.calls.map((c) => c[0].to);

describe("isDrop", () => {
	const base = { rent: 100, rentPeriod: "YEAR" as const, listingType: "RENT" as const };
	it("needs the same type and period and a lower rent", () => {
		expect(isDrop(base, { ...base, rent: 90 })).toBe(true);
		expect(isDrop(base, { ...base, rent: 100 })).toBe(false);
		expect(isDrop(base, { ...base, rent: 110 })).toBe(false);
		expect(isDrop(base, { ...base, rent: 10, listingType: "SALE" })).toBe(false);
		expect(isDrop(base, { ...base, rent: 10, rentPeriod: "MONTH" })).toBe(false);
	});
});

describe("watermark key", () => {
	it("is namespaced by upper-cased environment, defaulting to DEV", () => {
		vi.stubEnv("NEXT_PUBLIC_APP_ENV", "prod");
		expect(priceDropWatermarkKey()).toBe("jobs:price-drop:last-run:PROD");
		vi.stubEnv("NEXT_PUBLIC_APP_ENV", "");
		expect(priceDropWatermarkKey()).toBe("jobs:price-drop:last-run:DEV");
		vi.unstubAllEnvs();
		delete process.env.NEXT_PUBLIC_APP_ENV;
		expect(priceDropWatermarkKey()).toBe("jobs:price-drop:last-run:DEV");
	});

	it("keeps separate watermarks per environment in a shared store", async () => {
		seedListing();
		seedFan();
		state.hist = [hist("p1", 3_000_000, new Date("2026-09-01")), hist("p1", 2_000_000, IN_WINDOW(10))];
		state.kv = new Map([
			["jobs:price-drop:last-run:DEV", T0.toISOString()],
			["jobs:price-drop:last-run:PROD", T0.toISOString()],
		]);
		await runPriceDrop(NOW); // DEV run
		expect(state.kv.get("jobs:price-drop:last-run:DEV")).toBe(NOW.toISOString());
		expect(state.kv.get("jobs:price-drop:last-run:PROD")).toBe(T0.toISOString());

		vi.stubEnv("NEXT_PUBLIC_APP_ENV", "PROD");
		await runPriceDrop(NOW); // PROD still sees the window the DEV run covered
		expect(state.send).toHaveBeenCalledTimes(2);
		expect(state.kv.get("jobs:price-drop:last-run:PROD")).toBe(NOW.toISOString());
	});
});

describe("runPriceDrop", () => {
	it("first run only sets the watermark — no back-catalogue blast", async () => {
		state.kv.clear();
		seedListing();
		seedFan();
		state.hist = [hist("p1", 3_000_000, new Date("2026-09-01")), hist("p1", 2_000_000, new Date("2026-09-20"))];
		const s = await runPriceDrop(NOW);
		expect(s).toMatchObject({ firstRun: true, emailed: 0 });
		expect(state.kv.get(KEY)).toBe(NOW.toISOString());
		expect(state.send).not.toHaveBeenCalled();
	});

	it("emails a favouriter when the price drops", async () => {
		seedListing();
		seedFan();
		state.hist = [hist("p1", 3_000_000, new Date("2026-09-01")), hist("p1", 2_400_000, IN_WINDOW(10))];
		const s = await runPriceDrop(NOW);
		expect(s).toMatchObject({ drops: 1, recipients: 1, emailed: 1, failed: 0 });
		const mail = state.send.mock.calls[0][0];
		expect(mail.to).toBe("u1@example.test");
		expect(mail.html).toContain("₦3,000,000/yr");
		expect(mail.html).toContain("₦2,400,000/yr");
		expect(mail.html).toContain("₦600,000 (20%)");
		expect(mail.html).toContain("/property/p1");
		expect(mail.html).toContain("/settings");
	});

	it("does nothing for a price rise", async () => {
		seedListing();
		seedFan();
		state.hist = [hist("p1", 2_000_000, new Date("2026-09-01")), hist("p1", 2_500_000, IN_WINDOW(10))];
		expect((await runPriceDrop(NOW)).emailed).toBe(0);
		expect(state.send).not.toHaveBeenCalled();
	});

	it("does not treat rent <-> sale or a period change as a drop", async () => {
		seedListing("p1");
		seedListing("p2");
		seedFan("u1", "p1");
		seedFan("u1", "p2");
		state.hist = [
			hist("p1", 3_000_000, new Date("2026-09-01")),
			hist("p1", 100_000, IN_WINDOW(10), { listingType: "SALE" }),
			hist("p2", 3_000_000, new Date("2026-09-01")),
			hist("p2", 250_000, IN_WINDOW(10), { rentPeriod: "MONTH" }),
		];
		expect((await runPriceDrop(NOW)).emailed).toBe(0);
	});

	it("sends one alert for two drops in a window, from the price before the window to the last one", async () => {
		seedListing();
		seedFan();
		state.hist = [
			hist("p1", 3_000_000, new Date("2026-09-01")),
			hist("p1", 2_800_000, IN_WINDOW(5)),
			hist("p1", 2_500_000, IN_WINDOW(20)),
		];
		await runPriceDrop(NOW);
		expect(state.send).toHaveBeenCalledTimes(1);
		const { html } = state.send.mock.calls[0][0];
		expect(html).toContain("₦3,000,000/yr");
		expect(html).toContain("₦2,500,000/yr");
		expect(html).not.toContain("₦2,800,000");
	});

	it("sends nothing when a drop is reversed inside the window", async () => {
		seedListing();
		seedFan();
		state.hist = [hist("p1", 3_000_000, new Date("2026-09-01")), hist("p1", 2_000_000, IN_WINDOW(5)), hist("p1", 3_000_000, IN_WINDOW(20))];
		expect((await runPriceDrop(NOW)).emailed).toBe(0);
	});

	it("ignores a listing created inside the window (no earlier price to beat)", async () => {
		seedListing();
		seedFan();
		state.hist = [hist("p1", 3_000_000, IN_WINDOW(2)), hist("p1", 2_000_000, IN_WINDOW(10))];
		expect((await runPriceDrop(NOW)).emailed).toBe(0);
	});

	it("respects notifyPriceDrops, deactivation and the lister", async () => {
		seedListing();
		seedFan("off", "p1", { notifyPriceDrops: false });
		seedFan("gone", "p1", { deactivatedAt: new Date("2026-09-15") });
		seedFan("lister", "p1");
		seedFan("fan", "p1");
		state.hist = [hist("p1", 3_000_000, new Date("2026-09-01")), hist("p1", 2_000_000, IN_WINDOW(10))];
		await runPriceDrop(NOW);
		expect(sentTo()).toEqual(["fan@example.test"]);
	});

	it.each([
		["paused", { status: "PAUSED" }],
		["deleted", { deletedAt: new Date("2026-09-30") }],
	])("skips a %s listing", async (_label, over) => {
		seedListing("p1", over);
		seedFan();
		state.hist = [hist("p1", 3_000_000, new Date("2026-09-01")), hist("p1", 2_000_000, IN_WINDOW(10))];
		expect((await runPriceDrop(NOW)).emailed).toBe(0);
	});

	it("a second run right after finds nothing new", async () => {
		seedListing();
		seedFan();
		state.hist = [hist("p1", 3_000_000, new Date("2026-09-01")), hist("p1", 2_000_000, IN_WINDOW(10))];
		await runPriceDrop(NOW);
		expect(state.send).toHaveBeenCalledTimes(1);
		const again = await runPriceDrop(IN_WINDOW(75));
		expect(again).toMatchObject({ scanned: 0, emailed: 0 });
		expect(state.send).toHaveBeenCalledTimes(1);
	});

	it("moves the watermark before sending and survives a failed send", async () => {
		seedListing();
		seedFan("a");
		seedFan("b");
		state.hist = [hist("p1", 3_000_000, new Date("2026-09-01")), hist("p1", 2_000_000, IN_WINDOW(10))];
		state.send.mockImplementation(async (m: { to: string }) => {
			expect(state.kv.get(KEY)).toBe(NOW.toISOString());
			if (m.to.startsWith("a")) throw new Error("resend down");
			return { id: "ok" };
		});
		const s = await runPriceDrop(NOW);
		expect(s).toMatchObject({ emailed: 1, failed: 1 });
		expect(state.kv.get(KEY)).toBe(NOW.toISOString());
	});

	it("batches several drops for one user into one email", async () => {
		seedListing("p1");
		seedListing("p2");
		seedFan("u1", "p1");
		seedFan("u1", "p2");
		state.hist = [
			hist("p1", 3_000_000, new Date("2026-09-01")),
			hist("p2", 1_000_000, new Date("2026-09-01")),
			hist("p1", 2_000_000, IN_WINDOW(10)),
			hist("p2", 900_000, IN_WINDOW(11)),
		];
		await runPriceDrop(NOW);
		expect(state.send).toHaveBeenCalledTimes(1);
		const { html, subject } = state.send.mock.calls[0][0];
		expect(subject).toContain("2 homes");
		expect(html).toContain("/property/p1");
		expect(html).toContain("/property/p2");
	});

	it("formats a ₦6.5B → ₦5B sale with no period suffix", async () => {
		seedListing();
		seedFan();
		state.hist = [
			hist("p1", 6_500_000_000, new Date("2026-09-01"), { listingType: "SALE" }),
			hist("p1", 5_000_000_000, IN_WINDOW(10), { listingType: "SALE" }),
		];
		await runPriceDrop(NOW);
		const { html, text } = state.send.mock.calls[0][0];
		expect(html).toContain("₦6,500,000,000");
		expect(html).toContain("₦5,000,000,000");
		expect(html).toContain("₦1,500,000,000 (23%)");
		expect(html).not.toContain("/yr");
		expect(text).not.toContain("/yr");
	});

	it("escapes listing text in the email", async () => {
		seedListing("p1", { title: `<img src=x onerror=alert(1)>`, area: `A&B` });
		seedFan("u1", "p1", { name: `<b>Ada</b>` });
		state.hist = [hist("p1", 3_000_000, new Date("2026-09-01")), hist("p1", 2_000_000, IN_WINDOW(10))];
		await runPriceDrop(NOW);
		const { html } = state.send.mock.calls[0][0];
		expect(html).not.toContain("<img src=x");
		expect(html).toContain("&lt;img src=x");
		expect(html).toContain("A&amp;B");
		expect(html).not.toContain("<b>Ada</b>");
	});
});
