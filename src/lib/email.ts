import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY?.trim() ?? "";
const fromAddress =
  process.env.EMAIL_FROM?.trim() || "ProjManager <onboarding@resend.dev>";

export function isEmailConfigured() {
  return Boolean(resendApiKey);
}

export function appBaseUrl() {
  return (
    process.env.AUTH_URL?.replace(/\/$/, "") ||
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function appUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${appBaseUrl()}${p}`;
}

function getResend() {
  if (!resendApiKey) return null;
  return new Resend(resendApiKey);
}

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

/**
 * Sends via Resend when RESEND_API_KEY is set.
 * Without a key (local/dev), logs the payload and still returns ok so flows work.
 */
export async function sendEmail(input: SendEmailInput): Promise<{ ok: true } | { ok: false; error: string }> {
  const resend = getResend();
  if (!resend) {
    console.info("[email:dev]", {
      to: input.to,
      subject: input.subject,
      text: input.text ?? "(html only)",
    });
    return { ok: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: fromAddress,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[email] send failed:", message);
    return { ok: false, error: message };
  }
}

function shell(title: string, bodyHtml: string, footerNote?: string) {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#fff;border-radius:16px;padding:28px 28px 24px;border:1px solid #e5e7eb;">
        <tr><td>
          <div style="font-size:20px;font-weight:700;letter-spacing:-0.02em;margin-bottom:4px;">Proj<span style="color:#2563eb;">Manager</span></div>
          <h1 style="font-size:18px;margin:16px 0 12px;color:#111827;">${title}</h1>
          <div style="font-size:14px;line-height:1.55;color:#374151;">${bodyHtml}</div>
          ${
            footerNote
              ? `<p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">${footerNote}</p>`
              : ""
          }
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function cta(href: string, label: string) {
  return `<p style="margin:20px 0;"><a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:10px 18px;border-radius:10px;font-weight:600;font-size:14px;">${label}</a></p>
<p style="font-size:12px;color:#6b7280;word-break:break-all;">Or open: ${href}</p>`;
}

export async function sendVerificationEmail(to: string, name: string | null, verifyUrl: string) {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return sendEmail({
    to,
    subject: "Verify your ProjManager email",
    text: `${greeting}\n\nConfirm your email by opening:\n${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: shell(
      "Verify your email",
      `<p>${greeting}</p><p>Thanks for signing up. Confirm your email to activate your account.</p>${cta(verifyUrl, "Verify email")}`,
      "This link expires in 24 hours. If you did not create an account, you can ignore this email.",
    ),
  });
}

export async function sendPasswordResetEmail(to: string, name: string | null, resetUrl: string) {
  const greeting = name ? `Hi ${name},` : "Hi,";
  return sendEmail({
    to,
    subject: "Reset your ProjManager password",
    text: `${greeting}\n\nReset your password:\n${resetUrl}\n\nThis link expires in 1 hour.`,
    html: shell(
      "Reset your password",
      `<p>${greeting}</p><p>We received a request to reset your password.</p>${cta(resetUrl, "Choose new password")}`,
      "This link expires in 1 hour. If you did not request a reset, you can ignore this email.",
    ),
  });
}

export async function sendInviteEmail(input: {
  to: string;
  name: string | null;
  orgName: string;
  role: string;
  invitedBy: string;
  setupUrl: string;
}) {
  const greeting = input.name ? `Hi ${input.name},` : "Hi,";
  return sendEmail({
    to: input.to,
    subject: `You're invited to ${input.orgName} on ProjManager`,
    text: `${greeting}\n\n${input.invitedBy} invited you to ${input.orgName} as ${input.role}.\nSet your password:\n${input.setupUrl}`,
    html: shell(
      "You're invited",
      `<p>${greeting}</p>
       <p><strong>${input.invitedBy}</strong> invited you to <strong>${input.orgName}</strong> as <strong>${input.role}</strong>.</p>
       <p>Set your password to get started.</p>
       ${cta(input.setupUrl, "Set password & sign in")}`,
    ),
  });
}

export async function sendAssignmentEmail(input: {
  to: string;
  assigneeName: string | null;
  assignerName: string;
  issueKey: string;
  title: string;
  projectName: string;
  issueUrl: string;
}) {
  const greeting = input.assigneeName ? `Hi ${input.assigneeName},` : "Hi,";
  return sendEmail({
    to: input.to,
    subject: `Assigned: ${input.issueKey} — ${input.title}`,
    text: `${greeting}\n\n${input.assignerName} assigned you ${input.issueKey} (${input.title}) on ${input.projectName}.\n${input.issueUrl}`,
    html: shell(
      "Work assigned to you",
      `<p>${greeting}</p>
       <p><strong>${input.assignerName}</strong> assigned you an issue on <strong>${input.projectName}</strong>.</p>
       <p style="margin:12px 0;padding:12px 14px;background:#f3f4f6;border-radius:10px;">
         <strong>${input.issueKey}</strong><br/>${input.title}
       </p>
       ${cta(input.issueUrl, "Open issue")}`,
    ),
  });
}
