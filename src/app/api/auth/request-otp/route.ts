import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { requestOtpSchema } from "@/lib/validators/auth";
import { err, ok, zodErr, getClientIp } from "@/lib/api";
import { otpRequestLimiter, otpEmailCapLimiter, authIpLimiter } from "@/lib/ratelimit";
import { siteConfig } from "@/../config/site";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // IP-level shield (cheap, runs first) — the main defence against OTP abuse.
  const ipCheck = await authIpLimiter.limit(ip);
  if (!ipCheck.success) {
    return err("rate_limited", "Too many requests. Try again in a minute.", 429);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return err("bad_json", "Invalid JSON", 400);
  }

  const parsed = requestOtpSchema.safeParse(body);
  if (!parsed.success) return zodErr(parsed.error);

  const { email, purpose, name, agentOnly } = parsed.data;

  // SIGNUP: email must NOT already be registered
  // LOGIN:  email MUST be registered
  const existingUser = await db.user.findUnique({ where: { email } });

  if (purpose === "SIGNUP" && existingUser) {
    return err(
      "email_exists",
      "An account with this email already exists. Try signing in instead.",
      409
    );
  }
  if (purpose === "LOGIN" && !existingUser) {
    return err(
      "no_account",
      "No account found for this email. Sign up first.",
      404
    );
  }

  // Agent-portal gate: only VERIFIED IN_HOUSE agents may receive codes here
  if (agentOnly) {
    const isAgent =
      existingUser?.agentStatus === "VERIFIED" &&
      existingUser?.agentEmployment === "IN_HOUSE";
    if (!isAgent) {
      return err(
        "not_agent",
        `That account isn't a ${siteConfig.name} staff account. Use the main sign-in page.`,
        403
      );
    }
  }

  // Silent limits, checked after the account gates so a limited request is
  // indistinguishable from a normal one: same 200 body, no "too many codes"
  // message. Anyone can type a victim's address, so telling the caller (or the
  // victim) they are locked out would itself be the attack.
  //  1. email + IP, 5/hour: an attacker can only use up their own budget.
  //  2. email alone, 30/hour: the mail-bomb cap across many IPs. Checked second,
  //     so requests already blocked by (1) never use up the victim's shared cap.
  const pairCheck = await otpRequestLimiter.limit(`${email}:${ip}`);
  if (!pairCheck.success) {
    console.warn("[request-otp] per-email-and-IP limit reached; not sending");
    return ok({ sent: true, email });
  }
  const capCheck = await otpEmailCapLimiter.limit(email);
  if (!capCheck.success) {
    console.warn("[request-otp] per-email cap reached; not sending");
    return ok({ sent: true, email });
  }

  const code = await createOtp({
    email,
    purpose,
    userId: existingUser?.id,
  });

  try {
    await sendOtpEmail({
      to: email,
      code,
      purpose,
      name: name ?? existingUser?.name,
    });
  } catch (e) {
    console.error("[request-otp] email send failed:", e);
    return err("email_failed", "Could not send verification email. Try again shortly.", 502);
  }

  return ok({
    sent: true,
    email,
    // In dev, expose the code in the response so we can test without an inbox
    ...(process.env.NODE_ENV !== "production" ? { devCode: code } : {}),
  });
}
