import { createHash, createHmac, randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyQStash } from "./verify";

const CURRENT = "current-signing-key-for-tests";
const NEXT = "next-signing-key-for-tests";
const URL_ = "https://staging-uno.example.com/api/jobs/demo";

const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");

// What QStash does: an HS256 JWT over the request, with a hash of the exact body.
// Built by hand so the test doesn't depend on a JWT library of its own.
function sign(body: string, key: string, over: { exp?: number } = {}) {
	const now = Math.floor(Date.now() / 1000);
	const unsigned = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({
		iss: "Upstash",
		sub: URL_,
		iat: now,
		nbf: now - 5,
		exp: over.exp ?? now + 300,
		jti: randomUUID(),
		body: createHash("sha256").update(body).digest("base64url"),
	})}`;
	return `${unsigned}.${createHmac("sha256", key).update(unsigned).digest("base64url")}`;
}

const request = (body: string, signature?: string) =>
	new Request(URL_, {
		method: "POST",
		body,
		headers: signature ? { "Upstash-Signature": signature } : {},
	});

async function expect401(result: Awaited<ReturnType<typeof verifyQStash>>) {
	expect(result.ok).toBe(false);
	if (result.ok) return;
	expect(result.response.status).toBe(401);
	expect(await result.response.json()).toEqual({ error: "unauthorized" });
}

beforeEach(() => {
	vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", CURRENT);
	vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", NEXT);
	vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => {
	vi.unstubAllEnvs();
	vi.restoreAllMocks();
});

describe("verifyQStash", () => {
	const body = JSON.stringify({ hello: "world" });

	it("returns the raw body for a valid signature (current key)", async () => {
		const result = await verifyQStash(request(body, sign(body, CURRENT)));
		expect(result).toEqual({ ok: true, body });
	});

	it("also accepts the next key, so key rotation doesn't break the schedule", async () => {
		const result = await verifyQStash(request(body, sign(body, NEXT)));
		expect(result).toEqual({ ok: true, body });
	});

	it("accepts an empty body, which QStash sends for schedules without a payload", async () => {
		const result = await verifyQStash(request("", sign("", CURRENT)));
		expect(result).toEqual({ ok: true, body: "" });
	});

	it.each([
		["current", "QSTASH_CURRENT_SIGNING_KEY"],
		["next", "QSTASH_NEXT_SIGNING_KEY"],
	])("401 when the %s signing key is missing, even with a valid signature", async (_n, name) => {
		const signature = sign(body, CURRENT);
		vi.stubEnv(name, "");
		await expect401(await verifyQStash(request(body, signature)));
	});

	it("401 when both signing keys are unset", async () => {
		vi.stubEnv("QSTASH_CURRENT_SIGNING_KEY", "");
		vi.stubEnv("QSTASH_NEXT_SIGNING_KEY", "");
		await expect401(await verifyQStash(request(body, sign(body, CURRENT))));
	});

	it("401 when the Upstash-Signature header is missing", async () => {
		await expect401(await verifyQStash(request(body)));
	});

	it("401 for a garbage signature", async () => {
		await expect401(await verifyQStash(request(body, "not-a-jwt")));
	});

	it("401 for a signature made with the wrong key", async () => {
		await expect401(await verifyQStash(request(body, sign(body, "some-other-key"))));
	});

	it("401 when the body was changed after signing", async () => {
		const signature = sign(body, CURRENT);
		await expect401(await verifyQStash(request(JSON.stringify({ hello: "attacker" }), signature)));
	});

	it("401 for an expired signature", async () => {
		const signature = sign(body, CURRENT, { exp: Math.floor(Date.now() / 1000) - 60 });
		await expect401(await verifyQStash(request(body, signature)));
	});
});
