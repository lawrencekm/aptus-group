import { describe, expect, it } from "vitest";
import { POW_BITS, POW_MIN_AGE_MS, issueChallenge, leadingZeroBits, powHash, solve, verifySolution } from "@/lib/pow";

const SECRET = "unit-test-secret";

describe("proof-of-work bot check", () => {
  it("counts leading zero bits", () => {
    expect(leadingZeroBits(new Uint8Array([0, 0, 0x0f]))).toBe(20);
    expect(leadingZeroBits(new Uint8Array([0x80]))).toBe(0);
    expect(leadingZeroBits(new Uint8Array([0, 1]))).toBe(15);
  });

  it("accepts a solved challenge after the minimum age", () => {
    const t0 = Date.now();
    const ch = issueChallenge(SECRET, t0);
    const nonce = solve(ch);
    expect(leadingZeroBits(powHash(ch, nonce))).toBeGreaterThanOrEqual(POW_BITS);
    const r = verifySolution(SECRET, ch, String(nonce), t0 + POW_MIN_AGE_MS + 10);
    expect(r.ok).toBe(true);
  });

  it("rejects submissions that are too fast (time trap)", () => {
    const t0 = Date.now();
    const ch = issueChallenge(SECRET, t0);
    expect(verifySolution(SECRET, ch, solve(ch), t0 + 500)).toEqual({ ok: false, reason: "too_fast" });
  });

  it("rejects expired challenges", () => {
    const t0 = Date.now() - 31 * 60 * 1000;
    const ch = issueChallenge(SECRET, t0);
    expect(verifySolution(SECRET, ch, solve(ch))).toEqual({ ok: false, reason: "expired" });
  });

  it("rejects forged or tampered challenges", () => {
    const t0 = Date.now() - 10_000;
    const ch = issueChallenge("another-secret", t0);
    expect(verifySolution(SECRET, ch, solve(ch))).toEqual({ ok: false, reason: "signature" });

    const good = issueChallenge(SECRET, t0);
    const [ts, id, , sig] = good.split(".");
    const easier = `${ts}.${id}.1.${sig}`; // lowering difficulty breaks the signature
    expect(verifySolution(SECRET, easier, 0).ok).toBe(false);
  });

  it("rejects missing or wrong work", () => {
    const t0 = Date.now() - 10_000;
    const ch = issueChallenge(SECRET, t0);
    const n = solve(ch);
    // Find a nonce that does NOT satisfy the difficulty.
    let bad = n + 1;
    while (leadingZeroBits(powHash(ch, bad)) >= POW_BITS) bad++;
    expect(verifySolution(SECRET, ch, bad)).toEqual({ ok: false, reason: "work" });
    expect(verifySolution(SECRET, undefined, n)).toEqual({ ok: false, reason: "malformed" });
    expect(verifySolution(SECRET, "a.b", n)).toEqual({ ok: false, reason: "malformed" });
  });
});
