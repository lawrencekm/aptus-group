import type { ShipmentStatus } from "@/lib/site";

const styles: Record<ShipmentStatus, string> = {
  Booked: "bg-slate-100 text-slate-700 ring-slate-200",
  Received: "bg-sky-50 text-sky-700 ring-sky-200",
  "In Safe Custody": "bg-amber-50 text-amber-800 ring-amber-200",
  "In Transit": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "At Customs": "bg-violet-50 text-violet-700 ring-violet-200",
  "Out for Delivery": "bg-cyan-50 text-cyan-700 ring-cyan-200",
  Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Released: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "On Hold": "bg-red-50 text-red-700 ring-red-200",
};

export function StatusBadge({ status, className = "" }: { status: ShipmentStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${styles[status]} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}
