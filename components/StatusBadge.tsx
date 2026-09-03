import { RequestStatus } from '@/drizzle/schema';

interface StatusBadgeProps {
  status: RequestStatus | string;
  size?: 'sm' | 'md' | 'lg';
}

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; dot: string }
> = {
  open: {
    label: 'Open',
    bg: 'bg-sky-50',
    text: 'text-sky-800',
    border: 'border-sky-200',
    dot: 'bg-sky-500',
  },
  in_review: {
    label: 'In Review',
    bg: 'bg-[#FFFBE5]',
    text: 'text-[#876500]',
    border: 'border-[#FCD00F]/70',
    dot: 'bg-[#FCD00F]',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-teal-50',
    text: 'text-teal-800',
    border: 'border-teal-200',
    dot: 'bg-teal-500',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-emerald-50',
    text: 'text-emerald-800',
    border: 'border-emerald-200',
    dot: 'bg-emerald-600',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-rose-50',
    text: 'text-rose-800',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
  },
};

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-200',
    dot: 'bg-gray-400',
  };

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 font-medium',
    md: 'text-xs font-semibold px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-2xs ${config.bg} ${config.text} ${config.border} ${sizeClasses} whitespace-nowrap tracking-tight select-none`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
}
