import "server-only";
import { promises as fs } from "fs";
import path from "path";
import nodemailer from "nodemailer";
import { site } from "./site";

/**
 * Outgoing email. Configure ONE of:
 *  - SMTP (e.g. Gmail with an app password): SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
 *  - Resend: RESEND_API_KEY
 * MAIL_FROM sets the sender (defaults to SMTP_USER), MAIL_TO the inbox that receives
 * website requests (defaults to the company email).
 * In development without either, messages are written to .data/outbox/ instead.
 */

export type Attachment = { filename: string; content: Uint8Array; contentType?: string };
export type Mail = { to: string; subject: string; text: string; html?: string; replyTo?: string; attachments?: Attachment[] };

export class MailNotConfigured extends Error {
  constructor() {
    super("Email is not configured. Set SMTP_HOST/SMTP_USER/SMTP_PASS (or RESEND_API_KEY) in the environment.");
  }
}

export function mailMode(): "smtp" | "resend" | "outbox" | "none" {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return "smtp";
  return process.env.NODE_ENV === "production" ? "none" : "outbox";
}

export function inbox(): string {
  return process.env.MAIL_TO || site.email;
}

function from(): string {
  return process.env.MAIL_FROM || (process.env.SMTP_USER ? `${site.name} <${process.env.SMTP_USER}>` : `${site.name} <${site.email}>`);
}

export function isEmail(v: string): boolean {
  return /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}$/i.test(v) && v.length <= 160;
}

export async function sendMail(m: Mail): Promise<void> {
  if (!isEmail(m.to)) throw new Error("Invalid recipient email.");
  // Strip header-breaking characters from user-influenced header values.
  const subject = m.subject.replace(/[\r\n]+/g, " ").slice(0, 200);
  const replyTo = m.replyTo && isEmail(m.replyTo) ? m.replyTo : undefined;
  const mode = mailMode();

  if (mode === "resend") {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from(),
        to: [m.to],
        subject,
        text: m.text,
        html: m.html,
        reply_to: replyTo,
        attachments: m.attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content).toString("base64") })),
      }),
    });
    if (!res.ok) throw new Error(`Resend error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    return;
  }

  if (mode === "smtp") {
    const port = Number(process.env.SMTP_PORT || 465);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transport.sendMail({
      from: from(),
      to: m.to,
      subject,
      text: m.text,
      html: m.html,
      replyTo,
      attachments: m.attachments?.map((a) => ({ filename: a.filename, content: Buffer.from(a.content), contentType: a.contentType })),
    });
    return;
  }

  if (mode === "outbox") {
    const dir = path.join(process.cwd(), ".data", "outbox");
    await fs.mkdir(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const base = path.join(dir, `${stamp}-${m.to.replace(/[^a-z0-9@.]/gi, "_")}`);
    await fs.writeFile(`${base}.txt`, `To: ${m.to}\nFrom: ${from()}\nReply-To: ${replyTo ?? ""}\nSubject: ${subject}\n\n${m.text}\n`);
    for (const a of m.attachments ?? []) await fs.writeFile(`${base}-${a.filename}`, a.content);
    console.log(`[mail:outbox] ${subject} -> ${m.to} (${m.attachments?.length ?? 0} attachment(s)) saved to .data/outbox`);
    return;
  }

  throw new MailNotConfigured();
}

/** Simple branded HTML wrapper for plain-text messages. */
export function htmlEmail(heading: string, paragraphs: string[], cta?: { label: string; href: string }): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  return `<!doctype html><html><body style="margin:0;background:#f5f7fa;font-family:Arial,Helvetica,sans-serif;color:#1a2232">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;overflow:hidden;border:1px solid #e8ecf2">
<tr><td style="background:#0e1420;padding:20px 24px;color:#fff;font-weight:bold;font-size:18px">
<span style="display:inline-block;width:12px;height:12px;background:#f0442e;border-radius:3px;margin-right:8px"></span>${esc(site.name)}</td></tr>
<tr><td style="padding:24px">
<h1 style="margin:0 0 12px;font-size:20px;color:#0e1420">${esc(heading)}</h1>
${paragraphs.map((p) => `<p style="margin:0 0 12px;line-height:1.55;white-space:pre-line">${esc(p)}</p>`).join("")}
${cta ? `<p style="margin:20px 0 4px"><a href="${esc(cta.href)}" style="background:#f0442e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:bold;display:inline-block">${esc(cta.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 24px;background:#f5f7fa;font-size:12px;color:#5f6b7d">${esc(site.name)} · ${esc(site.address.street)}, ${esc(site.address.locality)} · ${esc(site.phoneDisplay)} · ${esc(site.email)}</td></tr>
</table></td></tr></table></body></html>`;
}
