import { store } from "@/lib/store";
import { logActivity } from "@/lib/data";
import { startSession } from "@/lib/auth";
import { clientIp, hmac, json, rateLimit, safeEqual, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return json({ error: "Bad origin" }, 403);
  const ip = await clientIp();
  if (!(await rateLimit(`otp:verify:ip:${ip}`, 20, 900))) {
    return json({ error: "Too many attempts. Try again in 15 minutes." }, 429);
  }

  const body = (await req.json().catch(() => ({}))) as { code?: string };
  const code = String(body.code || "").replace(/\D/g, "");
  if (code.length !== 6) return json({ error: "Enter the 6-digit code." }, 400);

  const current = await store().get<{ hash: string; attempts: number }>("otp:current");
  if (!current) return json({ error: "Code expired. Request a new one." }, 400);

  if (!safeEqual(hmac(code), current.hash)) {
    const attempts = current.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await store().del("otp:current");
      await logActivity("auth.failed", "Login code locked after too many wrong attempts", { ip });
      return json({ error: "Too many wrong codes. Request a new one." }, 400);
    }
    await store().set("otp:current", { ...current, attempts }, 300);
    await logActivity("auth.failed", "Wrong login code entered", { ip });
    return json({ error: `Wrong code. ${MAX_ATTEMPTS - attempts} attempt(s) left.` }, 400);
  }

  await store().del("otp:current");
  await startSession(ip);
  return json({ ok: true });
}
