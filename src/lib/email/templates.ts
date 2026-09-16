import {
	sendEmail,
	escapeHtml,
	appUrl,
	formatDate,
	formatDateTime,
	detailsBox,
	ctaButtons,
	renderShell,
	renderText,
	type DetailRow,
} from "./render";

/* -------------------------------------------------------------------------- */
/* Auth — one-time codes                                                       */
/* -------------------------------------------------------------------------- */

interface SendOtpParams {
	to: string;
	code: string;
	purpose: "SIGNUP" | "LOGIN" | "EMAIL_CHANGE";
	name?: string;
}

const OTP_SUBJECTS: Record<SendOtpParams["purpose"], string> = {
	SIGNUP: "Welcome to UNO — verify your email",
	LOGIN: "Your UNO sign-in code",
	EMAIL_CHANGE: "Confirm your new email on UNO",
};

const OTP_ACTIONS: Record<SendOtpParams["purpose"], string> = {
	SIGNUP: "complete your account setup",
	LOGIN: "sign in to your account",
	EMAIL_CHANGE: "confirm your new email address",
};

export async function sendOtpEmail({ to, code, purpose, name }: SendOtpParams) {
	const subject = OTP_SUBJECTS[purpose];
	const greeting = name ? `Hi ${escapeHtml(name.split(" ")[0])},` : "Hi there,";

	const codeBox = `<div style="background:#faf9f9;border:1px solid rgba(186,186,186,0.65);border-radius:12px;padding:24px;text-align:center;">
      <div class="value-text" style="font-size:32px;font-weight:700;letter-spacing:0.4em;color:#161515;font-family:'SF Mono',Menlo,monospace;">${escapeHtml(code)}</div>
    </div>`;

	const html = renderShell({
		preheader: `Your UNO code is ${code}. It expires in 10 minutes.`,
		subject,
		heading: "Your verification code",
		intro: `${greeting}<br/>Use the code below to ${OTP_ACTIONS[purpose]}. It expires in <strong class="value-text" style="color:#161515;">10 minutes</strong>.`,
		body: codeBox,
		footnote: "If you didn't request this code, you can safely ignore this email.",
	});

	const text = renderText([
		"Your verification code",
		"",
		`Your UNO verification code is: ${code}`,
		"",
		"It expires in 10 minutes.",
		"",
		"If you didn't request this, ignore this email.",
	]);

	return sendEmail({ to, subject, html, text });
}

/* -------------------------------------------------------------------------- */
/* Contact leads                                                               */
/* -------------------------------------------------------------------------- */

type ContactMethod = "WHATSAPP" | "PHONE" | "EMAIL";

interface SendContactLeadEmailParams {
	to: string;
	tenantName: string;
	tenantPhone: string;
	tenantEmail?: string | null;
	message?: string | null;
	contactMethod: ContactMethod;
	propertyTitle: string;
	propertyLocation: string;
}

const CONTACT_METHOD_LABEL: Record<ContactMethod, string> = {
	WHATSAPP: "WhatsApp",
	PHONE: "Phone call",
	EMAIL: "Email",
};

const CONTACT_METHOD_DOT_COLOR: Record<ContactMethod, string> = {
	WHATSAPP: "#25D366",
	PHONE: "#af2525",
	EMAIL: "#af2525",
};

const CONTACT_METHOD_REACH_OUT: Record<ContactMethod, string> = {
	WHATSAPP: "reply on WhatsApp",
	PHONE: "give them a call",
	EMAIL: "reply by email",
};

function waLink(phone: string): string {
	return `https://wa.me/${phone.replace(/[^0-9]/g, "")}`;
}

