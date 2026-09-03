'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { ReasonBadge, ResolutionBadge } from '@/components/Badges';
import { RequestStatus, ReturnReason, RequestResolution } from '@/drizzle/schema';
import { isLockedStatus, isRemovableStatus } from '@/lib/transitions';

interface RequestDetail {
  id: string;
  reference: string;
  customer_name: string;
  customer_contact: string;
  order_id: string;
  item_name: string;
  quantity: number;
  reason: ReturnReason;
  status: RequestStatus;
  resolution: RequestResolution | null;
  refund_amount: string | null;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
  notes: Array<{
    id: string;
    body: string;
    created_at: string;
  }>;
}

export default function RequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [detail, setDetail] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Note form state
  const [newNoteBody, setNewNoteBody] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Status transition modal state
  const [transitioning, setTransitioning] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveResolution, setApproveResolution] = useState<'refund' | 'replacement' | 'store_credit'>('refund');
  const [approveRefundAmount, setApproveRefundAmount] = useState('');

  // General field edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    customer_name: '',
    customer_contact: '',
    order_id: '',
    item_name: '',
    quantity: 1,
    reason: 'damaged' as ReturnReason,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Remove confirmation modal
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [removing, setRemoving] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/requests/${id}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to load request details.');
      }
      setDetail(json.data);
      setEditForm({
        customer_name: json.data.customer_name,
        customer_contact: json.data.customer_contact,
        order_id: json.data.order_id,
        item_name: json.data.item_name,
        quantity: json.data.quantity,
        reason: json.data.reason,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Handle status transition (Rule 1 & Rule 2)
  const handleTransition = async (
    targetStatus: RequestStatus,
    resolution?: RequestResolution,
    refundAmount?: number | null
  ) => {
    setActionError(null);
    setActionSuccess(null);
    setTransitioning(true);

    try {
      const payload: any = { status: targetStatus };
      if (targetStatus === 'approved') {
        payload.resolution = resolution;
        if (resolution === 'refund') {
          payload.refund_amount = refundAmount;
        }
      }

      const res = await fetch(`/api/requests/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to transition status.');
      }

      setShowApproveModal(false);
      setActionSuccess(`Status successfully updated to "${targetStatus}".`);
      await fetchDetail();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setTransitioning(false);
    }
  };

  // Handle general field edit (Rule 4)
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);
    setActionSuccess(null);
    setSavingEdit(true);

    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to update request details.');
      }

      setShowEditModal(false);
      setActionSuccess('Request details updated successfully.');
      await fetchDetail();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle soft delete removal (Rule 5)
  const handleRemove = async () => {
    setActionError(null);
    setRemoving(true);

    try {
      const res = await fetch(`/api/requests/${id}/remove`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to remove request.');
      }

      // Redirect back to desk after removal
      router.push('/');
    } catch (err: any) {
      setActionError(err.message);
      setRemoving(false);
      setShowRemoveModal(false);
    }
  };

  // Handle appending note (append-only)
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteBody.trim()) return;

    setSubmittingNote(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/requests/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: newNoteBody.trim() }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to add note.');
      }

      setNewNoteBody('');
      // Re-fetch to update note history chronologically
      await fetchDetail();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-500">
        <div className="inline-block animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium text-slate-600">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Request Not Found</h2>
        <p className="text-sm text-slate-600">
          {error || 'This return request does not exist or has been removed from the desk.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
        >
          &larr; Back to Returns Desk
        </Link>
      </div>
    );
  }

  const locked = isLockedStatus(detail.status);
  const removable = isRemovableStatus(detail.status);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back Link and Reference Header */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to desk
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[24px] font-medium font-mono tracking-tight text-[var(--text-primary)] m-0">
                {detail.reference}
              </h1>
              <StatusBadge status={detail.status} size="lg" />
            </div>
            <p className="text-[12px] text-[var(--text-secondary)] mt-1">
              Created on {new Date(detail.created_at).toLocaleString()} &bull; Last updated {new Date(detail.updated_at).toLocaleString()}
            </p>
          </div>

          {/* Action Toolbar: ONLY legal actions for current status rendered */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* 1. If Open: can move to In Review, Reject, Edit details, or Remove */}
            {detail.status === 'open' && (
              <>
                <button
                  disabled={transitioning}
                  onClick={() => handleTransition('in_review')}
                  className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--fill-warning)] text-[var(--on-warning)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Start review
                </button>
                <button
                  disabled={transitioning}
                  onClick={() => handleTransition('rejected')}
                  className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--bg-danger)] text-[var(--text-danger)] border border-[var(--border-danger)] hover:bg-[var(--bg-danger)] transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            {/* 2. If In Review: can Approve (needs resolution) or Reject */}
            {detail.status === 'in_review' && (
              <>
                <button
                  disabled={transitioning}
                  onClick={() => setShowApproveModal(true)}
                  className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--fill-accent)] text-[var(--on-accent)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  Approve request...
                </button>
                <button
                  disabled={transitioning}
                  onClick={() => handleTransition('rejected')}
                  className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--bg-danger)] text-[var(--text-danger)] border border-[var(--border-danger)] hover:bg-[var(--bg-danger)] transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </>
            )}

            {/* 3. If Approved: can complete */}
            {detail.status === 'approved' && (
              <button
                disabled={transitioning}
                onClick={() => handleTransition('completed')}
                className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--fill-success)] text-[var(--on-success)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                Mark as completed
              </button>
            )}

            {/* Edit details: ONLY rendered if NOT locked (Rule 4) */}
            {!locked && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-transparent hover:border-[var(--border-strong)] text-[var(--text-secondary)] border border-[var(--border-strong)] transition-colors"
              >
                Edit details
              </button>
            )}

            {/* Remove from desk: ONLY rendered if Open or Rejected (Rule 5) */}
            {removable && (
              <button
                onClick={() => setShowRemoveModal(true)}
                className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-transparent hover:bg-[var(--bg-danger)] text-[var(--text-danger)] border border-[var(--border-danger)] transition-colors"
              >
                Remove from desk
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="rounded-[12px] bg-[var(--bg-danger)] border border-[var(--border-danger)] p-3.5 text-[13px] text-[var(--text-danger)] flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-[var(--text-danger)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium">Action refused</p>
              <p className="text-[12px] text-[var(--text-danger)] mt-0.5">{actionError}</p>
            </div>
          </div>
          <button onClick={() => setActionError(null)} className="text-[var(--text-danger)] hover:opacity-75">
            &times;
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-[12px] bg-[var(--bg-success)] border border-[var(--border-success)] p-3.5 text-[13px] text-[var(--text-success)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-[var(--text-success)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-medium text-[13px]">{actionSuccess}</p>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-[var(--text-success)] hover:opacity-75">
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Details + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Request Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Item & Order Information */}
          <div className="bg-[var(--surface-2)] rounded-[12px] border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.4px] text-[var(--text-secondary)] m-0">
                Item & order details
              </h2>
              {locked && (
                <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-secondary)] bg-[var(--surface-1)] border border-[var(--border)] px-2 py-0.5 rounded-[4px] font-mono">
                  <svg className="w-3 h-3 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Locked (decided)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-[12px] text-[var(--text-secondary)] block">Item name</span>
                <span className="font-medium text-[var(--text-primary)]">{detail.item_name}</span>
              </div>
              <div>
                <span className="text-[12px] text-[var(--text-secondary)] block">Quantity</span>
                <span className="font-medium text-[var(--text-primary)]">{detail.quantity} unit(s)</span>
              </div>
              <div>
                <span className="text-[12px] text-[var(--text-secondary)] block">Order ID</span>
                <span className="font-mono font-medium text-[var(--text-primary)]">{detail.order_id}</span>
              </div>
              <div>
                <span className="text-[12px] text-[var(--text-secondary)] block mb-1">Return reason</span>
                <ReasonBadge reason={detail.reason} />
              </div>
            </div>
          </div>

          {/* Card: Customer Information */}
          <div className="bg-[var(--surface-2)] rounded-[12px] border border-[var(--border)] p-5 space-y-4">
            <h2 className="text-[12px] font-medium uppercase tracking-[0.4px] text-[var(--text-secondary)] pb-3 border-b border-[var(--border)] m-0">
              Customer information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[13px]">
              <div>
                <span className="text-[12px] text-[var(--text-secondary)] block">Customer name</span>
                <span className="font-medium text-[var(--text-primary)]">{detail.customer_name}</span>
              </div>
              <div>
                <span className="text-[12px] text-[var(--text-secondary)] block">Contact / Email</span>
                <span className="font-mono text-[var(--text-primary)] break-all">{detail.customer_contact}</span>
              </div>
            </div>
          </div>

          {/* Card: Decision & Resolution (if decided) */}
          {(detail.status === 'approved' || detail.status === 'completed' || detail.resolution) && (
            <div className="bg-[var(--surface-2)] rounded-[12px] border border-[var(--border)] p-5 space-y-3">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.4px] text-[var(--text-secondary)] pb-2 border-b border-[var(--border)] flex items-center gap-2 m-0">
                Approved resolution
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-[13px] pt-1">
                <div>
                  <span className="text-[12px] text-[var(--text-secondary)] block mb-1">Resolution type</span>
                  <ResolutionBadge
                    resolution={detail.resolution}
                    refundAmount={detail.refund_amount}
                  />
                </div>
                {detail.resolution === 'refund' && detail.refund_amount && (
                  <div>
                    <span className="text-[12px] text-[var(--text-secondary)] block">Refund amount</span>
                    <span className="text-[18px] font-medium font-mono text-[var(--text-success)]">
                      ₹{Number(detail.refund_amount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terminal Banner for Rejected */}
          {detail.status === 'rejected' && (
            <div className="bg-[var(--bg-danger)] rounded-[12px] border border-[var(--border-danger)] p-4 text-[13px] text-[var(--text-danger)] flex items-center gap-3">
              <svg className="w-5 h-5 text-[var(--text-danger)] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Request rejected</p>
                <p className="text-[12px] text-[var(--text-danger)] mt-0.5">
                  This return request has been rejected. It cannot be transitioned or reopened.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Complete Note History (Append-Only) */}
        <div className="space-y-6">
          <div className="bg-[var(--surface-2)] rounded-[12px] border border-[var(--border)] p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.4px] text-[var(--text-secondary)] flex items-center gap-1.5 m-0">
                Note history ({detail.notes?.length || 0})
              </h2>
              <span className="text-[11px] text-[var(--text-muted)] uppercase font-medium tracking-[0.4px]">
                Append-only
              </span>
            </div>

            {/* Note List (chronological order) */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {!detail.notes || detail.notes.length === 0 ? (
                <p className="text-[13px] text-[var(--text-muted)] text-center py-6">
                  No internal notes recorded yet.
                </p>
              ) : (
                detail.notes.map((note, idx) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-[var(--radius)] bg-[var(--surface-1)] border border-[var(--border)] text-[13px] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[var(--text-secondary)]">
                      <span className="font-medium text-[var(--text-primary)]">Agent note #{idx + 1}</span>
                      <span className="font-mono text-[var(--text-muted)]">
                        {new Date(note.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[var(--text-primary)] whitespace-pre-wrap leading-relaxed font-normal">
                      {note.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form — Available in ANY status per Rule 4 */}
            <form onSubmit={handleAddNote} className="pt-3 border-t border-[var(--border)] space-y-2">
              <label htmlFor="note-input" className="text-[12px] font-medium text-[var(--text-primary)] block">
                Append internal note
              </label>
              <textarea
                id="note-input"
                rows={3}
                placeholder="Record customer communication, warehouse findings, or inspection notes..."
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                className="w-full text-[13px] p-3 rounded-[var(--radius)] border border-[var(--border)] focus:border-[var(--fill-accent)] focus:outline-none bg-[var(--surface-1)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNoteBody.trim()}
                className="w-full py-[9px] px-4 text-[13px] font-medium rounded-[var(--radius)] bg-[var(--fill-accent)] text-[var(--on-accent)] hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {submittingNote ? 'Saving...' : 'Add note to ticket'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: Approve Request (Rule 2: Atomic approval with resolution) */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--surface-2)] rounded-[12px] max-w-md w-full p-6 space-y-4 border border-[var(--border)]">
            <h3 className="text-[18px] font-medium text-[var(--text-primary)] m-0">Approve return request</h3>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Moving this request to <strong>Approved</strong> requires setting the resolution atomically.
            </p>

            <div className="space-y-3 text-[13px]">
              <div>
                <label className="font-medium text-[var(--text-primary)] block mb-1">
                  Resolution type <span className="text-[var(--text-danger)]">*</span>
                </label>
                <select
                  value={approveResolution}
                  onChange={(e) => setApproveResolution(e.target.value as any)}
                  className="w-full h-11 px-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none"
                >
                  <option value="refund">Refund (Original payment method)</option>
                  <option value="replacement">Replacement product</option>
                  <option value="store_credit">Store credit voucher</option>
                </select>
              </div>

              {approveResolution === 'refund' && (
                <div>
                  <label className="font-medium text-[var(--text-primary)] block mb-1">
                    Refund amount (₹) <span className="text-[var(--text-danger)]">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 1499.00"
                    value={approveRefundAmount}
                    onChange={(e) => setApproveRefundAmount(e.target.value)}
                    required
                    className="w-full h-11 px-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none font-mono"
                  />
                  <span className="text-[12px] text-[var(--text-muted)] mt-1 block">
                    Must be a positive amount greater than 0.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] border border-[var(--border-strong)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  transitioning ||
                  (approveResolution === 'refund' && (!approveRefundAmount || parseFloat(approveRefundAmount) <= 0))
                }
                onClick={() =>
                  handleTransition(
                    'approved',
                    approveResolution,
                    approveResolution === 'refund' ? parseFloat(approveRefundAmount) : null
                  )
                }
                className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--fill-accent)] text-[var(--on-accent)] hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {transitioning ? 'Approving...' : 'Confirm approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: General Edit Form (Rule 4: Allowed on Open/In Review only) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--surface-2)] rounded-[12px] max-w-md w-full p-6 space-y-4 border border-[var(--border)]">
            <h3 className="text-[18px] font-medium text-[var(--text-primary)] m-0">Edit request details</h3>
            <p className="text-[13px] text-[var(--text-secondary)]">
              Only editable while in Open or In Review status.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-[13px]">
              <div>
                <label className="font-medium text-[var(--text-primary)] block mb-1">Customer name</label>
                <input
                  type="text"
                  required
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                  className="w-full h-11 px-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-[var(--text-primary)] block mb-1">Customer contact</label>
                <input
                  type="text"
                  required
                  value={editForm.customer_contact}
                  onChange={(e) => setEditForm({ ...editForm, customer_contact: e.target.value })}
                  className="w-full h-11 px-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-medium text-[var(--text-primary)] block mb-1">Order ID</label>
                  <input
                    type="text"
                    required
                    value={editForm.order_id}
                    onChange={(e) => setEditForm({ ...editForm, order_id: e.target.value })}
                    className="w-full h-11 px-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="font-medium text-[var(--text-primary)] block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full h-11 px-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-medium text-[var(--text-primary)] block mb-1">Item name</label>
                <input
                  type="text"
                  required
                  value={editForm.item_name}
                  onChange={(e) => setEditForm({ ...editForm, item_name: e.target.value })}
                  className="w-full h-11 px-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-medium text-[var(--text-primary)] block mb-1">Reason</label>
                <select
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value as any })}
                  className="w-full h-11 px-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none"
                >
                  <option value="damaged">Damaged</option>
                  <option value="wrong_item">Wrong item</option>
                  <option value="size_issue">Size issue</option>
                  <option value="not_as_described">Not as described</option>
                  <option value="changed_mind">Changed mind</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] border border-[var(--border-strong)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--fill-accent)] text-[var(--on-accent)] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Remove Confirmation (Rule 5: Allowed on Open/Rejected only) */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-[var(--surface-2)] rounded-[12px] max-w-sm w-full p-6 space-y-4 border border-[var(--border)]">
            <h3 className="text-[18px] font-medium text-[var(--text-danger)] m-0">Remove from desk?</h3>
            <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">
              This will take <strong>{detail.reference}</strong> off the desk (soft-delete).
              The record is safely preserved in the database for audit history, but will no longer appear in active searches or lists.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowRemoveModal(false)}
                className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] border border-[var(--border-strong)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={handleRemove}
                className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--fill-danger)] text-[var(--on-danger)] hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {removing ? 'Removing...' : 'Confirm removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
