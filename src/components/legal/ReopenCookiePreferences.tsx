"use client";

import { useEffect, useState } from "react";
import { readConsent, type ConsentChoice } from "@/lib/consent";
import { reopenCookiePreferences } from "@/components/legal/CookieConsent";

const LABELS: Record<ConsentChoice, string> = {
	all: "Accept all",
	essential: "Essential only",
};

/**
 * The "change your cookie choice" control on the Cookie Policy page.
 *
 * Kept in its own client component so the policy page itself stays a server
 * component and can export metadata.
 */
export function ReopenCookiePreferences() {
	const [choice, setChoice] = useState<ConsentChoice | null>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setChoice(readConsent());
		setMounted(true);
	}, []);

	return (
		<div className="my-4 rounded-card-sm border border-black/10 bg-bg-subtle p-4">
			<p className="mb-3 text-[14px] text-content-secondary">
				{!mounted
					? "Checking your current setting…"
					: choice
						? `Your current choice: ${LABELS[choice]}.`
						: "You have not made a choice yet on this device."}
			</p>
			<button
				type="button"
				onClick={reopenCookiePreferences}
				className="min-h-[44px] rounded-button bg-uno-red px-5 text-[14px] font-semibold text-white transition-colors hover:bg-uno-red-hover"
			>
				Change cookie preferences
			</button>
		</div>
	);
}
