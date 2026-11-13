import "server-only";
import { store } from "./store";
import { logActivity } from "./data";
import { verifySolution } from "./pow";
import { rateLimit } from "./security";

export function powSecret(): string {
  return `${process.env.SESSION_SECRET || "dev-only-secret"}:forms`;
}

type Guard = { ok: true } | { ok: false; status: number; error: string; silent?: boolean };

/**
 * Layered checks before a public form may store data or send email:
 * honeypot field, signed proof-of-work (also a time trap), single-use challenge,
 * per-IP rate limit and a global hourly cap so the mailbox cannot be flooded.
 */
export async function guardForm(body: Record<string, unknown>, ip: string, form: string): Promise<Guard> {
  // Honeypot: real visitors never see this field. Pretend success so bots learn nothing.
  if (typeof body.company_website === "string" && body.company_website.trim()) {
    await logActivity("bot.blocked", `Honeypot triggered on ${form} form`, { ip });
    return { ok: false, status: 200, error: "", silent: true };
  }

  const pow = verifySolution(powSecret(), body.pow_challenge, body.pow_nonce);
  if (!pow.ok) {
    await logActivity("bot.blocked", `Bot check failed on ${form} form (${pow.reason})`, { ip });
    const error =
      pow.reason === "too_fast"
        ? "That was quick! Please wait a moment and send again."
        : pow.reason === "expired"
          ? "This form expired. Refresh the page and try again."
          : "Security check failed. Refresh the page and try again.";
    return { ok: false, status: 400, error };
  }
  // Each challenge can be used once.
  const usedKey = `pow:used:${pow.id}`;
  if (await store().get(usedKey)) return { ok: false, status: 400, error: "This form was already sent. Refresh to send another." };
  await store().set(usedKey, 1, 60 * 60);

  if (!(await rateLimit(`form:${form}:${ip}`, 5, 3600))) {
    return { ok: false, status: 429, error: "Too many messages from your network. Please call us instead." };
  }
  if (!(await rateLimit(`form:all:hour`, 60, 3600))) {
    return { ok: false, status: 429, error: "We are receiving a lot of messages right now. Please call us instead." };
  }
  return { ok: true };
}

/** Limits acknowledgement emails per recipient so the site cannot be used to spam an address. */
export async function mayEmailRecipient(email: string): Promise<boolean> {
  return rateLimit(`ack:${email.toLowerCase()}`, 3, 60 * 60 * 24);
}
