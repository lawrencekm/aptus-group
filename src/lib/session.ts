// Edge-safe session helpers (used by middleware and route handlers).
import { SignJWT, jwtVerify } from "jose";

export const SESSION_COOKIE = "ag_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function secret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set to a random string of at least 32 characters.");
  }
  return new TextEncoder().encode(s);
}

export type SessionClaims = { sid: string; iat: number; exp: number };

export async function signSession(sid: string): Promise<string> {
  return new SignJWT({ sid })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setAudience("aptus-admin")
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

export async function verifySession(token: string | undefined): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { audience: "aptus-admin", algorithms: ["HS256"] });
    if (typeof payload.sid !== "string") return null;
    return payload as unknown as SessionClaims;
  } catch {
    return null;
  }
}
