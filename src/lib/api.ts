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

export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const hops = xff.split(",").map((hop) => hop.trim()).filter(Boolean);
    const lastHop = hops.at(-1);
    if (lastHop) return lastHop;
  }
  return req.headers.get("x-real-ip") || "unknown";
}