/** Notifies a lister the moment a renter contacts them about their listing. */
export async function sendContactLeadEmail({
	to,
	tenantName,
	tenantPhone,
	tenantEmail,
	message,
	contactMethod,
	propertyTitle,
	propertyLocation,
}: SendContactLeadEmailParams) {
	const subject = `New enquiry on ${propertyTitle}`;
	const firstName = tenantName.split(" ")[0];
	const inboxUrl = appUrl("/listing/contacts");
	const methodLabel = CONTACT_METHOD_LABEL[contactMethod];

	const rows: DetailRow[] = [
		{ label: "Renter", value: escapeHtml(tenantName) },
		...(tenantPhone
			? [
					{
						label: "Phone",
						value: `<a class="value-text" href="tel:${escapeHtml(tenantPhone)}" style="color:#161515;text-decoration:none;">${escapeHtml(tenantPhone)}</a>`,
					},
			  ]
			: []),
		...(tenantEmail
			? [
					{
						label: "Email",
						value: `<a class="value-text" href="mailto:${escapeHtml(tenantEmail)}" style="color:#161515;text-decoration:none;">${escapeHtml(tenantEmail)}</a>`,
					},
			  ]
			: []),
		...(message
			? [{ label: "Message", value: `&ldquo;${escapeHtml(message)}&rdquo;`, italic: true }]
			: []),
		{
			label: "Prefers to be contacted via",
			value: `<table cellpadding="0" cellspacing="0" role="presentation"><tr>
              <td style="padding-right:8px;"><div style="width:8px;height:8px;border-radius:50%;background:${CONTACT_METHOD_DOT_COLOR[contactMethod]};font-size:0;line-height:0;">&nbsp;</div></td>
              <td class="value-text" style="font-size:15px;font-weight:600;color:#161515;">${methodLabel}</td>
            </tr></table>`,
		},
		{
			label: "Listing",
			value: escapeHtml(propertyTitle),
			subline: escapeHtml(propertyLocation),
			dividerBefore: true,
		},
	];

	// tenantPhone can be "" (renter has none on file) — fall back to email,
	// which is always populated since it comes from the tenant's account, so
	// the lister always has one working way to respond.
	const primaryCta =
		contactMethod === "WHATSAPP" && tenantPhone
			? { href: waLink(tenantPhone), label: "Message on WhatsApp" }
			: contactMethod === "PHONE" && tenantPhone
			? { href: `tel:${tenantPhone}`, label: `Call ${firstName}` }
			: tenantEmail
			? { href: `mailto:${tenantEmail}`, label: `Email ${firstName}` }
			: { href: `tel:${tenantPhone}`, label: `Call ${firstName}` };

	const html = renderShell({
		preheader: `${tenantName} just reached out about your listing on UNO — ${CONTACT_METHOD_REACH_OUT[contactMethod]}.`,
		subject,
		heading: `New enquiry on ${escapeHtml(propertyTitle)}`,
		intro: `<strong class="value-text" style="color:#161515;">${escapeHtml(tenantName)}</strong> just reached out about your listing &mdash; just now.`,
		body: detailsBox(rows),
		ctas: ctaButtons(primaryCta, { href: inboxUrl, label: "View full enquiry" }),
		footnote: "This lead was logged in your UNO dashboard.",
	});

	const text = renderText([
		subject,
		"",
		`${tenantName} just reached out about your listing — just now.`,
		"",
		`Renter: ${tenantName}`,
		tenantPhone && `Phone: ${tenantPhone}`,
		tenantEmail && `Email: ${tenantEmail}`,
		message && `Message: "${message}"`,
		`Prefers: ${methodLabel}`,
		"",
		`Listing: ${propertyTitle}`,
		propertyLocation,
		"",
		`${primaryCta.label}: ${primaryCta.href}`,
		`View full enquiry: ${inboxUrl}`,
		"",
		"This lead was logged in your UNO dashboard.",
	]);

	return sendEmail({ to, subject, html, text });
}

/* -------------------------------------------------------------------------- */
/* Listing moderation decisions                                                */
/* -------------------------------------------------------------------------- */

interface ListingDecisionParams {
	to: string;
	propertyId: string;
	propertyTitle: string;
	propertyLocation: string;
}

