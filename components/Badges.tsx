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
    <span className="inline-flex items-center text-xs font-medium text-zinc-700 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded">
      {label}
    </span>
  );
}

const RESOLUTION_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  refund: { label: 'Refund', bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-800' },
  replacement: { label: 'Replacement', bg: 'bg-blue-50 border-blue-200', text: 'text-blue-800' },
  store_credit: { label: 'Store Credit', bg: 'bg-purple-50 border-purple-200', text: 'text-purple-800' },
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
    bg: 'bg-zinc-50 border-zinc-200',
    text: 'text-zinc-800',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${item.bg} ${item.text}`}
    >
      <span>{item.label}</span>
      {resolution === 'refund' && refundAmount && (
        <span className="font-mono font-bold">(${Number(refundAmount).toFixed(2)})</span>
      )}
    </span>
  );
}
