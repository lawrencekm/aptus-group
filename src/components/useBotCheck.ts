"use client";

import { useCallback, useEffect, useRef } from "react";

type Token = { pow_challenge: string; pow_nonce: string };

function zeroBits(b: Uint8Array): number {
  let n = 0;
  for (const x of b) {
    if (x === 0) {
      n += 8;
      continue;
    }
    return n + Math.clz32(x) - 24;
  }
  return n;
}

async function solve(challenge: string, bits: number): Promise<string> {
  const enc = new TextEncoder();
  const BATCH = 512;
  for (let base = 0; base < 50_000_000; base += BATCH) {
    const hashes = await Promise.all(
      Array.from({ length: BATCH }, (_, i) => crypto.subtle.digest("SHA-256", enc.encode(`${challenge}:${base + i}`)))
    );
    for (let i = 0; i < BATCH; i++) if (zeroBits(new Uint8Array(hashes[i])) >= bits) return String(base + i);
  }
  throw new Error("No solution");
}

async function fetchAndSolve(): Promise<Token & { at: number }> {
  const r = await fetch("/api/challenge", { cache: "no-store" });
  const { challenge, bits } = (await r.json()) as { challenge: string; bits: number };
  return { pow_challenge: challenge, pow_nonce: await solve(challenge, bits), at: Date.now() };
}

/**
 * Invisible anti-bot check: fetches a challenge as soon as the form mounts and solves it
 * in the background, so by the time the visitor presses Send the proof is ready.
 */
export function useBotCheck() {
  const job = useRef<Promise<Token & { at: number }> | null>(null);

  useEffect(() => {
    job.current = fetchAndSolve();
    job.current.catch(() => (job.current = null));
  }, []);

  /** Returns a solved, unused token (and starts preparing the next one). */
  return useCallback(async (): Promise<Token> => {
    let t = job.current ? await job.current.catch(() => null) : null;
    if (!t || Date.now() - t.at > 25 * 60 * 1000) t = await fetchAndSolve();
    job.current = fetchAndSolve(); // each challenge is single-use
    job.current.catch(() => (job.current = null));
    return { pow_challenge: t.pow_challenge, pow_nonce: t.pow_nonce };
  }, []);
}
