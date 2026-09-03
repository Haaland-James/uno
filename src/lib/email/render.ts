import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "UNO <onboarding@resend.dev>";

export async function sendEmail(params: {
	to: string | string[];
	subject: string;
	html: string;
	text: string;
}) {
	const result = await resend.emails.send({ from: FROM, ...params });
	if (result.error) {
		throw new Error(`Resend error: ${result.error.message}`);
	}
	return result.data;
}

/**
 * Notification emails are best-effort. The database write that triggered one
 * is the source of truth, so a mail failure is logged rather than surfaced —
 * a renter's enquiry or an admin's moderation action must not fail because
 * Resend was down.
 */
export async function sendBestEffort(send: () => Promise<unknown>, context: string): Promise<void> {
	try {
		await send();
	} catch (error) {
		console.error(`[email] ${context} failed`, error);
	}
}

/**
 * Escapes text interpolated into the templates. Most values reaching these
 * emails are user-supplied (renter names, messages, listing titles, report
 * details), and the recipient is a different person than the author — so
 * unescaped interpolation would let one user inject markup into an email
 * another user trusts.
 */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

export function appUrl(path: string): string {
	const base = (process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/+$/, "");
	return `${base}${path}`;
}

// Emails render on servers running in UTC but are read in Nigeria, so both
// formatters pin the zone explicitly — otherwise "filed at 10:42am" silently
// becomes 9:42am for every recipient.
const TZ = "Africa/Lagos";

/** "September 3, 2026" */
export function formatDate(date: Date): string {
	return date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		timeZone: TZ,
	});
}

/** "Sep 3, 2026 · 10:42am" */
export function formatDateTime(date: Date): string {
	const day = date.toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		timeZone: TZ,
	});
	const time = date
		.toLocaleTimeString("en-US", {
			hour: "numeric",
			minute: "2-digit",
			hour12: true,
			timeZone: TZ,
		})
		.replace(/\s/g, "")
		.toLowerCase();
	return `${day} · ${time}`;
}

export interface DetailRow {
	label: string;
	/** Already-escaped HTML. Callers must escape user input themselves. */
	value: string;
	italic?: boolean;
	/** Muted secondary line rendered under the value. Already-escaped HTML. */
	subline?: string;
	/** Renders a hairline rule above this row, separating it from the group. */
	dividerBefore?: boolean;
}

const LABEL_STYLE =
	"font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,10,10,0.4);margin-bottom:4px;";

function detailRow(row: DetailRow, isLast: boolean): string {
	const valueStyle = [
		"font-size:15px",
		row.italic ? "font-style:italic" : "font-weight:600",
		"color:#161515",
	].join(";");

	const inner = `
      <div class="label-muted" style="${LABEL_STYLE}">${row.label}</div>
      <div class="value-text" style="${valueStyle};">${row.value}</div>
      ${
			row.subline
				? `<div class="muted-65" style="font-size:13px;font-weight:400;color:rgba(10,10,10,0.65);margin-top:2px;">${row.subline}</div>`
				: ""
		}`;

	const block = `<div style="margin-bottom:${isLast ? "0" : "16px"};">${inner}
    </div>`;

	if (!row.dividerBefore) return block;

	return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="divider-line" style="border-top:1px solid rgba(186,186,186,0.4);margin-top:20px;"><tr><td style="padding-top:16px;">${block}</td></tr></table>`;
}

/** The bordered label/value panel used by every notification template. */
export function detailsBox(rows: DetailRow[]): string {
	const rendered = rows
		.map((row, i) => {
			// A divider row opens its own sub-group, so the row before it is "last"
			// within the preceding group and shouldn't carry a bottom margin.
			const nextIsDivider = rows[i + 1]?.dividerBefore ?? false;
			return detailRow(row, i === rows.length - 1 || nextIsDivider);
		})
		.join("");

	return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="details-box" style="background:#faf9f9;border:1px solid rgba(186,186,186,0.65);border-radius:12px;">
    <tr><td style="padding:24px;">${rendered}</td></tr>
  </table>`;
}

export interface Cta {
	href: string;
	label: string;
}

function primaryButton(cta: Cta): string {
	return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td align="center" bgcolor="#af2525" style="background:#af2525;border-radius:10px;">
          <a href="${escapeHtml(cta.href)}" style="display:block;padding:14px 12px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(cta.label)}</a>
        </td></tr></table>`;
}

function secondaryButton(cta: Cta): string {
	return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation"><tr>
        <td align="center" style="border-radius:10px;">
          <a href="${escapeHtml(cta.href)}" class="btn-secondary-link" style="display:block;padding:13px 12px;font-size:14px;font-weight:600;color:#af2525;text-decoration:none;border:1px solid rgba(175,37,37,0.35);border-radius:10px;">${escapeHtml(cta.label)}</a>
        </td></tr></table>`;
}

