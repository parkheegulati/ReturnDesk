import { ReturnReason, RequestResolution } from '@/drizzle/schema';

const REASON_LABELS: Record<string, string> = {
  damaged: 'Damaged',
  wrong_item: 'Wrong Item',
  size_issue: 'Size Issue',
  not_as_described: 'Not as Described',
  changed_mind: 'Changed Mind',
};

export function ReasonBadge({ reason }: { reason: ReturnReason | string }) {
  const label = REASON_LABELS[reason] || reason;
  return (
    <span className="inline-flex items-center text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded">
      {label}
    </span>
  );
}

const RESOLUTION_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  refund: { label: 'Refund', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
  replacement: { label: 'Replacement', bg: 'bg-slate-100 border-slate-200', text: 'text-slate-800' },
  store_credit: { label: 'Store Credit', bg: 'bg-indigo-50 border-indigo-200', text: 'text-indigo-800' },
};

export function ResolutionBadge({
  resolution,
  refundAmount,
}: {
  resolution?: RequestResolution | string | null;
  refundAmount?: string | number | null;
}) {
  if (!resolution) return null;
  const item = RESOLUTION_LABELS[resolution] || {
    label: resolution,
    bg: 'bg-slate-50 border-slate-200',
    text: 'text-slate-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${item.bg} ${item.text}`}
    >
      <span>{item.label}</span>
      {resolution === 'refund' && refundAmount && (
        <span className="font-mono font-bold">(₹{Number(refundAmount).toFixed(2)})</span>
      )}
    </span>
  );
}
