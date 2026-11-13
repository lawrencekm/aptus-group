import "server-only";
import { clientIp, currentAdmin, json, sameOrigin } from "./security";
import { isStatus, type ShipmentInput } from "./data";
import { parseFrontmatter } from "./frontmatter";

type Ctx = { ip: string; sid: string };

/** Wraps an admin route handler: checks session (incl. revocation) and origin. */
export function adminRoute<P extends Record<string, string> = Record<string, string>>(
  handler: (req: Request, ctx: Ctx, params: P) => Promise<Response>
) {
  return async (req: Request, route: { params: Promise<P> }) => {
    if (req.method !== "GET" && !(await sameOrigin(req))) return json({ error: "Bad origin" }, 403);
    const sid = await currentAdmin();
    if (!sid) return json({ error: "Session expired. Sign in again." }, 401);
    try {
      return await handler(req, { ip: await clientIp(), sid }, await route.params);
    } catch (e) {
      console.error(e);
      return json({ error: "Something went wrong." }, 500);
    }
  };
}

export function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
export function optStr(v: unknown, max: number): string | undefined {
  const s = str(v, max);
  return s || undefined;
}

/**
 * Builds shipment fields from a request body. Explicit fields win; anything left
 * empty is filled from the markdown frontmatter, so uploading a .md file alone works.
 */
export function shipmentFromBody(body: Record<string, unknown>): { input?: ShipmentInput; error?: string } {
  const raw = str(body.markdown, 50_000);
  const { meta, body: md } = parseFrontmatter(raw);
  const status = str(body.status, 40) || meta.status || "Received";
  const input: ShipmentInput = {
    title: str(body.title, 160) || meta.title || "",
    holder: str(body.holder, 120) || meta.holder || "",
    reference: optStr(body.reference, 80) || meta.reference,
    service: str(body.service, 80) || meta.service || "Safe Custody",
    origin: optStr(body.origin, 120) || meta.origin,
    destination: optStr(body.destination, 120) || meta.destination,
    status: status as ShipmentInput["status"],
    markdown: md,
    location: optStr(body.location, 120) || meta.location,
    note: optStr(body.note, 500),
  };
  if (!input.title) return { error: "Add a short description of the shipment (title)." };
  if (!input.holder) return { error: "Add the holder / customer name." };
  if (!isStatus(input.status)) return { error: "Unknown status." };
  return { input };
}