/** One full-width button, or two side-by-side that stack under 480px. */
export function ctaButtons(primary: Cta, secondary?: Cta): string {
	if (!secondary) {
		return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:24px;"><tr>
      <td align="center" bgcolor="#af2525" style="background:#af2525;border-radius:10px;">
        <a href="${escapeHtml(primary.href)}" style="display:block;padding:14px 12px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(primary.label)}</a>
      </td></tr></table>`;
	}

	return `<table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="cta-table" style="margin-top:24px;"><tr>
    <td class="cta-td-first" style="width:50%;padding-right:6px;" valign="top">${primaryButton(primary)}</td>
    <td style="width:50%;padding-left:6px;" valign="top">${secondaryButton(secondary)}</td>
  </tr></table>`;
}

export interface ShellParams {
	/** Hidden inbox-preview line. Plain text. */
	preheader: string;
	subject: string;
	heading: string;
	/** Lead paragraph. Already-escaped HTML (may contain <strong>). */
	intro: string;
	/** Main content — typically a detailsBox(). */
	body?: string;
	ctas?: string;
	/** Small muted line under the CTAs. */
	footnote: string;
}

/**
 * The shared UNO email chrome: card, wordmark, heading, dark-mode palette and
 * footer. Every notification template renders through this so the whole set
 * stays visually identical.
 */
export function renderShell({
	preheader,
	subject,
	heading,
	intro,
	body = "",
	ctas = "",
	footnote,
}: ShellParams): string {
	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${escapeHtml(subject)}</title>
<!--[if mso]>
<style type="text/css">table, td, div, h1, p { font-family: Arial, sans-serif !important; }</style>
<![endif]-->
<style>
  @media (max-width: 480px) {
    .cta-table, .cta-table tr, .cta-table td { display: block !important; width: 100% !important; }
    .cta-table td { padding: 0 !important; }
    .cta-td-first { margin-bottom: 12px !important; }
  }
  @media (prefers-color-scheme: dark) {
    .email-bg { background: #0f0e0e !important; }
    .card { background: #1c1b1a !important; box-shadow: none !important; }
    .heading-text { color: #f5f4f3 !important; }
    .muted-65 { color: rgba(245,244,243,0.65) !important; }
    .muted-40, .label-muted { color: rgba(245,244,243,0.4) !important; }
    .value-text { color: #f5f4f3 !important; }
    .details-box { background: #141312 !important; border-color: rgba(255,255,255,0.12) !important; }
    .divider-line, .footer-divider { border-top-color: rgba(255,255,255,0.12) !important; }
    .btn-secondary-link { color: #ff8a8a !important; border-color: rgba(255,138,138,0.5) !important; }
    .strike-price { color: rgba(245,244,243,0.4) !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#faf9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#161515;">
<div style="display:none;font-size:1px;color:#faf9f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>
<table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="email-bg" style="background:#faf9f9;padding:40px 20px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="card" style="max-width:480px;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
      <tr><td>
        <div style="font-size:24px;font-weight:700;color:#af2525;letter-spacing:-0.02em;">uno</div>
        <h1 class="heading-text" style="margin:32px 0 12px;font-size:22px;font-weight:600;line-height:1.3;color:#161515;">${heading}</h1>
        <p class="muted-65" style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(10,10,10,0.65);">${intro}</p>
        ${body}
        ${ctas}
        <p class="muted-40" style="margin:28px 0 0;font-size:13px;line-height:1.6;color:rgba(10,10,10,0.4);">${escapeHtml(footnote)}</p>
        <hr class="footer-divider" style="border:0;border-top:1px solid rgba(186,186,186,0.4);margin:20px 0 24px;">
        <p class="muted-40" style="margin:0;font-size:12px;color:rgba(10,10,10,0.4);">UNO &mdash; Find your dream home in Nigeria.</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

/**
 * Assembles the plaintext alternative every template ships alongside its HTML.
 * Empty strings are kept (they're deliberate paragraph breaks); only null and
 * false are dropped, so callers can inline `cond && "line"` for optional rows.
 */
export function renderText(lines: (string | null | false | undefined)[]): string {
	const kept = lines.filter((l): l is string => l !== null && l !== undefined && l !== false);
	return [...kept, "This email was sent by UNO.", "---", "UNO — Find your dream home in Nigeria."].join(
		"\n"
	);
}
