import { cookies } from "next/headers";
import { store } from "@/lib/store";
import { logActivity } from "@/lib/data";
import { clientIp, json, sameOrigin } from "@/lib/security";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return json({ error: "Bad origin" }, 403);
  const jar = await cookies();
  const claims = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (claims) {
    await store().del(`session:${claims.sid}`);
    await logActivity("auth.logout", "Admin signed out", { ip: await clientIp() });
  }
  jar.delete(SESSION_COOKIE);
  return json({ ok: true });
}
