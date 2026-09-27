import { describe, expect, it } from "vitest";
import { isLikelyBot, lagosDay, viewerKey } from "./view-tracking";

const CHROME = "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36";

describe("lagosDay", () => {
	it("uses Lagos time (UTC+1), not UTC", () => {
		expect(lagosDay(new Date("2026-09-27T22:59:00Z"))).toBe("2026-09-27");
		expect(lagosDay(new Date("2026-09-27T23:30:00Z"))).toBe("2026-09-28");
	});
});

describe("viewerKey", () => {
	const base = { ip: "198.51.100.24", ua: CHROME, day: "2026-09-27", secret: "s3cret" };

	it("keys signed-in viewers by user id, ignoring IP and UA", () => {
		expect(viewerKey({ ...base, userId: "u1" })).toBe("u:u1");
		expect(viewerKey({ ...base, userId: "u1", ip: "203.0.113.9", ua: "other" })).toBe("u:u1");
	});

	it("is stable for the same guest within a day", () => {
		expect(viewerKey(base)).toBe(viewerKey({ ...base }));
		expect(viewerKey(base)).toMatch(/^a:[0-9a-f]{64}$/);
	});

	it("rotates daily and differs by IP, UA and secret", () => {
		const k = viewerKey(base);
		expect(viewerKey({ ...base, day: "2026-09-28" })).not.toBe(k);
		expect(viewerKey({ ...base, ip: "203.0.113.9" })).not.toBe(k);
		expect(viewerKey({ ...base, ua: `${CHROME} x` })).not.toBe(k);
		expect(viewerKey({ ...base, secret: "other" })).not.toBe(k);
	});

	it("never embeds the raw IP", () => {
		expect(viewerKey(base)).not.toContain(base.ip);
	});
});

describe("isLikelyBot", () => {
	it.each([
		"Googlebot/2.1 (+http://www.google.com/bot.html)",
		"Mozilla/5.0 (compatible; bingbot/2.0)",
		"facebookexternalhit/1.1",
		"WhatsApp/2.23.20.0",
		"Mozilla/5.0 HeadlessChrome/124.0",
		"",
		null,
	])("flags %j", (ua) => expect(isLikelyBot(ua)).toBe(true));

	it("passes a real mobile browser", () => expect(isLikelyBot(CHROME)).toBe(false));
});
