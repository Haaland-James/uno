import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

/**
 * Static routes only.
 *
 * Property and agent pages are deliberately left out for now: there are
 * thousands of listings, they change constantly, and generating them here
 * would mean a database query on every sitemap fetch. They want their own
 * paginated sitemap index, which is a separate piece of work.
 */
export default function sitemap(): MetadataRoute.Sitemap {
	const base = siteUrl();
	const now = new Date();

	const routes: Array<{
		path: string;
		changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
		priority: number;
	}> = [
		{ path: "/", changeFrequency: "daily", priority: 1 },
		{ path: "/properties/rent", changeFrequency: "daily", priority: 0.9 },
		{ path: "/properties/sale", changeFrequency: "daily", priority: 0.9 },
		{ path: "/properties/lease", changeFrequency: "daily", priority: 0.8 },
		{ path: "/contact", changeFrequency: "yearly", priority: 0.5 },
		{ path: "/terms", changeFrequency: "yearly", priority: 0.3 },
		{ path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
		{ path: "/cookies", changeFrequency: "yearly", priority: 0.3 },
	];

	return routes.map(({ path, changeFrequency, priority }) => ({
		url: `${base}${path}`,
		lastModified: now,
		changeFrequency,
		priority,
	}));
}
