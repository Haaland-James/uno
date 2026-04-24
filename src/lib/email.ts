import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "UNO <onboarding@resend.dev>";

interface SendOtpParams {
  to: string;
  code: string;
  purpose: "SIGNUP" | "LOGIN" | "EMAIL_CHANGE";
  name?: string;
}

const SUBJECTS: Record<SendOtpParams["purpose"], string> = {
  SIGNUP: "Welcome to UNO — verify your email",
  LOGIN: "Your UNO sign-in code",
  EMAIL_CHANGE: "Confirm your new email on UNO",
};

export async function sendOtpEmail({ to, code, purpose, name }: SendOtpParams) {
  const subject = SUBJECTS[purpose];
  const greeting = name ? `Hi ${name.split(" ")[0]},` : "Hi there,";
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
                        ${code}
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

  const result = await resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    text,
  });

  if (result.error) {
    throw new Error(`Resend error: ${result.error.message}`);
  }
  return result.data;
}
