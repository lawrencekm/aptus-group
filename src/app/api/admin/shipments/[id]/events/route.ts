import { adminRoute, optStr, str } from "@/lib/api";
import { addEvent, getShipment, isStatus, logActivity, removeEvent } from "@/lib/data";
import { json } from "@/lib/security";

export const dynamic = "force-dynamic";

type P = { id: string };

export const POST = adminRoute<P>(async (req, { ip }, { id }) => {
  const s = await getShipment(id);
  if (!s) return json({ error: "Not found" }, 404);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const status = str(body.status, 40);
  if (!isStatus(status)) return json({ error: "Unknown status." }, 400);
  const atRaw = str(body.at, 40);
  const at = atRaw && !Number.isNaN(Date.parse(atRaw)) ? new Date(atRaw).toISOString() : undefined;
  const saved = await addEvent(s, { status, at, location: optStr(body.location, 120), note: optStr(body.note, 500) });
  await logActivity("shipment.status", `${s.trackingNumber} → ${status}`, { ip, ref: s.id });
  return json({ shipment: saved });
});

export const DELETE = adminRoute<P>(async (req, { ip }, { id }) => {
  const s = await getShipment(id);
  if (!s) return json({ error: "Not found" }, 404);
  const eventId = new URL(req.url).searchParams.get("eventId") || "";
  const saved = await removeEvent(s, eventId);
  await logActivity("shipment.updated", `Removed a timeline entry from ${s.trackingNumber}`, { ip, ref: s.id });
  return json({ shipment: saved });
});
