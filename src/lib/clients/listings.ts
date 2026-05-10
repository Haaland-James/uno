import type { PropertyCardData } from "@/types/property";

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
