"use client";

import { Icon } from "./Icon";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-ink-200 hover:bg-ink-50"
    >
      <Icon name="print" className="h-4 w-4" /> Print
    </button>
  );
}
