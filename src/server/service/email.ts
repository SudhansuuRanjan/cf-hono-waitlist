import type { Context } from "hono";
import { Resend } from "resend";

export const sendEmailWithResend = async (
  c: Context,
  email: string,
  subject: string,
  token: string,
) => {
  const confirmUrl = `${c.env.API_URL}/api/confirm?token=${token}`;
  const unsubUrl = `${c.env.API_URL}/api/unsubscribe?token=${token}`;
  const resend = new Resend(c.env.RESEND_API_KEY);

  const { data, error } = await resend.emails.send({
    from: "Nanomark <onboarding@resend.dev>",
    to: email,
    subject,
    html: `
      <div style="background-color:#f6f9fc;padding:24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;padding:32px;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
          
          <h2 style="margin:0 0 12px 0;color:#111827;font-size:22px;">
            Welcome to Nanomark 🚀
          </h2>

          <p style="margin:0 0 16px 0;color:#374151;font-size:15px;line-height:1.6;">
            Thanks for joining the <strong>Nanomark waitlist</strong>.
            Please confirm your email address to complete your subscription.
          </p>

          <div style="text-align:center;margin:28px 0;">
            <a
              href="${confirmUrl}"
              style="
                display:inline-block;
                background-color:#2563eb;
                color:#ffffff;
                text-decoration:none;
                padding:12px 20px;
                border-radius:6px;
                font-size:15px;
                font-weight:600;
              "
            >
              Confirm Email
            </a>
          </div>

          <p style="margin:0 0 16px 0;color:#6b7280;font-size:13px;line-height:1.5;">
            If the button doesn't work, copy and paste this link into your browser:
          </p>

          <p style="margin:0 0 24px 0;font-size:13px;word-break:break-all;">
            <a href="${confirmUrl}" style="color:#2563eb;text-decoration:none;">
              ${confirmUrl}
            </a>
          </p>

          <div style="text-align:center;margin:28px 0;">
            <a
              href="${unsubUrl}"
              style="
                display:inline-block;
                color:#9ca3af;
                text-decoration:none;
                font-size:12px;
              "
            >
              Unsubscribe
            </a>
          </div>  

          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;" />

          <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
            If you didn't request this email, you can safely ignore it.
          </p>

        </div>
      </div>
    `,
  });

  if (error) {
    console.error(error.message);
  }

  return data;
};
