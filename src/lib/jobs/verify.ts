import { Receiver } from "@upstash/qstash";

export type VerifyResult = { ok: true; body: string } | { ok: false; response: Response };

// One body for every failure: callers learn nothing about which check failed.
const unauthorized = (): VerifyResult => ({
	ok: false,
	response: Response.json({ error: "unauthorized" }, { status: 401 }),
});

/**
 * Check that a request really comes from our QStash schedule, before a job runs.
 * Middleware doesn't cover /api, so every /api/jobs/* route calls this first.
 *
 * Fails closed: missing signing keys, a missing `Upstash-Signature` header or a
 * bad signature all give a 401 and the job must not run. There is no dev bypass;
 * use `scripts/run-job.ts` to run a job locally.
 *
 * Returns the raw body, because the signature covers the exact bytes. Read it
 * here and JSON.parse it yourself — don't call req.json() afterwards.
 *
 * The Receiver is built inside the function: `next build` imports route modules
 * without secrets, so a module-level `new Receiver(...)` would throw.
 */
export async function verifyQStash(req: Request): Promise<VerifyResult> {
	const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
	const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
	if (!currentSigningKey || !nextSigningKey) {
		console.error("[jobs] QSTASH signing keys are not set; rejecting job request");
		return unauthorized();
	}

	const signature = req.headers.get("upstash-signature");
	if (!signature) return unauthorized();

	const body = await req.text();
	try {
		const receiver = new Receiver({ currentSigningKey, nextSigningKey });
		const valid = await receiver.verify({ signature, body });
		return valid ? { ok: true, body } : unauthorized();
	} catch {
		return unauthorized();
	}
}
