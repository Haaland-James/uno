import type { ContactCreateInput } from "@/lib/validators/contact";

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
	const res = await fetch(url, {
		...init,
		headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
	});
	const json = await res.json();
	if (!res.ok) {
		const msg = json?.error?.message ?? `Request failed (${res.status})`;
		throw new Error(msg);
	}
	return json.data as T;
}

export type ContactCreateResult = {
	id: string;
	deduped: boolean;
	contactTarget: { phone?: string; whatsapp?: string; email?: string };
};

export type InboxItem = {
	id: string;
	propertyId: string;
	property: { id: string; title: string; city: string; area: string; photo: string | null };
	tenantName: string;
	tenantPhone: string;
	tenantEmail: string | null;
	message: string | null;
	contactMethod: "WHATSAPP" | "PHONE" | "EMAIL";
	status: "UNREAD" | "READ" | "RESPONDED" | "ARCHIVED";
	source: string | null;
	readAt: string | null;
	respondedAt: string | null;
	createdAt: string;
};

export type InboxListResult = {
	items: InboxItem[];
	hasMore: boolean;
	nextCursor: string | null;
	counts: { unread: number; total: number };
};

export const contactsClient = {
	create: (input: ContactCreateInput) =>
		getJson<ContactCreateResult>("/api/contacts", {
			method: "POST",
			body: JSON.stringify(input),
		}),

	list: (params: { status?: string; cursor?: string; limit?: number } = {}) => {
		const sp = new URLSearchParams();
		if (params.status) sp.set("status", params.status);
		if (params.cursor) sp.set("cursor", params.cursor);
		if (params.limit) sp.set("limit", String(params.limit));
		const q = sp.toString();
		return getJson<InboxListResult>(`/api/contacts${q ? `?${q}` : ""}`);
	},

	updateStatus: (id: string, status: "READ" | "RESPONDED" | "ARCHIVED" | "UNREAD") =>
		getJson<{ id: string; status: string; readAt: string | null; respondedAt: string | null }>(
			`/api/contacts/${encodeURIComponent(id)}`,
			{ method: "PATCH", body: JSON.stringify({ status }) }
		),
};
