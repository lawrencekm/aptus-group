"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";

function OtpLogin() {
  const router = useRouter();
  const [phase, setPhase] = useState<"start" | "code">("start");
  const [to, setTo] = useState<string | null>(null);
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    fetch("/api/auth/send-otp").then((r) => r.json()).then((d) => setTo(d.to)).catch(() => {});
  }, []);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function send() {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/send-otp", { method: "POST" });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) return setError(d.error || "Could not send code.");
    setPhase("code");
    setCooldown(45);
    setDigits(["", "", "", "", "", ""]);
    setTimeout(() => refs.current[0]?.focus(), 50);
  }

  async function verify(code: string) {
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    setBusy(false);
    setError(d.error || "Invalid code.");
    setDigits(["", "", "", "", "", ""]);
    refs.current[0]?.focus();
  }

  function setDigit(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      // Pasted or autofilled full code
      const next = clean.slice(0, 6).split("");
      while (next.length < 6) next.push("");
      setDigits(next);
      if (clean.length >= 6) verify(clean.slice(0, 6));
      else refs.current[clean.length]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = clean;
    setDigits(next);
    if (clean && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d)) verify(next.join(""));
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="grid-lines absolute inset-0" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" aria-hidden="true" />
      <main className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo light />
        </div>
        <div className="rounded-3xl bg-white/[0.04] p-7 ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
              <Icon name="lock" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold text-white">Admin sign in</h1>
              <p className="text-xs text-ink-400">One-time code by SMS</p>
            </div>
          </div>

          {phase === "start" ? (
            <>
              <p className="mt-6 text-sm text-ink-200">
                We&apos;ll text a 6-digit code to the registered admin phone{to ? <> ending <span className="font-mono text-white">{to.slice(-3)}</span></> : null}.
              </p>
              <button
                onClick={send}
                disabled={busy}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {busy ? "Sending…" : "Send code"} <Icon name="arrow" className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <p className="mt-6 text-sm text-ink-200">
                Enter the code sent to <span className="font-mono text-white">{to}</span>. It expires in 5 minutes.
              </p>
              <form
                className="mt-5 flex justify-between gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (digits.every((d) => d)) verify(digits.join(""));
                }}
              >
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      refs.current[i] = el;
                    }}
                    value={d}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !digits[i] && i > 0) refs.current[i - 1]?.focus();
                    }}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={i === 0 ? 6 : 1}
                    aria-label={`Digit ${i + 1}`}
                    disabled={busy}
                    className="h-14 w-full rounded-xl bg-white/5 text-center font-mono text-2xl text-white outline-none ring-1 ring-white/15 focus:ring-2 focus:ring-brand-500"
                  />
                ))}
              </form>
              <div className="mt-5 flex items-center justify-between text-sm">
                <button onClick={() => setPhase("start")} className="text-ink-400 hover:text-white">
                  Back
                </button>
                <button onClick={send} disabled={cooldown > 0 || busy} className="text-brand-500 hover:text-brand-100 disabled:text-ink-500">
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </>
          )}

          {error && (
            <p role="alert" className="mt-5 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
              {error}
            </p>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-ink-500">Authorised staff only. All sign-in attempts are logged.</p>
      </main>
    </div>
  );
}

export default function AdminLogin() {
  const [mode, setMode] = useState<"password" | "otp" | null>(null);
  useEffect(() => {
    fetch("/api/auth/login")
      .then((r) => r.json())
      .then((d) => setMode(d.mode === "otp" ? "otp" : "password"))
      .catch(() => setMode("password"));
  }, []);
  if (mode === "otp") return <OtpLogin />;
  return <PasswordLogin ready={mode === "password"} />;
}

function PasswordLogin({ ready }: { ready: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const d = await res.json().catch(() => ({}));
    if (res.ok) {
      router.replace("/admin");
      router.refresh();
      return;
    }
    setBusy(false);
    setPassword("");
    setError(d.error || "Sign-in failed.");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <div className="grid-lines absolute inset-0" aria-hidden="true" />
      <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-brand-500/15 blur-3xl" aria-hidden="true" />
      <main className="relative w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo light />
        </div>
        <form onSubmit={submit} className="rounded-3xl bg-white/[0.04] p-7 ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/15 text-brand-500">
              <Icon name="lock" />
            </span>
            <div>
              <h1 className="font-display text-lg font-bold text-white">Admin sign in</h1>
              <p className="text-xs text-ink-400">Single administrator account</p>
            </div>
          </div>
          <label className="mt-6 block text-sm text-ink-200" htmlFor="admin-password">
            Password
          </label>
          <div className="mt-1.5 flex items-center rounded-xl bg-white/5 ring-1 ring-white/15 focus-within:ring-2 focus-within:ring-brand-500">
            <input
              id="admin-password"
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              autoFocus
              required
              disabled={!ready || busy}
              className="w-full bg-transparent px-4 py-3 text-white outline-none"
            />
            <button type="button" onClick={() => setShow((v) => !v)} className="px-3 text-xs text-ink-400 hover:text-white" aria-label={show ? "Hide password" : "Show password"}>
              {show ? "Hide" : "Show"}
            </button>
          </div>
          <button
            disabled={!ready || busy || !password}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-500 py-3 font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? "Signing in…" : "Sign in"} <Icon name="arrow" className="h-4 w-4" />
          </button>
          {error && (
            <p role="alert" className="mt-5 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 ring-1 ring-red-500/30">
              {error}
            </p>
          )}
        </form>
        <p className="mt-6 text-center text-xs text-ink-500">Authorised staff only. All sign-in attempts are logged.</p>
      </main>
    </div>
  );
}