export async function sendListingApprovedEmail({
	to,
	propertyId,
	propertyTitle,
	propertyLocation,
}: ListingDecisionParams) {
	const subject = `${propertyTitle} is now live`;
	const liveUrl = appUrl(`/property/${propertyId}`);

	const html = renderShell({
		preheader: "Your listing is live and visible to renters.",
		subject,
		heading: `${escapeHtml(propertyTitle)} is now live`,
		intro: `Your listing passed review and is now visible to renters searching in ${escapeHtml(propertyLocation)}.`,
		body: detailsBox([
			{ label: "Listing", value: escapeHtml(propertyTitle) },
			{ label: "Location", value: escapeHtml(propertyLocation), italic: false },
		]),
		ctas: ctaButtons({ href: liveUrl, label: "View live listing" }),
		footnote: "This update was logged in your UNO dashboard.",
	});

	const text = renderText([
		subject,
		"",
		`Visible to renters in ${propertyLocation}.`,
		"",
		`View: ${liveUrl}`,
	]);

	return sendEmail({ to, subject, html, text });
}

export async function sendListingRejectedEmail({
	to,
	propertyId,
	propertyTitle,
	propertyLocation,
	reason,
}: ListingDecisionParams & { reason: string }) {
	const subject = `${propertyTitle} needs changes`;
	const editUrl = appUrl(`/listing/properties/${propertyId}/edit`);
	const liveUrl = appUrl(`/property/${propertyId}`);

	const html = renderShell({
		preheader: `Your listing needs changes before it can go live.`,
		subject,
		heading: `${escapeHtml(propertyTitle)} needs changes`,
		intro:
			"Your listing didn&rsquo;t pass review this time. See the reason below, make the fix, and resubmit.",
		body: detailsBox([
			{ label: "Listing", value: escapeHtml(propertyTitle), subline: escapeHtml(propertyLocation) },
			{ label: "Reason", value: escapeHtml(reason), italic: true },
		]),
		ctas: ctaButtons(
			{ href: editUrl, label: "Edit listing" },
			{ href: liveUrl, label: "View listing" }
		),
		footnote: "This update was logged in your UNO dashboard.",
	});

	const text = renderText([
		subject,
		"",
		`Reason: ${reason}`,
		"",
		`Edit: ${editUrl}`,
		`View: ${liveUrl}`,
	]);

	return sendEmail({ to, subject, html, text });
}

/* -------------------------------------------------------------------------- */
/* Agent onboarding                                                            */
/* -------------------------------------------------------------------------- */

interface SendAgentCreatedEmailParams {
	to: string;
	name: string;
	agentSlug: string;
	territory: string[];
}

export async function sendAgentCreatedEmail({
	to,
	name,
	agentSlug,
	territory,
}: SendAgentCreatedEmailParams) {
	const firstName = name.split(" ")[0];
	const subject = `Welcome to UNO, ${firstName}`;
	const profilePath = `/agents/${agentSlug}`;
	const consoleUrl = appUrl("/agent");
	const loginUrl = appUrl("/agent/login");

	const html = renderShell({
		preheader: `${firstName}, your UNO agent account is ready. Sign in to finish your profile.`,
		subject,
		heading: `Welcome to UNO, ${escapeHtml(firstName)}`,
		intro: `You&rsquo;ve been set up as an in-house UNO agent. Your public profile is live at <strong class="value-text" style="color:#161515;">uno.ng${escapeHtml(profilePath)}</strong>.`,
		body: detailsBox([
			{ label: "Sign in with", value: escapeHtml(to) },
			...(territory.length
				? [{ label: "Territory", value: escapeHtml(territory.join(", ")), italic: false }]
				: []),
		]),
		ctas: ctaButtons(
			{ href: consoleUrl, label: "Go to your console" },
			{ href: loginUrl, label: "Sign in" }
		),
		footnote: "Sign-in uses a one-time code sent to your email — no password needed.",
	});

	const text = renderText([
		subject,
		"",
		"You've been set up as an in-house UNO agent.",
		`Profile: uno.ng${profilePath}`,
		`Sign in with: ${to}`,
		territory.length ? `Territory: ${territory.join(", ")}` : null,
		"",
		`Go to your console: ${consoleUrl}`,
		`Sign in: ${loginUrl}`,
	]);

	return sendEmail({ to, subject, html, text });
}

