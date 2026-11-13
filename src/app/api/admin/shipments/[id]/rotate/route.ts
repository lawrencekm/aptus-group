import { adminRoute } from "@/lib/api";
import { getShipment, logActivity, rotateCode } from "@/lib/data";
import { json } from "@/lib/security";

export const dynamic = "force-dynamic";

// Issues a new tracking code and invalidates the old link (e.g. if a link was shared by mistake).
export const POST = adminRoute<{ id: string }>(async (_req, { ip }, { id }) => {
  const s = await getShipment(id);
  if (!s) return json({ error: "Not found" }, 404);
  const saved = await rotateCode(s);
  await logActivity("shipment.code_rotated", `New tracking code issued for ${s.trackingNumber}`, { ip, ref: s.id });
  return json({ shipment: saved });
});
