import { describe, expect, it } from "vitest";
import { MIN_PASSWORD_LENGTH, checkPassword } from "@/lib/auth";
import { normalizeCode, trackingCode } from "@/lib/security";

describe("admin password", () => {
  const pw = "correct horse battery";
  it("accepts the configured password only", () => {
    expect(checkPassword(pw, pw)).toBe(true);
    expect(checkPassword("correct horse batterY", pw)).toBe(false);
    expect(checkPassword("", pw)).toBe(false);
  });
  it("refuses to work with a short or missing password", () => {
    expect(checkPassword("short", "short")).toBe(false);
    expect(checkPassword("anything", "")).toBe(false);
    expect(MIN_PASSWORD_LENGTH).toBeGreaterThanOrEqual(10);
  });
});

describe("tracking codes", () => {
  it("are 10 unambiguous characters", () => {
    for (let i = 0; i < 200; i++) expect(trackingCode()).toMatch(/^[2-9A-HJKMNP-TV-Z]{10}$/);
  });
  it("normalise user input", () => {
    expect(normalizeCode(" k7qm-29xd pa ")).toBe("K7QM29XDPA");
  });
});
