import { adminRoute, shipmentFromBody } from "@/lib/api";
import { createShipment, logActivity } from "@/lib/data";
import { json } from "@/lib/security";

export const dynamic = "force-dynamic";

export const POST = adminRoute(async (req, { ip }) => {
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { input, error } = shipmentFromBody(body);
  if (!input) return json({ error }, 400);
  const s = await createShipment(input);
  await logActivity("shipment.created", `Created ${s.trackingNumber} for ${s.holder}`, { ip, ref: s.id });
  return json({ shipment: s }, 201);
});
