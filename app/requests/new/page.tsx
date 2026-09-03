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
          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-frido-ink transition-colors mb-3"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Desk
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-frido-ink">
          Raise Return / Replacement Request
        </h1>
        <p className="text-sm text-zinc-600 mt-1">
          Internal agent form. The reference number will be generated automatically by the server.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 flex items-start gap-3 shadow-sm">
          <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="font-semibold">Unable to raise request</p>
            <p className="mt-0.5 text-xs text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-frido-line p-6 shadow-sm space-y-5">
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 pb-2 border-b border-frido-line">
            Customer Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="customer_name" className="block text-xs font-semibold text-zinc-700 mb-1">
                Customer Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                id="customer_name"
                type="text"
                required
                placeholder="e.g. John Doe"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                className="w-full text-sm p-2.5 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-frido-violet focus:border-transparent text-zinc-900 bg-zinc-50 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor="customer_contact" className="block text-xs font-semibold text-zinc-700 mb-1">
                Contact Email or Phone <span className="text-rose-500">*</span>
              </label>
              <input
                id="customer_contact"
                type="text"
                required
                placeholder="e.g. john@example.com or +1 555-0199"
                value={form.customer_contact}
                onChange={(e) => setForm({ ...form, customer_contact: e.target.value })}
                className="w-full text-sm p-2.5 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-frido-violet focus:border-transparent text-zinc-900 bg-zinc-50 focus:bg-white"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-500 pb-2 border-b border-frido-line">
            Order & Item Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="order_id" className="block text-xs font-semibold text-zinc-700 mb-1">
                Order Reference ID <span className="text-rose-500">*</span>
              </label>
              <input
                id="order_id"
                type="text"
                required
                placeholder="e.g. ORD-2024-9941"
                value={form.order_id}
                onChange={(e) => setForm({ ...form, order_id: e.target.value })}
                className="w-full text-sm p-2.5 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-frido-violet focus:border-transparent text-zinc-900 bg-zinc-50 focus:bg-white font-mono"
              />
            </div>

            <div>
              <label htmlFor="quantity" className="block text-xs font-semibold text-zinc-700 mb-1">
                Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                id="quantity"
                type="number"
                min="1"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
                className="w-full text-sm p-2.5 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-frido-violet focus:border-transparent text-zinc-900 bg-zinc-50 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label htmlFor="item_name" className="block text-xs font-semibold text-zinc-700 mb-1">
              Item Name / SKU Description <span className="text-rose-500">*</span>
            </label>
            <input
              id="item_name"
              type="text"
              required
              placeholder="e.g. Orthopedic Arch Support Insoles - Size 10"
              value={form.item_name}
              onChange={(e) => setForm({ ...form, item_name: e.target.value })}
              className="w-full text-sm p-2.5 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-frido-violet focus:border-transparent text-zinc-900 bg-zinc-50 focus:bg-white"
            />
            <p className="text-[11px] text-zinc-500 mt-1">
              Note: Business Rule 3 ensures only one live request exists per (Order ID, Item Name).
            </p>
          </div>

          <div>
            <label htmlFor="reason" className="block text-xs font-semibold text-zinc-700 mb-1">
              Reason for Return <span className="text-rose-500">*</span>
            </label>
            <select
              id="reason"
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value as ReturnReason })}
              className="w-full text-sm p-2.5 rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-frido-violet focus:border-transparent text-zinc-900 bg-zinc-50 focus:bg-white"
            >
              <option value="damaged">Damaged (arrived defective or damaged in transit)</option>
              <option value="wrong_item">Wrong Item (incorrect SKU received)</option>
              <option value="size_issue">Size Issue (does not fit)</option>
              <option value="not_as_described">Not as Described (differs from specs/photos)</option>
              <option value="changed_mind">Changed Mind (buyer remorse)</option>
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-frido-line flex items-center justify-between">
          <Link
            href="/"
            className="text-xs font-semibold text-zinc-600 hover:text-zinc-800"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold rounded-lg bg-frido-violet hover:bg-frido-violet-dark text-white transition-all shadow-xs hover:shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? 'Creating Request...' : 'Submit Return Request'}
          </button>
        </div>
      </form>
    </div>
  );
}
