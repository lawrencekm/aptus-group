import "server-only";
import { addQuote, logActivity } from "./data";
import { guardForm, mayEmailRecipient } from "./botguard";
import { htmlEmail, inbox, isEmail, sendMail } from "./mail";
import { requestReceiptPdf } from "./pdf";
import { clientIp, hmac, json, sameOrigin } from "./security";
import { site } from "./site";
import { str, optStr } from "./api";
import type { Quote } from "./types";

export function requestReceiptPath(id: string): string {
  return `/api/receipts/request/${id}?sig=${hmac(`request:${id}`).slice(0, 32)}`;
}

/** Handles POSTs from the public quote and contact forms. */
export async function handlePublicRequest(req: Request, kind: "quote" | "contact"): Promise<Response> {
  if (!(await sameOrigin(req))) return json({ error: "Bad origin" }, 403);
  const ip = await clientIp();
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const guard = await guardForm(b, ip, kind);
  if (!guard.ok) return guard.silent ? json({ ok: true }) : json({ error: guard.error }, guard.status);

  const name = str(b.name, 120);
  const phone = str(b.phone, 40);
  const email = optStr(b.email, 160);
  const details = str(kind === "quote" ? b.details : b.message, 2000);
  const service = str(kind === "quote" ? b.service : b.subject, 80) || (kind === "quote" ? "General" : "General enquiry");

  if (!name || !details) return json({ error: `Name and ${kind === "quote" ? "details" : "message"} are required.` }, 400);
  if (kind === "quote" && !phone) return json({ error: "Add a phone number so we can call you back." }, 400);
  if (kind === "contact" && !phone && !email) return json({ error: "Add an email or phone number so we can reply." }, 400);
  if (email && !isEmail(email)) return json({ error: "That email address doesn't look right." }, 400);

  const q = await addQuote({ kind, name, phone, email, service, details });
  await logActivity(kind === "quote" ? "quote.received" : "contact.received", `${kind === "quote" ? "Quote request" : "Message"} ${q.ref} from ${name} (${service})`, { ip, ref: q.id });

  const pdf = await requestReceiptPdf(q);
  const receiptUrl = requestReceiptPath(q.id);
  await notify(q, pdf, ip);

  return json({ ok: true, ref: q.ref, receiptUrl });
}

/** Emails the company inbox and (rate-limited) the customer. Email failures never lose the request. */
async function notify(q: Quote, pdf: Uint8Array, ip: string) {
  const filename = `Aptus-${q.ref}.pdf`;
  const label = q.kind === "contact" ? "Contact message" : "Quote request";
  const lines = [
    `${label} ${q.ref}`,
    `Name: ${q.name}`,
    `Phone: ${q.phone || "-"}`,
    `Email: ${q.email || "-"}`,
    `${q.kind === "contact" ? "Subject" : "Service"}: ${q.service}`,
    "",
    q.details,
    "",
    `Sender IP: ${ip}`,
  ];
  try {
    await sendMail({
      to: inbox(),
      subject: `[Website] ${label} ${q.ref} from ${q.name}`,
      text: lines.join("\n"),
      html: htmlEmail(`${label} ${q.ref}`, lines.slice(1)),
      replyTo: q.email,
      attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
    });
  } catch (e) {
    console.error("Inbox email failed", e);
  }

  if (q.email && (await mayEmailRecipient(q.email))) {
    try {
      await sendMail({
        to: q.email,
        subject: `We received your request (${q.ref}) - ${site.name}`,
        text: `Hello ${q.name},\n\nThank you for contacting ${site.name}. Your reference is ${q.ref}. Our team will reply within one working day. Your request receipt is attached.\n\n${site.phoneDisplay} · ${site.url}`,
        html: htmlEmail("Thank you, we received your request", [
          `Hello ${q.name},`,
          `Your reference is ${q.ref}. Our team will reply within one working day. Your request receipt is attached as a PDF.`,
          `Need us sooner? Call or WhatsApp ${site.phoneDisplay}.`,
        ]),
        attachments: [{ filename, content: pdf, contentType: "application/pdf" }],
      });
    } catch (e) {
      console.error("Acknowledgement email failed", e);
    }
  }
}
