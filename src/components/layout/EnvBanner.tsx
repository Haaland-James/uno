"use client";

import { usePathname } from "next/navigation";
import { envBannerLabel } from "@/lib/app-env";

/**
 * One slim bar above every public page on non-production deployments, so demo
 * data is never mistaken for the live site. Admin and agent consoles already
 * carry an environment badge in their own headers, so they are skipped.
 */
export function EnvBanner() {
	const pathname = usePathname() ?? "";
	const label = envBannerLabel(process.env.NEXT_PUBLIC_APP_ENV);
	if (!label) return null;
	if (/^\/(admin|agent)(\/|$)/.test(pathname)) return null;

	return (
		<div
			role="status"
			// h-6 must match --env-banner-h set on <body> in app/layout.tsx: full-height
			// pages subtract it so the bar doesn't add a page scroll.
			className="flex h-6 w-full items-center justify-center truncate bg-amber-100 px-3 text-center text-[11px] font-semibold tracking-wide text-amber-800 md:text-xs"
		>
			{label}
		</div>
	);
}
