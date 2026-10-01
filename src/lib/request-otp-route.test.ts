import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
	ipLimit: vi.fn(), emailLimit: vi.fn(), capLimit: vi.fn(), findUnique: vi.fn(), createOtp: vi.fn(), sendOtpEmail: vi.fn(),
}));
vi.mock("@/lib/ratelimit", () => ({
	authIpLimiter: { limit: mocks.ipLimit },
	otpRequestLimiter: { limit: mocks.emailLimit },
	otpEmailCapLimiter: { limit: mocks.capLimit },
}));
vi.mock("@/lib/db", () => ({ db: { user: { findUnique: mocks.findUnique } } }));
vi.mock("@/lib/otp", () => ({ createOtp: mocks.createOtp }));
vi.mock("@/lib/email", () => ({ sendOtpEmail: mocks.sendOtpEmail }));
import { POST } from "../app/api/auth/request-otp/route";

const req = (body: unknown, ip = "198.51.100.7") =>
	new NextRequest("http://localhost/api/auth/request-otp", {
		method: "POST",
		body: JSON.stringify(body),
		headers: { "x-forwarded-for": ip },
	});
const login = { email: "victim@example.com", purpose: "LOGIN" };

beforeEach(() => {
	vi.resetAllMocks();
	vi.stubEnv("NODE_ENV", "production"); // no devCode in the body, so bodies compare exactly
	mocks.ipLimit.mockResolvedValue({ success: true });
	mocks.emailLimit.mockResolvedValue({ success: true });
	mocks.capLimit.mockResolvedValue({ success: true });
	mocks.findUnique.mockResolvedValue({ id: "u1", name: "Vic" });
	mocks.createOtp.mockResolvedValue("123456");
	mocks.sendOtpEmail.mockResolvedValue(undefined);
});

it("sends a code and reports success within the limits", async () => {
	const res = await POST(req(login));
	expect(res.status).toBe(200);
	expect(mocks.sendOtpEmail).toHaveBeenCalledTimes(1);
});

it("answers a per-email-limited request exactly like a normal one, but sends nothing", async () => {
	const normal = await POST(req(login));
	const normalBody = await normal.json();

	mocks.emailLimit.mockResolvedValue({ success: false });
	mocks.sendOtpEmail.mockClear();
	mocks.createOtp.mockClear();
	vi.spyOn(console, "warn").mockImplementation(() => {});
	const limited = await POST(req(login));

	expect(limited.status).toBe(normal.status);
	expect(await limited.json()).toEqual(normalBody);
	expect(mocks.createOtp).not.toHaveBeenCalled();
	expect(mocks.sendOtpEmail).not.toHaveBeenCalled();
});

it("never reveals a lockout in the response", async () => {
	mocks.emailLimit.mockResolvedValue({ success: false });
	vi.spyOn(console, "warn").mockImplementation(() => {});
	const res = await POST(req(login));
	expect(res.status).not.toBe(429);
	expect(JSON.stringify(await res.json())).not.toMatch(/rate|too many|wait|limit/i);
});

it("uses the IP limiter as the main defence: 429 before any email or account lookup", async () => {
	mocks.ipLimit.mockResolvedValue({ success: false });
	const res = await POST(req(login, "203.0.113.9"));
	expect(res.status).toBe(429);
	expect(mocks.ipLimit).toHaveBeenCalledWith("203.0.113.9");
	expect(mocks.emailLimit).not.toHaveBeenCalled();
	expect(mocks.findUnique).not.toHaveBeenCalled();
	expect(mocks.sendOtpEmail).not.toHaveBeenCalled();
});

it("only counts requests that would actually send: unknown addresses don't use the per-email budget", async () => {
	mocks.findUnique.mockResolvedValue(null);
	const res = await POST(req(login));
	expect(res.status).toBe(404);
	expect(mocks.emailLimit).not.toHaveBeenCalled();
});

it("keys the limiters on email+IP (5/h budget) and on email alone (30/h cap)", async () => {
	await POST(req(login, "203.0.113.9"));
	expect(mocks.emailLimit).toHaveBeenCalledWith("victim@example.com:203.0.113.9");
	expect(mocks.capLimit).toHaveBeenCalledWith("victim@example.com");
});

it("answers a cap-limited request exactly like a normal one, but sends nothing", async () => {
	const normalBody = await (await POST(req(login))).json();
	mocks.capLimit.mockResolvedValue({ success: false });
	mocks.sendOtpEmail.mockClear();
	vi.spyOn(console, "warn").mockImplementation(() => {});
	const limited = await POST(req(login));
	expect(limited.status).toBe(200);
	expect(await limited.json()).toEqual(normalBody);
	expect(mocks.sendOtpEmail).not.toHaveBeenCalled();
});

it("requests blocked by the email+IP limit don't use up the shared email cap", async () => {
	mocks.emailLimit.mockResolvedValue({ success: false });
	vi.spyOn(console, "warn").mockImplementation(() => {});
	await POST(req(login));
	expect(mocks.capLimit).not.toHaveBeenCalled();
});

it("an attacker exhausting their budget for a victim's email doesn't stop the victim's own request from another IP", async () => {
	// Stateful sliding-window stand-in: `max` hits per key, then blocked.
	const counters = new Map<string, number>();
	const window = (max: number) => async (key: string) => {
		const n = (counters.get(key) ?? 0) + 1;
		counters.set(key, n);
		return { success: n <= max };
	};
	mocks.emailLimit.mockImplementation(window(5));
	mocks.capLimit.mockImplementation(window(30));
	vi.spyOn(console, "warn").mockImplementation(() => {});

	for (let i = 0; i < 20; i++) await POST(req(login, "203.0.113.9")); // attacker hammers the victim's address
	expect(mocks.sendOtpEmail).toHaveBeenCalledTimes(5); // only their own 5/hour got through
	mocks.sendOtpEmail.mockClear();

	const victim = await POST(req(login, "198.51.100.77")); // the real owner, different IP
	expect(victim.status).toBe(200);
	expect(mocks.sendOtpEmail).toHaveBeenCalledTimes(1);
});

it("the email-alone cap still stops a many-IP flood", async () => {
	const counters = new Map<string, number>();
	const window = (max: number) => async (key: string) => {
		const n = (counters.get(key) ?? 0) + 1;
		counters.set(key, n);
		return { success: n <= max };
	};
	mocks.emailLimit.mockImplementation(window(5));
	mocks.capLimit.mockImplementation(window(30));
	vi.spyOn(console, "warn").mockImplementation(() => {});

	for (let i = 0; i < 40; i++) await POST(req(login, `203.0.113.${i}`)); // 40 distinct IPs, 1 request each
	expect(mocks.sendOtpEmail).toHaveBeenCalledTimes(30);
});
