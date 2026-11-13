import { getShipmentByCode, logActivity } from "@/lib/data";
import { shipmentReceiptPdf } from "@/lib/pdf";
import { clientIp, json, normalizeCode, rateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Safe Keeping Receipt for whoever holds the tracking code. Identity numbers are masked. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const code = normalizeCode((await params).code);
  const ip = await clientIp();
  if (!(await rateLimit(`track:${ip}`, 30, 600))) return json({ error: "Too many lookups. Try again shortly." }, 429);
  const s = await getShipmentByCode(code);
  if (!s) {
    await logActivity("track.miss", `Unknown code tried for receipt: ${code.slice(0, 3)}…`, { ip });
    return json({ error: "Not found" }, 404);
  }
  const pdf = await shipmentReceiptPdf(s, { masked: true });
  const download = new URL(req.url).searchParams.has("download");
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="Aptus-Receipt-${s.trackingNumber}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
