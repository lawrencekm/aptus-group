import { adminRoute, shipmentFromBody } from "@/lib/api";
import { addEvent, deleteShipment, getShipment, logActivity, saveShipment } from "@/lib/data";
import { json } from "@/lib/security";

export const dynamic = "force-dynamic";

type P = { id: string };

export const GET = adminRoute<P>(async (_req, _ctx, { id }) => {
  const s = await getShipment(id);
  return s ? json({ shipment: s }) : json({ error: "Not found" }, 404);
});

export const PATCH = adminRoute<P>(async (req, { ip }, { id }) => {
  const s = await getShipment(id);
  if (!s) return json({ error: "Not found" }, 404);
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const { input, error } = shipmentFromBody(body);
  if (!input) return json({ error }, 400);

  const statusChanged = input.status !== s.status;
  Object.assign(s, {
    title: input.title,
    holder: input.holder,
    reference: input.reference,
    service: input.service,
    origin: input.origin,
    destination: input.destination,
    markdown: input.markdown,
    receipt: input.receipt,
  });
  let saved;
  if (statusChanged) {
    // A status change from the edit form is recorded on the timeline.
    saved = await addEvent(s, { status: input.status, location: input.location, note: input.note });
    await logActivity("shipment.status", `${s.trackingNumber} → ${input.status}`, { ip, ref: s.id });
  } else {
    saved = await saveShipment(s);
  }
  await logActivity("shipment.updated", `Edited ${s.trackingNumber}`, { ip, ref: s.id });
  return json({ shipment: saved });
});

export const DELETE = adminRoute<P>(async (_req, { ip }, { id }) => {
  const s = await getShipment(id);
  if (!s) return json({ error: "Not found" }, 404);
  await deleteShipment(s);
  await logActivity("shipment.deleted", `Deleted ${s.trackingNumber} (${s.holder})`, { ip, ref: s.id });
  return json({ ok: true });
});
