import Link from "next/link";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/../config/site";

interface LogoProps {
	/** Sizing utility classes. Defaults to a header-appropriate height. */
	className?: string;
	/**
	 * When set, the logo is wrapped in a Link to this href. Leave undefined to
	 * render the bare image (use this when the caller already provides its own
	 * link/anchor, to avoid nesting anchors).
	 */
	href?: string;
	/** Accessible label / alt text. */
	alt?: string;
}

/**
 * The brand logo. Single source of truth — renders the official SVG lockup
 * from /public/logo.svg. Size it via `className` (e.g. "h-9 w-auto").
 *
 * Replaces the old inline "pink circle + Home icon + 'uno' text" lockup that
 * had been copy-pasted across headers, footers, and auth pages.
 *
 * NOTE: the SVG still carries the retired UNO wordmark as drawn vector paths —
 * no code change can rename it. Replacing /public/logo.svg and logo-alt.svg
 * with a Hoomefynda lockup is a design task, tracked separately.
 */
export function Logo({ className, href, alt = siteConfig.name }: LogoProps) {
	const img = (
		// eslint-disable-next-line @next/next/no-img-element -- static local SVG; next/image adds no value for a tiny inline asset
		<img
			src="/logo.svg"
			alt={alt}
			className={cn("h-8 w-auto select-none", className)}
			draggable={false}
		/>
	);

	if (href) {
		return (
			<Link href={href} aria-label={alt} className="inline-flex items-center">
				{img}
			</Link>
		);
	}

	return img;
}
