import { adminRoute } from "@/lib/api";
import { getShipment } from "@/lib/data";
import { shipmentReceiptPdf } from "@/lib/pdf";
import { json } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Full (unmasked) receipt for the admin. */
export const GET = adminRoute<{ id: string }>(async (_req, _ctx, { id }) => {
  const s = await getShipment(id);
  if (!s) return json({ error: "Not found" }, 404);
  const pdf = await shipmentReceiptPdf(s);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Aptus-Receipt-${s.trackingNumber}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
});
