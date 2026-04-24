import bcrypt from "bcryptjs";
import { db } from "./db";
import { OtpPurpose } from "@prisma/client";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_VERIFY_ATTEMPTS = 5;

function generateCode(): string {
  // 6-digit code, leading zeros allowed
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

interface CreateOtpInput {
  email: string;
  purpose: OtpPurpose;
  userId?: string;
}

/** Generate, hash, and store an OTP. Returns the plaintext code (to be emailed). */
export async function createOtp({ email, purpose, userId }: CreateOtpInput) {
  const code = generateCode();
  const codeHash = await bcrypt.hash(code, 10);

  // Invalidate any existing un-consumed OTPs for the same (email, purpose)
  await db.otpCode.updateMany({
    where: { email, purpose, consumedAt: null },
    data: { consumedAt: new Date() },
  });

  await db.otpCode.create({
    data: {
      email,
      purpose,
      userId: userId ?? null,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  });

  return code;
}

interface VerifyOtpInput {
  email: string;
  purpose: OtpPurpose;
  code: string;
}

interface VerifyOtpResult {
  ok: boolean;
  reason?: "no_code" | "expired" | "consumed" | "too_many_attempts" | "wrong_code";
  otpId?: string;
  userId?: string | null;
}

/** Verify an OTP. On success, marks it consumed. */
export async function verifyOtp({ email, purpose, code }: VerifyOtpInput): Promise<VerifyOtpResult> {
  const otp = await db.otpCode.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) return { ok: false, reason: "no_code" };
  if (otp.consumedAt) return { ok: false, reason: "consumed" };
  if (otp.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (otp.attempts >= MAX_VERIFY_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const matches = await bcrypt.compare(code, otp.codeHash);

  if (!matches) {
    await db.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "wrong_code" };
  }

  await db.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  return { ok: true, otpId: otp.id, userId: otp.userId };
}

/** Sweep expired/consumed OTPs older than 24h. Run via cron or on-demand. */
export async function pruneOldOtps() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return db.otpCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: cutoff } },
        { consumedAt: { not: null, lt: cutoff } },
      ],
    },
  });
}
