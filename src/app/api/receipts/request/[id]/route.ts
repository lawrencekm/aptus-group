import { getQuote } from "@/lib/data";
import { requestReceiptPdf } from "@/lib/pdf";
import { hmac, json, safeEqual } from "@/lib/security";

export const dynamic = "force-dynamic";

/** PDF receipt for a quote request / contact message. The link is signed, so ids cannot be enumerated. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sig = new URL(req.url).searchParams.get("sig") || "";
  if (!/^[\w-]{6,20}$/.test(id) || !safeEqual(sig, hmac(`request:${id}`).slice(0, 32))) return json({ error: "Not found" }, 404);
  const q = await getQuote(id);
  if (!q) return json({ error: "Not found" }, 404);
  const pdf = await requestReceiptPdf(q);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Aptus-${q.ref ?? q.id}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
