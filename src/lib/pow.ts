// Invisible bot check for public forms (no third-party service, no cookies).
//
// The server hands out a signed challenge; the browser must find a nonce so that
// sha256(challenge + ":" + nonce) starts with POW_BITS zero bits (~65k hashes, about
// a second in a browser, done while the visitor types). Bots that just POST to the
// API cannot submit without doing the work for every message, and each challenge is
// single-use, expires, and cannot be solved "too fast" (time trap).
import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

export const POW_BITS = 16;
export const POW_MIN_AGE_MS = 2500; // a human cannot fill and send a form faster
export const POW_MAX_AGE_MS = 30 * 60 * 1000;

function sign(secret: string, payload: string): string {
  return createHmac("sha256", secret).update(`pow:${payload}`).digest("hex").slice(0, 32);
}

export function issueChallenge(secret: string, now = Date.now(), bits = POW_BITS): string {
  const payload = `${now}.${randomBytes(9).toString("base64url")}.${bits}`;
  return `${payload}.${sign(secret, payload)}`;
}

export function leadingZeroBits(bytes: Uint8Array): number {
  let n = 0;
  for (const b of bytes) {
    if (b === 0) {
      n += 8;
      continue;
    }
    return n + Math.clz32(b) - 24;
  }
  return n;
}

export function powHash(challenge: string, nonce: string | number): Uint8Array {
  return createHash("sha256").update(`${challenge}:${nonce}`).digest();
}

export type PowResult = { ok: true; id: string } | { ok: false; reason: "malformed" | "signature" | "expired" | "too_fast" | "work" };

export function verifySolution(secret: string, challenge: unknown, nonce: unknown, now = Date.now()): PowResult {
  if (typeof challenge !== "string" || (typeof nonce !== "string" && typeof nonce !== "number")) return { ok: false, reason: "malformed" };
  const parts = challenge.split(".");
  if (parts.length !== 4) return { ok: false, reason: "malformed" };
  const [ts, id, bitsRaw, sig] = parts;
  const payload = `${ts}.${id}.${bitsRaw}`;
  const expected = sign(secret, payload);
  if (sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return { ok: false, reason: "signature" };
  const age = now - Number(ts);
  if (!Number.isFinite(age) || age > POW_MAX_AGE_MS || age < -60_000) return { ok: false, reason: "expired" };
  if (age < POW_MIN_AGE_MS) return { ok: false, reason: "too_fast" };
  const bits = Number(bitsRaw);
  if (!Number.isInteger(bits) || bits < POW_BITS) return { ok: false, reason: "malformed" };
  if (String(nonce).length > 20 || leadingZeroBits(powHash(challenge, nonce)) < bits) return { ok: false, reason: "work" };
  return { ok: true, id };
}

/** Reference solver (used by tests; the browser has its own WebCrypto version). */
export function solve(challenge: string, bits = POW_BITS): number {
  for (let n = 0; ; n++) if (leadingZeroBits(powHash(challenge, n)) >= bits) return n;
}
