import { NextResponse } from "next/server";
import type { ZodError } from "zod";

type ApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function err(code: string, message: string, status: number, details?: unknown) {
  const body: { error: ApiError } = { error: { code, message, ...(details ? { details } : {}) } };
  return NextResponse.json(body, { status });
}

export function zodErr(error: ZodError) {
  return err("validation_error", "Invalid request", 400, error.flatten());
}

// Trusts x-forwarded-for, which is safe on Vercel (the platform overwrites it)
// but NOT behind a self-managed proxy. When we move to the VPS, the reverse
// proxy (nginx/caddy) MUST strip and re-set this header, or every IP-based
// rate limit in src/lib/ratelimit.ts becomes spoofable.
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
