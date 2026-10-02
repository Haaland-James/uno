import { create } from "zustand";

/**
 * Per-field messages from a refused listing save, shown under the field by
 * `LabeledField` (matched on its `name`). Not persisted: they describe the last
 * refused attempt only. A field's message clears as soon as the person edits that
 * field (see `updateData` in listPropertyStore), and everything clears on reset.
 */
interface ListingErrorsState {
	/** Message per wizard field name. */
	errors: Record<string, string>;
	/** Field to scroll into view once its step has rendered. */
	focusField: string | null;

	setErrors: (errors: Record<string, string>, focusField: string | null) => void;
	clearFields: (fields: string[]) => void;
	clearAll: () => void;
	consumeFocus: () => void;
}

export const useListingErrorsStore = create<ListingErrorsState>()((set) => ({
	errors: {},
	focusField: null,

	setErrors: (errors, focusField) => set({ errors, focusField }),

	clearFields: (fields) =>
		set((state) => {
			if (!fields.some((f) => f in state.errors)) return state;
			const next = { ...state.errors };
			for (const f of fields) delete next[f];
			return { errors: next };
		}),

	clearAll: () => set({ errors: {}, focusField: null }),

	consumeFocus: () => set({ focusField: null }),
}));
