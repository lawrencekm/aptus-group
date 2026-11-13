import Link from "next/link";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { services, site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="bg-ink-900 text-ink-200">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed text-ink-400">
            Freight, customs and safe custody from the JKIA Cargo Transit Zone, Nairobi. {site.tagline}
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Services</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {services.map((s) => (
              <li key={s.slug}>
                <Link href={`/services#${s.slug}`} className="hover:text-white">
                  {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Company</h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">About us</Link></li>
            <li><Link href="/safe-custody" className="hover:text-white">Safe custody</Link></li>
            <li><Link href="/track" className="hover:text-white">Track a shipment</Link></li>
            <li><Link href="/contact" className="hover:text-white">Request a quote</Link></li>
          </ul>
        </div>
        <address className="not-italic">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-white">Visit or call</h2>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex gap-2"><Icon name="pin" className="mt-0.5 h-4 w-4 shrink-0" />{site.address.street}, {site.address.locality}, {site.address.country}</li>
            <li className="flex gap-2"><Icon name="phone" className="mt-0.5 h-4 w-4 shrink-0" /><a href={`tel:${site.phone}`} className="hover:text-white">{site.phoneDisplay}</a></li>
            <li className="flex gap-2"><Icon name="mail" className="mt-0.5 h-4 w-4 shrink-0" /><a href={`mailto:${site.email}`} className="break-all hover:text-white">{site.email}</a></li>
            <li className="flex gap-2"><Icon name="clock" className="mt-0.5 h-4 w-4 shrink-0" />{site.hoursDisplay}</li>
          </ul>
        </address>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col gap-2 py-5 text-xs text-ink-400 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {site.legalName}. All rights reserved.</span>
          <span>Nairobi, Kenya · Serving East Africa</span>
        </div>
      </div>
    </footer>
  );
}
