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
        <div className="inline-block animate-spin w-6 h-6 border-2 border-frido-amber border-t-transparent rounded-full mb-3" />
        <p className="text-sm font-medium">Loading ticket details...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="py-12 max-w-lg mx-auto text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-frido-ink">Request Not Found</h2>
        <p className="text-sm text-zinc-600">
          {error || 'This return request does not exist or has been removed from the desk.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-frido-amber-dark hover:underline"
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
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-frido-ink transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Desk
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-frido-line">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-bold font-mono text-frido-ink">
                {detail.reference}
              </h1>
              <StatusBadge status={detail.status} size="lg" />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
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
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-sm disabled:opacity-50"
                >
                  Start Review
                </button>
                <button
                  disabled={transitioning}
                  onClick={() => handleTransition('rejected')}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50"
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
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-teal-600 hover:bg-teal-700 text-white transition-colors shadow-sm disabled:opacity-50"
                >
                  Approve Request...
                </button>
                <button
                  disabled={transitioning}
                  onClick={() => handleTransition('rejected')}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors disabled:opacity-50"
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
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm disabled:opacity-50"
              >
                Mark as Completed
              </button>
            )}

            {/* Edit details: ONLY rendered if NOT locked (Rule 4) */}
            {!locked && (
              <button
                onClick={() => setShowEditModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-300 transition-colors"
              >
                Edit Details
              </button>
            )}

            {/* Remove from desk: ONLY rendered if Open or Rejected (Rule 5) */}
            {removable && (
              <button
                onClick={() => setShowRemoveModal(true)}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 transition-colors"
              >
                Remove from Desk
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Notifications */}
      {actionError && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-3.5 text-sm text-rose-800 flex items-start justify-between gap-2 shadow-sm">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-semibold">Action Refused</p>
              <p className="text-xs text-rose-700 mt-0.5">{actionError}</p>
            </div>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-600">
            &times;
          </button>
        </div>
      )}

      {actionSuccess && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3.5 text-sm text-emerald-800 flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="font-medium text-xs sm:text-sm">{actionSuccess}</p>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-500 hover:text-emerald-700">
            &times;
          </button>
        </div>
      )}

      {/* Main Grid: Details + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Request Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Item & Order Information */}
          <div className="bg-white rounded-lg border border-frido-line p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-frido-line">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">
                Item & Order Details
              </h2>
              {locked && (
                <span className="inline-flex items-center gap-1 text-xs text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded font-mono">
                  <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Locked (Decided)
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-zinc-500 block">Item Name</span>
                <span className="font-semibold text-zinc-900">{detail.item_name}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-500 block">Quantity</span>
                <span className="font-semibold text-zinc-900">{detail.quantity} unit(s)</span>
              </div>
              <div>
                <span className="text-xs text-zinc-500 block">Order ID</span>
                <span className="font-mono font-semibold text-zinc-900">{detail.order_id}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-500 block">Return Reason</span>
                <div className="mt-0.5">
                  <ReasonBadge reason={detail.reason} />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Customer Information */}
          <div className="bg-white rounded-lg border border-frido-line p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 pb-3 border-b border-frido-line">
              Customer Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-zinc-500 block">Customer Name</span>
                <span className="font-semibold text-zinc-900">{detail.customer_name}</span>
              </div>
              <div>
                <span className="text-xs text-zinc-500 block">Contact / Email</span>
                <span className="font-mono text-zinc-800 break-all">{detail.customer_contact}</span>
              </div>
            </div>
          </div>

          {/* Card: Decision & Resolution (if decided) */}
          {(detail.status === 'approved' || detail.status === 'completed' || detail.resolution) && (
            <div className="bg-[#fcfbf9] rounded-lg border border-teal-200 p-5 shadow-sm space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-teal-900 pb-2 border-b border-teal-100 flex items-center gap-2">
                <svg className="w-4 h-4 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Approved Resolution
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-sm pt-1">
                <div>
                  <span className="text-xs text-zinc-500 block">Resolution Type</span>
                  <div className="mt-1">
                    <ResolutionBadge
                      resolution={detail.resolution}
                      refundAmount={detail.refund_amount}
                    />
                  </div>
                </div>
                {detail.resolution === 'refund' && detail.refund_amount && (
                  <div>
                    <span className="text-xs text-zinc-500 block">Refund Amount</span>
                    <span className="text-lg font-bold font-mono text-emerald-800">
                      ${Number(detail.refund_amount).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Terminal Banner for Rejected */}
          {detail.status === 'rejected' && (
            <div className="bg-rose-50 rounded-lg border border-rose-200 p-4 text-sm text-rose-800 flex items-center gap-3">
              <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-semibold">Request Rejected</p>
                <p className="text-xs text-rose-700">
                  This return request has been rejected. It cannot be transitioned or reopened.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Complete Note History (Append-Only) */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-frido-line p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-frido-line">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                Note History ({detail.notes?.length || 0})
              </h2>
              <span className="text-[10px] text-zinc-400 uppercase font-semibold tracking-wider">
                Append-Only
              </span>
            </div>

            {/* Note List (chronological order) */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {!detail.notes || detail.notes.length === 0 ? (
                <p className="text-xs text-zinc-400 text-center py-6 italic">
                  No internal notes recorded yet.
                </p>
              ) : (
                detail.notes.map((note, idx) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-md bg-[#faf9f7] border border-frido-line text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-zinc-500">
                      <span className="font-semibold text-zinc-700">Agent Note #{idx + 1}</span>
                      <span className="font-mono">
                        {new Date(note.created_at).toLocaleString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-zinc-800 whitespace-pre-wrap leading-relaxed">
                      {note.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Add Note Form — Available in ANY status per Rule 4 */}
            <form onSubmit={handleAddNote} className="pt-3 border-t border-frido-line space-y-2">
              <label htmlFor="note-input" className="text-xs font-semibold text-zinc-700 block">
                Append Internal Note
              </label>
              <textarea
                id="note-input"
                rows={3}
                placeholder="Record customer communication, warehouse findings, or inspection notes..."
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                className="w-full text-xs p-2.5 rounded border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-frido-amber focus:border-transparent bg-zinc-50 focus:bg-white text-zinc-900"
              />
              <button
                type="submit"
                disabled={submittingNote || !newNoteBody.trim()}
                className="w-full py-2 px-3 text-xs font-semibold rounded bg-frido-charcoal hover:bg-frido-ink text-white transition-colors disabled:opacity-40 shadow-sm"
              >
                {submittingNote ? 'Saving...' : 'Add Note to Ticket'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* MODAL: Approve Request (Rule 2: Atomic approval with resolution) */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 border border-frido-line">
            <h3 className="text-lg font-bold text-frido-ink">Approve Return Request</h3>
            <p className="text-xs text-zinc-600">
              Moving this request to <strong>Approved</strong> requires setting the resolution atomically.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">
                  Resolution Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={approveResolution}
                  onChange={(e) => setApproveResolution(e.target.value as any)}
                  className="w-full p-2 rounded border border-zinc-300 text-xs focus:ring-2 focus:ring-frido-amber"
                >
                  <option value="refund">Refund (Credit Card / Original Method)</option>
                  <option value="replacement">Replacement Product</option>
                  <option value="store_credit">Store Credit Voucher</option>
                </select>
              </div>

              {approveResolution === 'refund' && (
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">
                    Refund Amount ($) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="e.g. 49.99"
                    value={approveRefundAmount}
                    onChange={(e) => setApproveRefundAmount(e.target.value)}
                    required
                    className="w-full p-2 rounded border border-zinc-300 text-xs focus:ring-2 focus:ring-frido-amber font-mono"
                  />
                  <span className="text-[11px] text-zinc-500 mt-1 block">
                    Must be a positive amount greater than 0.
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-frido-line">
              <button
                type="button"
                onClick={() => setShowApproveModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800"
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
                className="px-4 py-2 text-xs font-semibold rounded bg-teal-600 hover:bg-teal-700 text-white transition-colors disabled:opacity-40"
              >
                {transitioning ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: General Edit Form (Rule 4: Allowed on Open/In Review only) */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4 border border-frido-line">
            <h3 className="text-lg font-bold text-frido-ink">Edit Request Details</h3>
            <p className="text-xs text-zinc-500">
              Only editable while in Open or In Review status.
            </p>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={editForm.customer_name}
                  onChange={(e) => setEditForm({ ...editForm, customer_name: e.target.value })}
                  className="w-full p-2 rounded border border-zinc-300 focus:ring-2 focus:ring-frido-amber"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Customer Contact</label>
                <input
                  type="text"
                  required
                  value={editForm.customer_contact}
                  onChange={(e) => setEditForm({ ...editForm, customer_contact: e.target.value })}
                  className="w-full p-2 rounded border border-zinc-300 focus:ring-2 focus:ring-frido-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Order ID</label>
                  <input
                    type="text"
                    required
                    value={editForm.order_id}
                    onChange={(e) => setEditForm({ ...editForm, order_id: e.target.value })}
                    className="w-full p-2 rounded border border-zinc-300 focus:ring-2 focus:ring-frido-amber font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-700 block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={editForm.quantity}
                    onChange={(e) => setEditForm({ ...editForm, quantity: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 rounded border border-zinc-300 focus:ring-2 focus:ring-frido-amber"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={editForm.item_name}
                  onChange={(e) => setEditForm({ ...editForm, item_name: e.target.value })}
                  className="w-full p-2 rounded border border-zinc-300 focus:ring-2 focus:ring-frido-amber"
                />
              </div>

              <div>
                <label className="font-semibold text-zinc-700 block mb-1">Reason</label>
                <select
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value as any })}
                  className="w-full p-2 rounded border border-zinc-300 focus:ring-2 focus:ring-frido-amber"
                >
                  <option value="damaged">Damaged</option>
                  <option value="wrong_item">Wrong Item</option>
                  <option value="size_issue">Size Issue</option>
                  <option value="not_as_described">Not as Described</option>
                  <option value="changed_mind">Changed Mind</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-frido-line">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-xs font-semibold rounded bg-frido-amber hover:bg-frido-amber-dark text-frido-ink font-bold transition-colors disabled:opacity-50"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Remove Confirmation (Rule 5: Allowed on Open/Rejected only) */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-sm w-full p-6 shadow-xl space-y-4 border border-frido-line">
            <h3 className="text-lg font-bold text-rose-700">Remove from Desk?</h3>
            <p className="text-xs text-zinc-600 leading-relaxed">
              This will take <strong>{detail.reference}</strong> off the desk (soft-delete).
              The record is safely preserved in the database for audit history, but will no longer appear in active searches or lists.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-frido-line">
              <button
                type="button"
                onClick={() => setShowRemoveModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={removing}
                onClick={handleRemove}
                className="px-4 py-2 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
              >
                {removing ? 'Removing...' : 'Confirm Removal'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
