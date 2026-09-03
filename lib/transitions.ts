import { RequestStatus } from '../drizzle/schema';

/**
 * Business Rule 1: Legal lifecycle state transitions
 *
 * Allowed paths:
 *   open      -> in_review | rejected
 *   in_review -> approved  | rejected
 *   approved  -> completed
 *   completed -> (terminal, no transitions)
 *   rejected  -> (terminal, no transitions)
 */
export const LEGAL_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  open: ['in_review', 'rejected'],
  in_review: ['approved', 'rejected'],
  approved: ['completed'],
  completed: [],
  rejected: [],
} as const;

export function isLegalTransition(from: RequestStatus, to: RequestStatus): boolean {
  const allowed = LEGAL_TRANSITIONS[from];
  return allowed.includes(to);
}

export function isTerminalStatus(status: RequestStatus): boolean {
  return status === 'completed' || status === 'rejected';
}

export function isLockedStatus(status: RequestStatus): boolean {
  // Business Rule 4: once status is Approved, Rejected, or Completed, details become immutable
  return status === 'approved' || status === 'completed' || status === 'rejected';
}

export function isRemovableStatus(status: RequestStatus): boolean {
  // Business Rule 5: only Open or Rejected requests may be removed
  return status === 'open' || status === 'rejected';
}
