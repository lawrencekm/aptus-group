import "server-only";
import { createHmac, randomBytes, randomInt, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { store } from "./store";
import { SESSION_COOKIE, verifySession } from "./session";

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0] || "unknown").trim();
}

export async function userAgent(): Promise<string> {
  const h = await headers();
  return (h.get("user-agent") || "").slice(0, 160);
}

/** Fixed-window rate limit. Returns true when the request is allowed. */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const n = await store().incr(`rl:${key}`, windowSeconds);
  return n <= limit;
}

export function hmac(value: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET || "").update(value).digest("hex");
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export function otpCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function randomId(bytes = 12): string {
  return randomBytes(bytes).toString("base64url");
}

// Crockford-style alphabet without I, L, O, U, 0, 1 to avoid misreading codes on receipts.
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";

/** 10-character public tracking code (~49 bits). Used in the URL instead of a named slug. */
export function trackingCode(length = 10): string {
  let out = "";
  for (let i = 0; i < length; i++) out += CODE_ALPHABET[randomInt(0, CODE_ALPHABET.length)];
  return out;
}

export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function maskPhone(phone: string): string {
  if (phone.length < 7) return "•••";
  return `${phone.slice(0, 4)} ••• ••${phone.slice(-3)}`;
}

/**
 * Validates the admin session cookie AND that the session has not been revoked.
 * Returns the session id or null.
 */
export async function currentAdmin(): Promise<string | null> {
  const jar = await cookies();
  const claims = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  const live = await store().get<{ createdAt: number }>(`session:${claims.sid}`);
  return live ? claims.sid : null;
}

/** Rejects cross-site state-changing requests (defence in depth on top of SameSite=Strict). */
export async function sameOrigin(req: Request): Promise<boolean> {
  const origin = req.headers.get("origin");
  if (!origin) return true; // same-origin fetches from some browsers omit Origin on GET; mutating fetches send it
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { "Cache-Control": "no-store" } });
}