/* -------------------------------------------------------------------------- */
/* Account lifecycle                                                           */
/* -------------------------------------------------------------------------- */

export async function sendAccountDeactivatedEmail({
	to,
	deactivatedAt,
}: {
	to: string;
	deactivatedAt: Date;
}) {
	const subject = "Your UNO account has been deactivated";
	const when = formatDate(deactivatedAt);
	const loginUrl = appUrl("/login");

	const html = renderShell({
		preheader: "Your UNO account was deactivated. Sign in again anytime to reactivate.",
		subject,
		heading: "Your UNO account has been deactivated",
		intro: `This confirms your account (${escapeHtml(to)}) was deactivated on ${escapeHtml(when)}. Your listings and data are kept &mdash; sign in again anytime to reactivate.`,
		body: detailsBox([
			{ label: "Account", value: escapeHtml(to) },
			{ label: "Deactivated", value: escapeHtml(when), italic: false },
		]),
		ctas: ctaButtons({ href: loginUrl, label: "Reactivate account" }),
		footnote: "If you didn't request this, contact support immediately.",
	});

	const text = renderText([
		subject,
		"",
		`Account: ${to}`,
		`Deactivated: ${when}`,
		"",
		`Reactivate: ${loginUrl}`,
		"",
		"If you didn't request this, contact support immediately.",
	]);

	return sendEmail({ to, subject, html, text });
}

/* -------------------------------------------------------------------------- */
/* Admin alerts                                                                */
/* -------------------------------------------------------------------------- */

interface SendReportFiledEmailParams {
	to: string[];
	propertyId: string;
	propertyTitle: string;
	reason: string;
	reporterName: string;
	details?: string | null;
	filedAt: Date;
}

export async function sendReportFiledEmail({
	to,
	propertyId,
	propertyTitle,
	reason,
	reporterName,
	details,
	filedAt,
}: SendReportFiledEmailParams) {
	const subject = `Report filed: ${propertyTitle}`;
	// No /admin/reports/[id] detail page exists yet — link to the queue.
	const queueUrl = appUrl("/admin/reports");
	const listingUrl = appUrl(`/property/${propertyId}`);
	const filed = formatDateTime(filedAt);

	const html = renderShell({
		preheader: `New report filed against "${propertyTitle}": ${reason}.`,
		subject,
		heading: `Report filed: ${escapeHtml(propertyTitle)}`,
		intro: "A listing was flagged and requires admin review.",
		body: detailsBox([
			{ label: "Reason", value: escapeHtml(reason) },
			{ label: "Reported by", value: escapeHtml(reporterName), italic: false },
			...(details
				? [{ label: "Details", value: escapeHtml(details), italic: true }]
				: []),
			{
				label: "Listing",
				value: escapeHtml(propertyTitle),
				subline: `Filed ${escapeHtml(filed)}`,
				dividerBefore: true,
			},
		]),
		ctas: ctaButtons(
			{ href: queueUrl, label: "Review report" },
			{ href: listingUrl, label: "View listing" }
		),
		footnote: "Filed in the admin reports queue.",
	});

	const text = renderText([
		subject,
		"",
		`Reason: ${reason}`,
		`Reported by: ${reporterName}`,
		details ? `Details: ${details}` : null,
		`Filed: ${filed}`,
		"",
		`Review: ${queueUrl}`,
		`Listing: ${listingUrl}`,
	]);

	return sendEmail({ to, subject, html, text });
}
