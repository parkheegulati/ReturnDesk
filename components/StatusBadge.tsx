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
    bg: 'bg-gray-50',
    text: 'text-gray-700',
    border: 'border-gray-200',
    dot: 'bg-gray-500',
  },
  in_review: {
    label: 'In Review',
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
  },
  approved: {
    label: 'Approved',
    bg: 'bg-blue-50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    dot: 'bg-blue-600',
  },
  completed: {
    label: 'Completed',
    bg: 'bg-green-50',
    text: 'text-green-800',
    border: 'border-green-200',
    dot: 'bg-green-600',
  },
  rejected: {
    label: 'Rejected',
    bg: 'bg-red-50',
    text: 'text-red-800',
    border: 'border-red-200',
    dot: 'bg-red-600',
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
    sm: 'text-[11px] px-2.5 py-0.5 gap-1.5 font-medium',
    md: 'text-xs font-semibold px-2.5 py-0.5 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses} whitespace-nowrap tracking-tight select-none shadow-2xs`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
}
