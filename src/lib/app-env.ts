/**
 * Non-production banner copy, driven by NEXT_PUBLIC_APP_ENV (same variable the
 * admin/agent header badges read; unset means DEV). Returns null when no banner
 * should show: PROD, and STANDBY too — the standby serves real users during a
 * failover, and the admin/agent badge already marks it for staff.
 */
const LABELS: Record<string, string> = {
	STAGING: "Staging — demo data",
	DEV: "Development — demo data",
};

export function envBannerLabel(raw: string | undefined): string | null {
	const env = (raw ?? "DEV").trim().toUpperCase() || "DEV";
	if (env === "PROD" || env === "PRODUCTION" || env === "STANDBY") return null;
	return LABELS[env] ?? `${env} — not the live site`;
}
