import { adminRoute, optStr, str } from "@/lib/api";
import { getShipment, logActivity } from "@/lib/data";
import { MailNotConfigured, htmlEmail, isEmail, sendMail } from "@/lib/mail";
import { shipmentReceiptPdf } from "@/lib/pdf";
import { json, rateLimit } from "@/lib/security";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Emails the Safe Keeping Receipt (PDF attached) to an address the admin enters. */
export const POST = adminRoute<{ id: string }>(async (req, { ip }, { id }) => {
  const s = await getShipment(id);
  if (!s) return json({ error: "Not found" }, 404);
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const to = str(b.email, 160);
  const note = optStr(b.message, 1000);
  if (!isEmail(to)) return json({ error: "Enter a valid email address." }, 400);
  if (!(await rateLimit("admin:send-receipt", 40, 3600))) return json({ error: "Sending limit reached. Try again in an hour." }, 429);

  const link = `${site.url}/t/${s.code}`;
  const pdf = await shipmentReceiptPdf(s);
  const paragraphs = [
    `Dear ${s.holder},`,
    `Please find attached your Safe Keeping Receipt ${s.trackingNumber} for: ${s.title}.`,
    ...(note ? [note] : []),
    `Current status: ${s.status}. You can follow every update on your private tracking page using code ${s.code}.`,
    `Keep this receipt safe. Goods are released only against the original ID of the holder or a signed authorisation.`,
  ];
  try {
    await sendMail({
      to,
      subject: `Safe Keeping Receipt ${s.trackingNumber} - ${site.name}`,
      text: `${paragraphs.join("\n\n")}\n\nTrack: ${link}\n\n${site.name} · ${site.phoneDisplay}`,
      html: htmlEmail(`Safe Keeping Receipt ${s.trackingNumber}`, paragraphs, { label: "Track your shipment", href: link }),
      attachments: [{ filename: `Aptus-Receipt-${s.trackingNumber}.pdf`, content: pdf, contentType: "application/pdf" }],
    });
  } catch (e) {
    console.error("send-receipt failed", e);
    return json({ error: e instanceof MailNotConfigured ? e.message : "The email could not be sent. Check the mail settings." }, 502);
  }
  await logActivity("shipment.receipt_sent", `Receipt ${s.trackingNumber} emailed to ${to}`, { ip, ref: s.id });
  return json({ ok: true });
});
