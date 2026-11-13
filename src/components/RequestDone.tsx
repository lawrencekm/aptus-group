import { Icon } from "./Icon";

/** Success panel after a quote/contact submission, with the PDF request receipt. */
export function RequestDone({ refNo, receiptUrl, emailed, onAnother }: { refNo: string; receiptUrl: string; emailed: boolean; onAnother: () => void }) {
  return (
    <div className="py-6 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-50 text-green-600">
        <Icon name="check" className="h-7 w-7" strokeWidth={2.4} />
      </span>
      <h2 className="mt-4 font-display text-2xl font-bold text-ink-900">Request received</h2>
      <p className="mt-2 text-ink-500">
        Your reference is <span className="font-mono font-semibold text-ink-900">{refNo}</span>. Our team will contact you within one working day.
      </p>
      {emailed && <p className="mt-1 text-sm text-ink-500">A copy of your receipt is on its way to your email.</p>}

      <div className="mx-auto mt-6 max-w-md rounded-2xl border border-ink-100 bg-ink-50 p-4 text-left">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Icon name="file" className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="font-semibold text-ink-900">Request receipt (PDF)</p>
            <p className="truncate text-xs text-ink-500">Aptus-{refNo}.pdf</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <a href={receiptUrl} target="_blank" rel="noopener" className="flex-1 rounded-xl bg-ink-900 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-ink-800">
            View receipt
          </a>
          <a href={receiptUrl} download={`Aptus-${refNo}.pdf`} className="flex-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-ink-800 ring-1 ring-ink-200 hover:bg-white">
            Download
          </a>
        </div>
      </div>
      <button onClick={onAnother} className="mt-6 text-sm font-medium text-brand-600 hover:text-brand-700">
        Send another request
      </button>
    </div>
  );
}
