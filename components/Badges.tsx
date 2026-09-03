import { ReturnReason, RequestResolution } from '@/drizzle/schema';

const REASON_LABELS: Record<string, string> = {
  damaged: 'Damaged',
  wrong_item: 'Wrong item',
  size_issue: 'Size issue',
  not_as_described: 'Not as described',
  changed_mind: 'Changed mind',
};

export function ReasonBadge({ reason }: { reason: ReturnReason | string }) {
  const label = REASON_LABELS[reason] || reason;
  return (
    <span className="inline-flex items-center text-[12px] font-normal text-[var(--text-secondary)] bg-[var(--surface-1)] border border-[var(--border)] px-2 py-[2px] rounded-[4px]">
      {label}
    </span>
  );
}

const RESOLUTION_LABELS: Record<string, { label: string; bg: string; text: string; border?: string }> = {
  refund: {
    label: 'Refund',
    bg: 'bg-[var(--bg-accent)]',
    text: 'text-[var(--text-accent)]',
  },
  replacement: {
    label: 'Replacement',
    bg: 'bg-[var(--surface-1)]',
    text: 'text-[var(--text-secondary)]',
    border: 'border border-[var(--border)]',
  },
  store_credit: {
    label: 'Store credit',
    bg: 'bg-[var(--bg-warning)]',
    text: 'text-[var(--text-warning)]',
  },
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
    bg: 'bg-[var(--surface-1)]',
    text: 'text-[var(--text-secondary)]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 text-[12px] font-medium px-2.5 py-[3px] rounded-[4px] ${item.bg} ${item.text} ${item.border ?? ''}`}
    >
      <span>{item.label}</span>
      {resolution === 'refund' && refundAmount && (
        <span className="font-mono">(₹{Number(refundAmount).toFixed(2)})</span>
      )}
    </span>
  );
}
