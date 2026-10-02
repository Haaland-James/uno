"use client";

import { useEffect } from "react";
import { useListingErrorsStore } from "@/stores/listingErrorsStore";

/**
 * After a refused save, bring the first failing field into view and focus it.
 * The field lives on a step that may only just have mounted, so wait a few
 * frames for `[data-field="<name>"]` (set by `LabeledField`) to exist.
 * `stepKey` re-runs the effect when the step changes.
 */
export function useScrollToFieldError(stepKey: string | null | undefined) {
	const focusField = useListingErrorsStore((s) => s.focusField);
	const consumeFocus = useListingErrorsStore((s) => s.consumeFocus);

	useEffect(() => {
		if (!focusField) return;
		let frames = 0;
		let raf = 0;
		const tryScroll = () => {
			const el = document.querySelector<HTMLElement>(`[data-field="${focusField}"]`);
			if (el) {
				el.scrollIntoView({ behavior: "smooth", block: "center" });
				el.querySelector<HTMLElement>("input, select, textarea, button")?.focus({ preventScroll: true });
				consumeFocus();
				return;
			}
			if (++frames < 30) raf = requestAnimationFrame(tryScroll);
			else consumeFocus();
		};
		raf = requestAnimationFrame(tryScroll);
		return () => cancelAnimationFrame(raf);
	}, [focusField, stepKey, consumeFocus]);
}
