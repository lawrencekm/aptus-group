// Wordmark inspired by the original column logo (three bars + "AG").
export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg viewBox="0 0 40 40" className="h-9 w-9 shrink-0" aria-hidden="true">
        <rect width="40" height="40" rx="10" fill="#f0442e" />
        <rect x="9" y="14" width="5" height="17" rx="1.5" fill="#fff" />
        <rect x="17.5" y="9" width="5" height="22" rx="1.5" fill="#fff" />
        <rect x="26" y="17" width="5" height="14" rx="1.5" fill="#e2b04a" />
      </svg>
      <span className="leading-none">
        <span className={`block font-display text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-ink-900"}`}>
          Aptus Group
        </span>
        <span className={`block text-[10px] font-semibold uppercase tracking-[0.18em] ${light ? "text-ink-200" : "text-ink-500"}`}>
          Logistics · Safe Custody
        </span>
      </span>
    </span>
  );
}
