'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ReturnReason } from '@/drizzle/schema';

export default function NewRequestPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    customer_name: '',
    customer_contact: '',
    order_id: '',
    item_name: '',
    quantity: 1,
    reason: 'damaged' as ReturnReason,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(
          json.error?.message ||
            'Failed to raise return request. Please check inputs and try again.'
        );
      }

      // Navigate to the newly created request detail page
      router.push(`/requests/${json.data.id}`);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
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
        <h1 className="text-[24px] font-medium tracking-tight text-[var(--text-primary)] m-0">
          Raise return / replacement request
        </h1>
        <p className="text-[13px] font-normal text-[var(--text-secondary)] mt-1">
          Internal agent form. The reference number will be generated automatically by the server.
        </p>
      </div>

      {error && (
        <div className="rounded-[12px] bg-[var(--bg-danger)] border border-[var(--border-danger)] p-4 text-[13px] text-[var(--text-danger)] flex items-start gap-3">
          <svg className="w-5 h-5 text-[var(--text-danger)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-medium">Unable to raise request</p>
            <p className="mt-0.5 text-[12px] text-[var(--text-danger)]">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-[var(--surface-2)] rounded-[12px] border border-[var(--border)] p-6 space-y-5">
        <div className="space-y-4">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.4px] text-[var(--text-secondary)] pb-2 border-b border-[var(--border)] m-0">
            Customer details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer_name" className="block text-[14px] font-medium text-[var(--text-primary)] mb-1">
                Customer full name <span className="text-[var(--text-danger)]">*</span>
              </label>
              <input
                id="customer_name"
                type="text"
                required
                placeholder="e.g. John Doe"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full h-11 px-4 text-[13px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--fill-accent)] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="customer_contact" className="block text-[14px] font-medium text-[var(--text-primary)] mb-1">
                Contact email or phone <span className="text-[var(--text-danger)]">*</span>
              </label>
              <input
                id="customer_contact"
                type="text"
                required
                placeholder="e.g. john@example.com or +1 555-0199"
                value={form.customer_contact}
                onChange={(e) => setForm({ ...form, customer_contact: e.target.value })}
                className="w-full h-11 px-4 text-[13px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--fill-accent)] focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className="text-[12px] font-medium uppercase tracking-[0.4px] text-[var(--text-secondary)] pb-2 border-b border-[var(--border)] m-0">
            Order & item details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="order_id" className="block text-[14px] font-medium text-[var(--text-primary)] mb-1">
                Order reference ID <span className="text-[var(--text-danger)]">*</span>
              </label>
              <input
                id="order_id"
                type="text"
                required
                placeholder="e.g. ORD-2024-9941"
                value={form.order_id}
                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                className="w-full h-11 px-4 text-[13px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--fill-accent)] focus:outline-none font-mono"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-[14px] font-medium text-[var(--text-primary)] mb-1">
                Quantity <span className="text-[var(--text-danger)]">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className="w-full h-11 px-4 text-[13px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label htmlFor="item_name" className="block text-[14px] font-medium text-[var(--text-primary)] mb-1">
              Item name / SKU description <span className="text-[var(--text-danger)]">*</span>
            </label>
            <input
              id="item_name"
              type="text"
              required
              placeholder="e.g. Orthopedic Arch Support Insoles - Size 10"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              className="w-full h-11 px-4 text-[13px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--fill-accent)] focus:outline-none"
            />
            <p className="text-[12px] text-[var(--text-muted)] mt-1">
              Note: Business Rule 3 ensures only one live request exists per (Order ID, Item Name).
            </p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-[14px] font-medium text-[var(--text-primary)] mb-1">
              Reason for return <span className="text-[var(--text-danger)]">*</span>
            </label>
            <select
              id="reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value as ReturnReason })}
              className="w-full h-11 px-4 text-[13px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none"
            >
              <option value="damaged">Damaged (arrived defective or damaged in transit)</option>
              <option value="wrong_item">Wrong item (incorrect SKU received)</option>
              <option value="size_issue">Size issue (does not fit)</option>
              <option value="not_as_described">Not as described (differs from specs/photos)</option>
              <option value="changed_mind">Changed mind (buyer remorse)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--border)] flex items-center justify-between">
          <Link
            href="/"
            className="px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] border border-[var(--border-strong)] bg-transparent text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center px-5 py-[9px] text-[13px] font-medium rounded-[var(--radius)] bg-[var(--fill-accent)] text-[var(--on-accent)] hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Creating request...' : 'Submit return request'}
          </button>
        </div>
      </form>
    </div>
  );
}
