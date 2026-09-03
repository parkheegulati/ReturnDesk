import { RequestStatus } from '@/drizzle/schema';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border?: string }
> = {
  open: {
    label: 'Open',
    bg: 'bg-[var(--surface-1)]',
    text: 'text-[var(--text-secondary)]',
    border: 'border border-[var(--border)]',
  },
  in_review: {
    label: 'In review',
    bg: 'bg-[var(--bg-warning)]',
    text: 'text-[var(--text-warning)]',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-[var(--bg-accent)]',
    text: 'text-[var(--text-accent)]',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-[var(--bg-success)]',
    text: 'text-[var(--text-success)]',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-[var(--bg-danger)]',
    text: 'text-[var(--text-danger)]',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: 'bg-[var(--surface-1)]',
    text: 'text-[var(--text-secondary)]',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-[2px] rounded-[4px]',
    md: 'text-[12px] px-3 py-[6px] rounded-[4px]',
    lg: 'text-[13px] px-3.5 py-[6px] rounded-[4px]',
  }[size];

  return (
    <span
      className={`inline-flex items-center font-medium ${config.bg} ${config.text} ${config.border ?? ''} ${sizeClasses} whitespace-nowrap select-none`}
    >
      <span>{config.label}</span>
    </span>
  );
}
