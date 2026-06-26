import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { ok, err, zodErr } from "@/lib/api";
import { profileUpdateSchema } from "@/lib/validators/user";

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  phone: true,
  phoneVerified: true,
  gender: true,
  address: true,
  photo: true,
  role: true,
  passwordHash: true,
  language: true,
  notifyNewProperties: true,
  notifyPriceDrops: true,
  notifyWeeklyDigest: true,
  createdAt: true,
  updatedAt: true,
} as const;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in to view your profile", 401);
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: PROFILE_SELECT,
  });

  if (!user) {
    return err("not_found", "User not found", 404);
  }

  const { passwordHash, ...rest } = user;
  return ok({ ...rest, hasPassword: !!passwordHash });
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return err("unauthorized", "Sign in to update your profile", 401);
  }

  const body = await req.json().catch(() => null);
  if (!body) {
    return err("bad_request", "Invalid JSON body", 400);
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return zodErr(parsed.error);
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) {
    data.name = parsed.data.name;
  }
  if (parsed.data.gender !== undefined) {
    data.gender = parsed.data.gender;
  }
  if (parsed.data.address !== undefined) {
    data.address = parsed.data.address || null;
  }
  if (parsed.data.photo !== undefined) {
    data.photo = parsed.data.photo || null;
  }
  if (parsed.data.language !== undefined) {
    data.language = parsed.data.language;
  }
  if (parsed.data.phone !== undefined) {
    const newPhone = parsed.data.phone || null;
    const current = await db.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    });
    data.phone = newPhone;
    if (current?.phone !== newPhone) {
      data.phoneVerified = false;
    }
  }

  if (Object.keys(data).length === 0) {
    return err("bad_request", "No fields to update", 400);
  }

  const updated = await db.user.update({
    where: { id: session.user.id },
    data,
    select: PROFILE_SELECT,
  });

  const { passwordHash: _ph, ...updatedRest } = updated;
  return ok({ ...updatedRest, hasPassword: !!_ph });
}
