import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { ok, err } from "@/lib/api";
import { uploadSignLimiter } from "@/lib/ratelimit";

// Signed into the upload params — Cloudinary rejects any file that doesn't
// decode as one of these formats, regardless of extension or Content-Type.
// Must be sent verbatim by the client alongside the signature.
const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif,heic";

/**
 * Returns Cloudinary signed-upload params so the browser can upload directly to Cloudinary
 * without proxying file bytes through our API. Caller posts to
 * `https://api.cloudinary.com/v1_1/{cloudName}/image/upload` with FormData containing
 * `{file, api_key, timestamp, signature, folder}` and gets back `{secure_url, ...}`.
 */
export async function POST(req: NextRequest) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return err("unauthorized", "Sign in to upload photos", 401);
	}

	const rl = await uploadSignLimiter.limit(session.user.id);
	if (!rl.success) {
		return err("rate_limited", "You've uploaded a lot of photos recently — try again later.", 429);
	}

	const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
	const apiKey = process.env.CLOUDINARY_API_KEY;
	const apiSecret = process.env.CLOUDINARY_API_SECRET;
	if (!cloudName || !apiKey || !apiSecret) {
		return err("config_error", "Image uploads are not configured", 500);
	}

	const body = await req.json().catch(() => ({}));
	const type = body?.type === "avatar" ? "avatars" : "listings";

	const timestamp = Math.floor(Date.now() / 1000);
	const folder = `uno/${type}/${session.user.id}`;

	const signature = cloudinary.utils.api_sign_request(
		{ timestamp, folder, allowed_formats: ALLOWED_FORMATS },
		apiSecret
	);

	return ok({
		signature,
		timestamp,
		apiKey,
		cloudName,
		folder,
		allowedFormats: ALLOWED_FORMATS,
	});
}
