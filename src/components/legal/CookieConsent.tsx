"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { readConsent, writeConsent, type ConsentChoice } from "@/lib/consent";

/**
 * Cookie consent banner.
 *
 * Rendered once from the root layout so it covers every surface. Today the app
 * sets only strictly-necessary cookies, so this gates nothing yet — it exists
 * so the consent record is already in place when analytics arrives.
 *
 * Both buttons carry equal visual weight. A styled "Accept" beside a greyed-out
 * "Reject" is a dark pattern, and a consent recorded that way is not freely
 * given.
 */

/** Lets other surfaces (e.g. the Cookie Policy) reopen the banner. */
const REOPEN_EVENT = "hf:reopen-cookie-preferences";

export function reopenCookiePreferences() {
	if (typeof window === "undefined") return;
	window.dispatchEvent(new Event(REOPEN_EVENT));
}

export function CookieConsent() {
	// Start hidden and decide after mount: the choice lives in a cookie the
	// server didn't read, so rendering the banner during SSR would mismatch.
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (readConsent() === null) setVisible(true);

		const reopen = () => setVisible(true);
		window.addEventListener(REOPEN_EVENT, reopen);
		return () => window.removeEventListener(REOPEN_EVENT, reopen);
	}, []);

	function choose(choice: ConsentChoice) {
		writeConsent(choice);
		setVisible(false);
	}

	if (!visible) return null;

	return (
		<div
			role="dialog"
			aria-label="Cookie preferences"
			// z-50 clears MobileNav (z-40) so the tab bar can't sit on top of it.
			// pb accounts for the mobile tab bar, so the buttons stay reachable.
			className="fixed inset-x-0 bottom-0 z-50 border-t border-black/10 bg-white px-4 pb-[88px] pt-4 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] md:pb-4"
		>
			<div className="mx-auto flex max-w-[1100px] flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<p className="text-[14px] leading-[1.6] text-content-secondary">
					We use cookies to keep you signed in and the platform secure. We set no
					advertising cookies and do not track you across other sites. Read our{" "}
					<Link
						href="/cookies"
						className="font-medium text-uno-red underline underline-offset-2"
					>
						Cookie Policy
					</Link>
					.
				</p>

				<div className="flex shrink-0 gap-3">
					<button
						type="button"
						onClick={() => choose("essential")}
						className="min-h-[44px] flex-1 rounded-button border border-black/15 px-5 text-[14px] font-semibold text-content-primary transition-colors hover:bg-black/[0.04] md:flex-none"
					>
						Essential only
					</button>
					<button
						type="button"
						onClick={() => choose("all")}
						className="min-h-[44px] flex-1 rounded-button bg-uno-red px-5 text-[14px] font-semibold text-white transition-colors hover:bg-uno-red-hover md:flex-none"
					>
						Accept all
					</button>
				</div>
			</div>
		</div>
	);
}
