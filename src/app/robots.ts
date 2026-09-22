import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Keeps the gated consoles out of search results. Middleware already enforces
 * access, so this is about not leaking their URL structure into the index, not
 * about security.
 */
export default function robots(): MetadataRoute.Robots {
	return {
		rules: {
			userAgent: "*",
			allow: "/",
			disallow: [
				"/admin",
				"/agent",
				"/listing",
				"/api",
				"/settings",
				"/profile",
				"/favourites",
				"/saved-searches",
				"/my-house",
			],
		},
		sitemap: `${siteUrl()}/sitemap.xml`,
	};
}
