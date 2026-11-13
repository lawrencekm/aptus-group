import { addQuote, logActivity } from "@/lib/data";
import { str, optStr } from "@/lib/api";
import { clientIp, json, rateLimit, sameOrigin } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (!(await sameOrigin(req))) return json({ error: "Bad origin" }, 403);
  const ip = await clientIp();
  if (!(await rateLimit(`quote:${ip}`, 5, 3600))) return json({ error: "Too many requests. Please call us instead." }, 429);

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  if (str(b.company_website, 200)) return json({ ok: true }); // honeypot field for bots

  const name = str(b.name, 120);
  const phone = str(b.phone, 40);
  const details = str(b.details, 2000);
  if (!name || !phone || !details) return json({ error: "Name, phone and details are required." }, 400);

  const q = await addQuote({ name, phone, email: optStr(b.email, 160), service: str(b.service, 80) || "General", details });
  await logActivity("quote.received", `Quote request from ${name} (${q.service})`, { ip, ref: q.id });
  return json({ ok: true });
}
