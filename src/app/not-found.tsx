import Link from "next/link";
import { Logo } from "@/components/shared/Logo";
import { siteConfig } from "@/../config/site";

/**
 * Branded 404. Before this existed, any dead link — and the footers carried
 * several — landed on Next's unstyled default page.
 *
 * Deliberately standalone rather than inside a route group: not-found.tsx at
 * the app root catches misses across every segment, including ones whose
 * group layout needs data it can't fetch for a route that doesn't exist.
 */
export default function NotFound() {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
			<Logo href="/" className="h-8 w-auto" />

			<p className="mt-10 text-[13px] font-semibold uppercase tracking-[0.12em] text-content-secondary">
				Error 404
			</p>
			<h1 className="mt-2 text-[26px] font-semibold text-content-primary md:text-[32px]">
				We couldn&rsquo;t find that page
			</h1>
			<p className="mt-3 max-w-[46ch] text-[15px] leading-[1.7] text-content-secondary">
				The link may be out of date, or the listing may have been taken down. Let
				us point you somewhere useful.
			</p>

			<div className="mt-8 flex flex-col gap-3 sm:flex-row">
				<Link
					href="/properties/rent"
					className="flex min-h-[48px] items-center justify-center rounded-button bg-uno-red px-6 text-[15px] font-semibold text-white transition-colors hover:bg-uno-red-hover"
				>
					Browse properties
				</Link>
				<Link
					href="/"
					className="flex min-h-[48px] items-center justify-center rounded-button border border-black/15 px-6 text-[15px] font-semibold text-content-primary transition-colors hover:bg-black/[0.04]"
				>
					Go to homepage
				</Link>
			</div>

			<p className="mt-10 text-[14px] text-content-secondary">
				Think something is broken?{" "}
				<Link
					href="/contact"
					className="font-medium text-uno-red underline underline-offset-2"
				>
					Tell the {siteConfig.name} team
				</Link>
				.
			</p>
		</div>
	);
}
