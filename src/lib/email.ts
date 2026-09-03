import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "UNO <onboarding@resend.dev>";

async function sendEmail(params: { to: string; subject: string; html: string; text: string }) {
	const result = await resend.emails.send({ from: FROM, ...params });
	if (result.error) {
		throw new Error(`Resend error: ${result.error.message}`);
	}
	return result.data;
}

// Escapes text interpolated into the HTML templates below. All of these values
// (tenant name/email/phone, message, property title/location) are user- or
// renter-supplied, so unescaped interpolation would let HTML/attribute
// injection into an email a third party (the lister) receives.
function escapeHtml(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

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

export async function sendOtpEmail({ to, code, purpose, name }: SendOtpParams) {
	const subject = OTP_SUBJECTS[purpose];
	const greeting = name ? `Hi ${escapeHtml(name.split(" ")[0])},` : "Hi there,";
	const action =
		purpose === "SIGNUP"
			? "complete your account setup"
			: purpose === "LOGIN"
			? "sign in to your account"
			: "confirm your new email address";

	const html = `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#faf9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#161515;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f9;padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
                <tr>
                  <td>
                    <div style="font-size:24px;font-weight:700;color:#af2525;letter-spacing:-0.02em;">uno</div>
                    <h1 style="margin:32px 0 12px;font-size:22px;font-weight:600;line-height:1.3;color:#161515;">
                      Your verification code
                    </h1>
                    <p style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(10,10,10,0.65);">
                      ${greeting}<br/>
                      Use the code below to ${action}. It expires in <strong>10 minutes</strong>.
                    </p>
                    <div style="background:#faf9f9;border:1px solid rgba(186,186,186,0.65);border-radius:12px;padding:24px;text-align:center;">
                      <div style="font-size:32px;font-weight:700;letter-spacing:0.4em;color:#161515;font-family:'SF Mono',Menlo,monospace;">
                        ${escapeHtml(code)}
                      </div>
                    </div>
                    <p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:rgba(10,10,10,0.4);">
                      If you didn't request this code, you can safely ignore this email.
                    </p>
                    <hr style="border:0;border-top:1px solid rgba(186,186,186,0.4);margin:32px 0 24px;" />
                    <p style="margin:0;font-size:12px;color:rgba(10,10,10,0.4);">
                      UNO — Find your dream home in Nigeria.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

	const text = `${greeting}\n\nYour UNO verification code is: ${code}\n\nIt expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`;

	return sendEmail({ to, subject, html, text });
}

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
	inboxUrl: string;
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

/**
 * Notifies a lister the moment a renter contacts them about their listing
 * (mirrors ContactRequest creation in POST /api/contacts). Template design:
 * https://claude.ai/design/p/cded194a-c488-4cf0-912e-bcdde99acf86
 */
export async function sendContactLeadEmail({
	to,
	tenantName,
	tenantPhone,
	tenantEmail,
	message,
	contactMethod,
	propertyTitle,
	propertyLocation,
	inboxUrl,
}: SendContactLeadEmailParams) {
	const subject = `New enquiry on ${propertyTitle}`;
	const firstName = tenantName.split(" ")[0];
	const safeName = escapeHtml(tenantName);
	const safeFirstName = escapeHtml(firstName);
	const safeTitle = escapeHtml(propertyTitle);
	const safeLocation = escapeHtml(propertyLocation);
	const dotColor = CONTACT_METHOD_DOT_COLOR[contactMethod];
	const methodLabel = CONTACT_METHOD_LABEL[contactMethod];

	const phoneRow = tenantPhone
		? `
                  <div style="margin-bottom:16px;">
                    <div class="label-muted" style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,10,10,0.4);margin-bottom:4px;">Phone</div>
                    <div class="value-text" style="font-size:15px;color:#161515;"><a class="value-text" href="tel:${escapeHtml(tenantPhone)}" style="color:#161515;text-decoration:none;">${escapeHtml(tenantPhone)}</a></div>
                  </div>`
		: "";

	const emailRow = tenantEmail
		? `
                  <div style="margin-bottom:16px;">
                    <div class="label-muted" style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,10,10,0.4);margin-bottom:4px;">Email</div>
                    <div class="value-text" style="font-size:15px;color:#161515;"><a class="value-text" href="mailto:${escapeHtml(tenantEmail)}" style="color:#161515;text-decoration:none;">${escapeHtml(tenantEmail)}</a></div>
                  </div>`
		: "";

	const messageRow = message
		? `
                  <div style="margin-bottom:16px;">
                    <div class="label-muted" style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,10,10,0.4);margin-bottom:4px;">Message</div>
                    <div class="value-text" style="font-size:15px;line-height:1.55;color:#161515;font-style:italic;">&ldquo;${escapeHtml(message)}&rdquo;</div>
                  </div>`
		: "";

	// tenantPhone can be "" (renter has none on file) — fall back to email,
	// which is always populated since it comes from the tenant's account,
	// so the lister always has one working way to respond.
	const primaryCta =
		contactMethod === "WHATSAPP" && tenantPhone
			? { href: waLink(tenantPhone), label: "Message on WhatsApp" }
			: contactMethod === "PHONE" && tenantPhone
			? { href: `tel:${tenantPhone}`, label: `Call ${firstName}` }
			: tenantEmail
			? { href: `mailto:${tenantEmail}`, label: `Email ${firstName}` }
			: { href: `tel:${tenantPhone}`, label: `Call ${firstName}` };

	const html = `
    <!doctype html>
    <html lang="en">
    <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="color-scheme" content="light dark">
    <meta name="supported-color-schemes" content="light dark">
    <title>${subject}</title>
    <!--[if mso]>
    <style type="text/css">
    table, td, div, h1, p { font-family: Arial, sans-serif !important; }
    </style>
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
        .muted-40 { color: rgba(245,244,243,0.4) !important; }
        .label-muted { color: rgba(245,244,243,0.4) !important; }
        .value-text { color: #f5f4f3 !important; }
        .details-box { background: #141312 !important; border-color: rgba(255,255,255,0.12) !important; }
        .divider-line { border-top-color: rgba(255,255,255,0.12) !important; }
        .btn-secondary-td { background: transparent !important; }
        .btn-secondary-link { color: #ff8a8a !important; border-color: rgba(255,138,138,0.5) !important; }
        .footer-divider { border-top-color: rgba(255,255,255,0.12) !important; }
      }
    </style>
    </head>
    <body style="margin:0;padding:0;background:#faf9f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#161515;">
    <div style="display:none;font-size:1px;color:#faf9f9;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
      ${safeName} just reached out about your listing on UNO — ${CONTACT_METHOD_REACH_OUT[contactMethod]}.
    </div>
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="email-bg" style="background:#faf9f9;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="card" style="max-width:480px;background:#ffffff;border-radius:16px;padding:40px 32px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
            <tr>
              <td>
                <div style="font-size:24px;font-weight:700;color:#af2525;letter-spacing:-0.02em;">uno</div>

                <h1 class="heading-text" style="margin:32px 0 12px;font-size:22px;font-weight:600;line-height:1.3;color:#161515;">
                  New enquiry on ${safeTitle}
                </h1>
                <p class="muted-65" style="margin:0 0 28px;font-size:15px;line-height:1.6;color:rgba(10,10,10,0.65);">
                  <strong class="value-text" style="color:#161515;">${safeName}</strong> just reached out about your listing &mdash; just now.
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="details-box" style="background:#faf9f9;border:1px solid rgba(186,186,186,0.65);border-radius:12px;">
                  <tr>
                    <td style="padding:24px;">
                      <div style="margin-bottom:16px;">
                        <div class="label-muted" style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,10,10,0.4);margin-bottom:4px;">Renter</div>
                        <div class="value-text" style="font-size:15px;font-weight:600;color:#161515;">${safeName}</div>
                      </div>
                      ${phoneRow}
                      ${emailRow}
                      ${messageRow}
                      <div style="margin-bottom:0;">
                        <div class="label-muted" style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,10,10,0.4);margin-bottom:6px;">Prefers to be contacted via</div>
                        <table cellpadding="0" cellspacing="0" role="presentation"><tr>
                          <td style="padding-right:8px;"><div style="width:8px;height:8px;border-radius:50%;background:${dotColor};font-size:0;line-height:0;">&nbsp;</div></td>
                          <td class="value-text" style="font-size:15px;font-weight:600;color:#161515;">${methodLabel}</td>
                        </tr></table>
                      </div>

                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="divider-line" style="border-top:1px solid rgba(186,186,186,0.4);margin-top:20px;">
                        <tr><td style="padding-top:16px;">
                          <div class="label-muted" style="font-size:11px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,10,10,0.4);margin-bottom:4px;">Listing</div>
                          <div class="value-text" style="font-size:15px;font-weight:600;color:#161515;margin-bottom:2px;">${safeTitle}</div>
                          <div class="muted-65" style="font-size:13px;color:rgba(10,10,10,0.65);">${safeLocation}</div>
                        </td></tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" class="cta-table" style="margin-top:24px;">
                  <tr>
                    <td class="cta-td-first" style="width:50%;padding-right:6px;" valign="top">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td align="center" bgcolor="#af2525" style="background:#af2525;border-radius:10px;">
                            <a href="${escapeHtml(primaryCta.href)}" style="display:block;padding:14px 12px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${escapeHtml(primaryCta.label)}</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td style="width:50%;padding-left:6px;" valign="top">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td align="center" class="btn-secondary-td" style="border-radius:10px;">
                            <a href="${escapeHtml(inboxUrl)}" class="btn-secondary-link" style="display:block;padding:13px 12px;font-size:14px;font-weight:600;color:#af2525;text-decoration:none;border:1px solid rgba(175,37,37,0.35);border-radius:10px;">View full enquiry</a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p class="muted-40" style="margin:28px 0 0;font-size:13px;line-height:1.6;color:rgba(10,10,10,0.4);">
                  This lead was logged in your UNO dashboard.
                </p>
                <hr class="footer-divider" style="border:0;border-top:1px solid rgba(186,186,186,0.4);margin:20px 0 24px;">
                <p class="muted-40" style="margin:0;font-size:12px;color:rgba(10,10,10,0.4);">
                  UNO &mdash; Find your dream home in Nigeria.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    </body>
    </html>
  `;

	const textLines = [
		`New enquiry on ${propertyTitle}`,
		"",
		`${tenantName} just reached out about your listing — just now.`,
		"",
		"LEAD DETAILS",
		`Renter: ${tenantName}`,
		...(tenantPhone ? [`Phone: ${tenantPhone}`] : []),
		...(tenantEmail ? [`Email: ${tenantEmail}`] : []),
		...(message ? [`Message: "${message}"`] : []),
		`Prefers to be contacted via: ${methodLabel}`,
		"",
		`Listing: ${propertyTitle}`,
		propertyLocation,
		"",
		`${primaryCta.label}: ${primaryCta.href}`,
		`View full enquiry: ${inboxUrl}`,
		"",
		"This lead was logged in your UNO dashboard.",
		"---",
		"UNO — Find your dream home in Nigeria.",
	];

	return sendEmail({ to, subject, html, text: textLines.join("\n") });
}
