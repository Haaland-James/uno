import type {
	Role,
	AgentStatus,
	AgentEmployment,
	AgentSpecialization,
	ReportReason,
	ReportStatus,
} from "@prisma/client";

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

// ─────────────────────────────────────────────────────────────────
// Listings (moderation queue)
// ─────────────────────────────────────────────────────────────────

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
	| { action: "reactivate" }
	| { action: "reassign"; landlordId: string };

// ─────────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────────

export type AdminUserRow = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	role: Role;
	emailVerified: boolean;
	phoneVerified: boolean;
	createdAt: string;
	agentStatus: import("@prisma/client").AgentStatus;
	agentSlug: string | null;
	agentSpecializations: import("@prisma/client").AgentSpecialization[];
	_count: { properties: number; contactsSent: number };
};

type UserAction =
	| { action: "promote" }
	| { action: "demote" }
	| { action: "make_agent" }
	| { action: "revoke_agent" };

// ─────────────────────────────────────────────────────────────────
// Agents
// ─────────────────────────────────────────────────────────────────

export type AdminAgentRow = {
	id: string;
	name: string;
	email: string;
	phone: string | null;
	photo: string | null;
	agentStatus: AgentStatus;
	agentEmployment: AgentEmployment | null;
	agentSlug: string | null;
	agentPhoto: string | null;
	agentTerritory: string[];
	agentSpecializations: AgentSpecialization[];
	agentVerifiedAt: string | null;
	_count: { properties: number };
};

export type AdminAgentListing = {
	id: string;
	title: string;
	area: string;
	city: string;
	state: string | null;
	status: string;
	rent: number;
	rentPeriod: "MONTH" | "YEAR";
	views: number;
	contactCount: number;
	listedByAgent: boolean;
	offPlatformOwnerName: string | null;
	offPlatformOwnerPhone: string | null;
	createdAt: string;
};

export type AdminAgentDetail = {
	agent: {
		id: string;
		name: string;
		email: string;
		phone: string | null;
		photo: string | null;
		role: Role;
		agentStatus: AgentStatus;
		agentEmployment: AgentEmployment | null;
		agentSlug: string | null;
		agentBio: string | null;
		agentPhoto: string | null;
		agentTerritory: string[];
		agentSpecializations: AgentSpecialization[];
		agentVerifiedAt: string | null;
		createdAt: string;
	};
	listings: AdminAgentListing[];
	owners: { name: string | null; phone: string; count: number }[];
	metrics: {
		totalListings: number;
		activeListings: number;
		totalViews: number;
		totalContacts: number;
	};
};

type AgentAction =
	| {
			action: "updateProfile";
			bio?: string;
			photo?: string;
			territory?: string[];
			specializations?: AgentSpecialization[];
			employment?: AgentEmployment;
	  }
	| { action: "suspend" }
	| { action: "reinstate" };

// ─────────────────────────────────────────────────────────────────
// Reports
// ─────────────────────────────────────────────────────────────────

export type AdminReportRow = {
	id: string;
	reason: ReportReason;
	details: string | null;
	status: ReportStatus;
	resolution: string | null;
	resolvedAt: string | null;
	createdAt: string;
	property: {
		id: string;
		title: string;
		area: string;
		city: string;
		status: string;
		landlord: { id: string; name: string };
	};
	reporter: { id: string; name: string; email: string } | null;
};

type ReportAction =
	| { action: "resolve"; note?: string; pauseListing?: boolean }
	| { action: "dismiss"; note?: string }
	| { action: "reopen" };

// ─────────────────────────────────────────────────────────────────
// Stats (dashboard)
// ─────────────────────────────────────────────────────────────────

export type AdminStats = {
	listings: {
		total: number;
		draft: number;
		pending: number;
		active: number;
		paused: number;
		rented: number;
		rejected: number;
		verifyRequested: number;
		pendingArea: number;
	};
	users: {
		total: number;
		renters: number;
		landlords: number;
		agents: number;
		admins: number;
	};
	activity: {
		signups7d: number;
		newListings7d: number;
		contacts7d: number;
	};
};

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

	users: {
		list: (params: { role?: string; q?: string; page?: number }) => {
			const sp = new URLSearchParams();
			if (params.role && params.role !== "ALL") sp.set("role", params.role);
			if (params.q) sp.set("q", params.q);
			if (params.page) sp.set("page", String(params.page));
			const qs = sp.toString();
			return getJson<{
				items: AdminUserRow[];
				total: number;
				page: number;
				pageSize: number;
			}>(`/api/admin/users${qs ? `?${qs}` : ""}`);
		},
		moderate: (id: string, action: UserAction) =>
			getJson<{ id: string; role: Role }>(
				`/api/admin/users/${encodeURIComponent(id)}`,
				{ method: "PATCH", body: JSON.stringify(action) }
			),
	},

	agents: {
		list: (params: { status?: string; q?: string }) => {
			const sp = new URLSearchParams();
			if (params.status && params.status !== "ALL") sp.set("status", params.status);
			if (params.q) sp.set("q", params.q);
			const qs = sp.toString();
			return getJson<{ items: AdminAgentRow[]; total: number }>(
				`/api/admin/agents${qs ? `?${qs}` : ""}`
			);
		},
		get: (id: string) =>
			getJson<AdminAgentDetail>(`/api/admin/agents/${encodeURIComponent(id)}`),
		update: (id: string, action: AgentAction) =>
			getJson<{ id: string }>(`/api/admin/agents/${encodeURIComponent(id)}`, {
				method: "PATCH",
				body: JSON.stringify(action),
			}),
	},

	reports: {
		list: (params: { status?: string }) => {
			const sp = new URLSearchParams();
			if (params.status) sp.set("status", params.status);
			const qs = sp.toString();
			return getJson<{
				items: AdminReportRow[];
				total: number;
				counts: { OPEN: number; RESOLVED: number; DISMISSED: number };
			}>(`/api/admin/reports${qs ? `?${qs}` : ""}`);
		},
		moderate: (id: string, action: ReportAction) =>
			getJson<{ id: string; status: ReportStatus }>(
				`/api/admin/reports/${encodeURIComponent(id)}`,
				{ method: "PATCH", body: JSON.stringify(action) }
			),
	},

	stats: {
		get: () => getJson<AdminStats>("/api/admin/stats"),
	},
};
