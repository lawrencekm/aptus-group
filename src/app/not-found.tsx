import Link from "next/link";
import { Logo } from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <h1 className="font-display text-3xl font-extrabold text-ink-900">Page not found</h1>
      <p className="text-ink-500">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <div className="flex gap-3">
        <Link href="/" className="rounded-xl bg-brand-500 px-5 py-3 font-semibold text-white">Home</Link>
        <Link href="/track" className="rounded-xl px-5 py-3 font-semibold text-ink-800 ring-1 ring-ink-200">Track a shipment</Link>
      </div>
    </div>
  );
}
