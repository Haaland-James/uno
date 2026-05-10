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
			throw new Error(`Request failed (${res.status})`);
		}
	}
	if (!res.ok) {
		const msg =
			(json as { error?: { message?: string } } | null)?.error?.message ??
			`Request failed (${res.status})`;
		throw new Error(msg);
	}
	return ((json as { data?: T } | null)?.data) as T;
}

export type AdminListingRow = {
	id: string;
	title: string;
	city: string;
	area: string;
	streetAddress: string | null;
	rent: number;
	rentPeriod: "MONTH" | "YEAR";
	status: string;
	verificationStatus: string;
	verificationSignals: Record<string, "pass" | "fail" | "unknown"> | null;
	verificationRequestedAt: string | null;
	rejectionReason: string | null;
	submittedAt: string | null;
	createdAt: string;
	photos: { url: string }[];
	landlord: { id: string; name: string; email: string; phone: string | null };
};

type ModerateAction =
	| { action: "approve" }
	| { action: "reject"; reason: string }
	| { action: "verify" }
	| { action: "unverify"; reason?: string }
	| { action: "pause" }
	| { action: "reactivate" };

export const adminClient = {
	list: (params: {
		status?: string;
		verification?: string;
		verifyRequested?: boolean;
		pendingArea?: boolean;
		q?: string;
	}) => {
		const sp = new URLSearchParams();
		if (params.status) sp.set("status", params.status);
		if (params.verification) sp.set("verification", params.verification);
		if (params.verifyRequested) sp.set("verifyRequested", "1");
		if (params.pendingArea) sp.set("pendingArea", "1");
		if (params.q) sp.set("q", params.q);
		return getJson<{ items: AdminListingRow[]; total: number }>(
			`/api/admin/properties?${sp.toString()}`
		);
	},
	moderate: (id: string, action: ModerateAction) =>
		getJson<{ id: string }>(`/api/admin/properties/${encodeURIComponent(id)}`, {
			method: "PATCH",
			body: JSON.stringify(action),
		}),
};
