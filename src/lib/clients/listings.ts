import type { PropertyCardData } from "@/types/property";

/**
 * A refused save: the server said which fields are wrong and why.
 * `.message` is the first reason (plus "and N more"), so callers that only
 * show `e.message` still show something useful, never a bare "Invalid request".
 */
export class ApiValidationError extends Error {
	readonly fieldErrors: Record<string, string[]>;
	readonly formErrors: string[];

	constructor(fieldErrors: Record<string, string[]>, formErrors: string[] = []) {
		super(summarizeValidation(fieldErrors, formErrors));
		this.name = "ApiValidationError";
		this.fieldErrors = fieldErrors;
		this.formErrors = formErrors;
	}
}

function summarizeValidation(fieldErrors: Record<string, string[]>, formErrors: string[]): string {
	const messages = [...Object.values(fieldErrors).map((m) => m[0]), ...formErrors].filter(Boolean);
	if (messages.length === 0) return "Some details need fixing — check the form and try again";
	return messages.length === 1 ? messages[0] : `${messages[0]} and ${messages.length - 1} more`;
}

/** Pull `{ fieldErrors, formErrors }` out of a `validation_error` response, if that's what it is. */
export function validationErrorFrom(json: unknown): ApiValidationError | null {
	const error = (json as { error?: { code?: string; details?: unknown } } | null)?.error;
	if (error?.code !== "validation_error") return null;
	const details = error.details as { fieldErrors?: unknown; formErrors?: unknown } | undefined;
	const fieldErrors: Record<string, string[]> = {};
	if (details?.fieldErrors && typeof details.fieldErrors === "object") {
		for (const [field, messages] of Object.entries(details.fieldErrors as Record<string, unknown>)) {
			if (Array.isArray(messages)) {
				const list = messages.filter((m): m is string => typeof m === "string");
				if (list.length) fieldErrors[field] = list;
			}
		}
	}
	const formErrors = Array.isArray(details?.formErrors)
		? (details.formErrors as unknown[]).filter((m): m is string => typeof m === "string")
		: [];
	if (Object.keys(fieldErrors).length === 0 && formErrors.length === 0) return null;
	return new ApiValidationError(fieldErrors, formErrors);
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
	});
	const text = await res.text();
	let json: unknown = null;
	if (text.trim().length > 0) {
		try {
			json = JSON.parse(text);
		} catch {
			// Non-JSON body — usually an HTML error page from a crashed route
			// or middleware redirect. Surface a useful message instead of choking.
			if (!res.ok) {
				throw new Error(
					`Request failed (${res.status}). Server returned non-JSON response.`
				);
			}
			throw new Error("Server returned an invalid response");
		}
	}
	if (!res.ok) {
		const validation = validationErrorFrom(json);
		if (validation) throw validation;
		const msg =
			(json as { error?: { message?: string } } | null)?.error?.message ??
			`Request failed (${res.status})`;
		throw new Error(msg);
	}
	const data = (json as { data?: T } | null)?.data;
	return data as T;
}

export const listingsClient = {
	list: () => getJson<{ items: PropertyCardData[]; total: number }>("/api/me/listings"),
	count: () => getJson<{ count: number }>("/api/me/listings?count=1"),
	create: (payload: unknown) =>
		getJson<{ id: string; status: string }>("/api/properties", {
			method: "POST",
			body: JSON.stringify(payload),
		}),
	update: (id: string, payload: unknown) =>
		getJson<{ id: string; status: string }>(`/api/properties/${encodeURIComponent(id)}`, {
			method: "PATCH",
			body: JSON.stringify(payload),
		}),
	remove: (id: string) =>
		getJson<{ ok: true }>(`/api/properties/${encodeURIComponent(id)}`, {
			method: "DELETE",
		}),
	requestVerification: (id: string) =>
		getJson<{ id: string; verificationRequestedAt: string }>(
			`/api/properties/${encodeURIComponent(id)}/request-verification`,
			{ method: "POST" }
		),
	updateStatus: (id: string, action: "pause" | "activate" | "mark_rented" | "mark_available") =>
		getJson<{ id: string; status: string; isRented?: boolean }>(
			`/api/properties/${encodeURIComponent(id)}/status`,
			{ method: "PATCH", body: JSON.stringify({ action }) }
		),
	signUpload: () =>
		getJson<{
			signature: string;
			timestamp: number;
			apiKey: string;
			cloudName: string;
			folder: string;
		}>("/api/uploads/sign", { method: "POST" }),
};

export type DraftRow = {
	id: string;
	userId: string;
	titleHint: string | null;
	addressHint: string | null;
	mainPhotoUrl: string | null;
	data: Record<string, unknown>;
	currentStep: number;
	completedSteps: number[];
	createdAt: string;
	updatedAt: string;
};

export const draftsClient = {
	get: (id: string) => getJson<DraftRow>(`/api/me/drafts/${encodeURIComponent(id)}`),
	create: (payload: { data: unknown; currentStep: number; completedSteps: number[] }) =>
		getJson<DraftRow>("/api/me/drafts", {
			method: "POST",
			body: JSON.stringify(payload),
		}),
	update: (
		id: string,
		payload: { data: unknown; currentStep: number; completedSteps: number[] }
	) =>
		getJson<DraftRow>(`/api/me/drafts/${encodeURIComponent(id)}`, {
			method: "PATCH",
			body: JSON.stringify(payload),
		}),
	remove: (id: string) =>
		getJson<{ ok: true }>(`/api/me/drafts/${encodeURIComponent(id)}`, {
			method: "DELETE",
		}),
};
