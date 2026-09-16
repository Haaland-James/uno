/**
 * Brand-level link helpers, reading from `config/site.ts`.
 *
 * Distinct from `getWhatsAppLink()` in `@/lib/utils`, which builds links to a
 * *lister's* number pulled from the database. These build links to our own
 * support channels, so they live apart and read only from config.
 */
import { siteConfig } from "@/../config/site";

const TODO_PREFIX = "TODO:";

/** True while a config value is still an unfilled launch placeholder. */
export function isPlaceholder(value: string): boolean {
	return value.trimStart().startsWith(TODO_PREFIX);
}

/**
 * The usable part of a config value. Strips the `TODO:` marker so a
 * half-configured environment still renders something sane instead of a link
 * to the literal string "TODO:". Callers that need to *hide* an unset channel
 * should test `isPlaceholder()` first.
 */
export function resolve(value: string): string {
	return isPlaceholder(value)
		? value.trimStart().slice(TODO_PREFIX.length).trim()
		: value;
}

export function supportWhatsAppLink(message?: string): string {
	const digits = resolve(siteConfig.support.whatsapp).replace(/\D/g, "");
	const query = message ? `?text=${encodeURIComponent(message)}` : "";
	return `https://wa.me/${digits}${query}`;
}

export function supportTelLink(): string {
	return `tel:${resolve(siteConfig.support.phone).replace(/[^\d+]/g, "")}`;
}

export function supportMailto(subject?: string): string {
	const query = subject ? `?subject=${encodeURIComponent(subject)}` : "";
	return `mailto:${resolve(siteConfig.support.email)}${query}`;
}

/**
 * Absolute origin for metadata and sitemap generation. Prefers the deploy-time
 * env var so staging and production resolve to themselves; falls back to
 * config, then localhost for local builds.
 */
export function siteUrl(): string {
	const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
	if (fromEnv) return fromEnv.replace(/\/$/, "");

	const fromConfig = resolve(siteConfig.url);
	if (fromConfig.startsWith("http")) return fromConfig.replace(/\/$/, "");

	return "http://localhost:3000";
}

/** The six official social channels, in the order the Contact page lists them. */
export const SOCIAL_CHANNELS = [
	{ key: "instagram", label: "Instagram" },
	{ key: "whatsapp", label: "WhatsApp" },
	{ key: "facebook", label: "Facebook" },
	{ key: "tiktok", label: "TikTok" },
	{ key: "x", label: "X" },
	{ key: "linkedin", label: "LinkedIn" },
] as const satisfies ReadonlyArray<{
	key: keyof typeof siteConfig.socials;
	label: string;
}>;
