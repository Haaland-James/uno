import { useListPropertyStore } from "@/stores/listPropertyStore";
import { useListingErrorsStore } from "@/stores/listingErrorsStore";
import { fieldProblem } from "./validation";
import { getSteps, type WizardKind } from "./steps";
import { stepForField } from "./field-steps";

/** How long after leaving a field to wait before judging it (see `checkFieldOnBlur`). */
export const BLUR_CHECK_DELAY_MS = 200;

const TEXT_LIKE = new Set(["text", "number", "email", "tel", "url", "search", "password", "date", ""]);

/**
 * Check one field when the person leaves it, and show or clear its sentence under
 * the field. The sentence is the same one the server (and the Continue button)
 * would give, because `fieldProblem` runs the same rule through the same error map.
 *
 * Only for text-like inputs and text areas: a select or a card is judged when
 * Continue is pressed, not the moment its menu steals focus. Judging waits a beat
 * and reads the draft then, so picking an option from a list (the input blurs
 * before the option's click lands) doesn't flash a message that is gone a moment
 * later. Never runs while typing, only on blur, so a field that was never entered
 * is never checked; an empty optional field has no problem.
 */
export function checkFieldOnBlur(name: string, target: EventTarget | null) {
	const isTextArea = typeof HTMLTextAreaElement !== "undefined" && target instanceof HTMLTextAreaElement;
	const isInput = typeof HTMLInputElement !== "undefined" && target instanceof HTMLInputElement;
	if (!isTextArea && !(isInput && TEXT_LIKE.has((target as HTMLInputElement).type))) return;

	setTimeout(() => {
		// Focus came back (the person clicked into it again): they aren't done.
		if (typeof document !== "undefined" && document.activeElement === target) return;
		const data = useListPropertyStore.getState().data;
		const kind = (data.propertyKind || "") as WizardKind;
		const flowKeys = getSteps(data.objective, kind, true).map((s) => s.key);
		// A field the chosen kind or objective hides has nothing on screen to judge.
		if (stepForField(name, { kind, objective: data.objective, flowKeys }) === null) return;
		useListingErrorsStore.getState().setFieldError(name, fieldProblem(name, data));
	}, BLUR_CHECK_DELAY_MS);
}
