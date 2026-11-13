import "server-only";
import { cookies } from "next/headers";
import { store } from "./store";
import { logActivity } from "./data";
import { hmac, randomId, safeEqual, userAgent } from "./security";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "./session";

/**
 * Login method. "password" (default when ADMIN_PASSWORD is set) or "otp" (SMS code via
 * the configured SMS provider). Set AUTH_MODE=otp to switch back to SMS codes later.
 */
export function authMode(): "password" | "otp" {
  if (process.env.AUTH_MODE === "otp") return "otp";
  return process.env.ADMIN_PASSWORD ? "password" : "otp";
}

export const MIN_PASSWORD_LENGTH = 10;

/** Constant-time check of the admin password from the environment. */
export function checkPassword(input: string, expected = process.env.ADMIN_PASSWORD || ""): boolean {
  if (expected.length < MIN_PASSWORD_LENGTH || !input) return false;
  return safeEqual(hmac(`pw:${input}`), hmac(`pw:${expected}`));
}

/** Creates a revocable server-side session and sets the signed cookie. */
export async function startSession(ip: string): Promise<void> {
  const sid = randomId(18);
  await store().set(`session:${sid}`, { createdAt: Date.now(), ip, ua: await userAgent() }, SESSION_TTL_SECONDS);
  await store().set("auth:lastLogin", { at: new Date().toISOString(), ip }, 60 * 60 * 24 * 365);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, await signSession(sid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  await logActivity("auth.login", "Admin signed in", { ip });
}
