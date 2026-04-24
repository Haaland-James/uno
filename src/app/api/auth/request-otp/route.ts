import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { createOtp } from "@/lib/otp";
import { sendOtpEmail } from "@/lib/email";
import { requestOtpSchema } from "@/lib/validators/auth";
import { err, ok, zodErr, getClientIp } from "@/lib/api";
import { otpRequestLimiter, authIpLimiter } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  // IP-level shield (cheap, runs first)
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

  const { email, purpose, name } = parsed.data;

  // Per-email rate limit
  const emailCheck = await otpRequestLimiter.limit(email);
  if (!emailCheck.success) {
    return err(
      "otp_rate_limited",
      "You've requested too many codes. Please wait an hour before trying again.",
      429
    );
  }

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
