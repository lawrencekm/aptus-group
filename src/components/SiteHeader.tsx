"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { site } from "@/lib/site";

const nav = [
  { href: "/", label: "Home" },
  { href: "/services", label: "Services" },
  { href: "/safe-custody", label: "Safe Custody" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="hidden bg-ink-900 text-xs text-ink-200 sm:block">
        <div className="container-x flex h-9 items-center justify-between">
          <span className="flex items-center gap-2">
            <Icon name="pin" className="h-3.5 w-3.5" /> {site.address.street}, {site.address.locality}
          </span>
          <span className="flex items-center gap-5">
            <a href={`tel:${site.phone}`} className="flex items-center gap-1.5 hover:text-white">
              <Icon name="phone" className="h-3.5 w-3.5" /> {site.phoneDisplay}
            </a>
            <a href={`mailto:${site.email}`} className="flex items-center gap-1.5 hover:text-white">
              <Icon name="mail" className="h-3.5 w-3.5" /> {site.email}
            </a>
          </span>
        </div>
      </div>
      <div className="container-x flex h-16 items-center justify-between">
        <Link href="/" aria-label={`${site.name} home`} onClick={() => setOpen(false)}>
          <Logo />
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                path === n.href ? "text-brand-600" : "text-ink-700 hover:bg-ink-50 hover:text-ink-900"
              }`}
            >
              {n.label}
            </Link>
          ))}
          <Link
            href="/track"
            className="ml-2 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-600"
          >
            <Icon name="search" className="h-4 w-4" /> Track shipment
          </Link>
        </nav>
        <button
          className="rounded-lg p-2 text-ink-700 md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? "x" : "menu"} className="h-6 w-6" />
        </button>
      </div>
      {open && (
        <nav className="border-t border-ink-100 bg-white md:hidden" aria-label="Mobile">
          <div className="container-x flex flex-col py-3">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="rounded-lg px-2 py-3 font-medium text-ink-800">
                {n.label}
              </Link>
            ))}
            <Link
              href="/track"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-lg bg-brand-500 px-4 py-3 text-center font-semibold text-white"
            >
              Track shipment
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
