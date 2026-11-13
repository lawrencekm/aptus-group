import { authMode, checkPassword, MIN_PASSWORD_LENGTH, startSession } from "@/lib/auth";
import { logActivity } from "@/lib/data";
import { clientIp, json, rateLimit, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

/** Password sign-in for the single admin (ADMIN_PASSWORD). */
export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return json({ error: "Bad origin" }, 403);
  if (authMode() !== "password") return json({ error: "Password sign-in is turned off." }, 400);
  if ((process.env.ADMIN_PASSWORD || "").length < MIN_PASSWORD_LENGTH) {
    return json({ error: `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.` }, 500);
  }

  const ip = await clientIp();
  // Per-IP and global limits stop password guessing; failures are visible in the activity feed.
  if (!(await rateLimit(`pw:ip:${ip}`, 8, 900)) || !(await rateLimit("pw:all", 40, 3600))) {
    return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
  }

  const body = (await req.json().catch(() => ({}))) as { password?: unknown };
  const password = typeof body.password === "string" ? body.password.slice(0, 200) : "";
  if (!checkPassword(password)) {
    await logActivity("auth.failed", "Wrong admin password", { ip });
    await new Promise((r) => setTimeout(r, 600));
    return json({ error: "Wrong password." }, 401);
  }

  await startSession(ip);
  return json({ ok: true });
}

export async function GET() {
  return json({ mode: authMode() });
}
