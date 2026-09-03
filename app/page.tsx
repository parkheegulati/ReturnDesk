'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/StatusBadge';
import { ReasonBadge, ResolutionBadge } from '@/components/Badges';
import { RequestStatus, ReturnReason } from '@/drizzle/schema';

interface RequestItem {
  id: string;
  reference: string;
  customer_name: string;
  customer_contact: string;
  order_id: string;
  item_name: string;
  quantity: number;
  reason: ReturnReason;
  status: RequestStatus;
  resolution: string | null;
  refund_amount: string | null;
  created_at: string;
  updated_at: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function RequestsPage() {
  const [items, setItems] = useState<RequestItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [reasonFilter, setReasonFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch list whenever query params change
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    params.set('page', pagination.page.toString());
    params.set('limit', pagination.limit.toString());
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);

    if (debouncedSearch.trim()) params.set('search', debouncedSearch.trim());
    if (statusFilter) params.set('status', statusFilter);
    if (reasonFilter) params.set('reason', reasonFilter);

    try {
      const res = await fetch(`/api/requests?${params.toString()}`);
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || `Server returned ${res.status}`);
      }

      setItems(json.data);
      setPagination(json.pagination);
    } catch (err: any) {
      setError(err.message || 'Failed to load return requests from the desk.');
    } finally {
      setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    debouncedSearch,
    statusFilter,
    reasonFilter,
    sortBy,
    sortOrder,
  ]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const getSortIcon = (column: string) => {
    if (sortBy !== column) {
      return (
        <svg className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-3.5 h-3.5 text-frido-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3.5 h-3.5 text-frido-ink" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-frido-ink">
            Returns Overview
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Real-time customer return tickets, lifecycle progression, and resolutions.
          </p>
        </div>

        {/* Live Metrics Summary */}
        <div className="flex items-center gap-2 text-xs">
          <div className="bg-white border border-frido-line rounded-md px-3 py-1.5 shadow-sm">
            <span className="text-zinc-500">Total Live:</span>{' '}
            <span className="font-bold font-mono text-frido-ink">{pagination.total}</span>
          </div>
        </div>
      </div>

      {/* Status Filter Tabs (One-click lifecycle filtering) */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-b border-frido-line scrollbar-none">
        {[
          { key: '', label: 'All' },
          { key: 'open', label: 'Open' },
          { key: 'in_review', label: 'In Review' },
          { key: 'approved', label: 'Approved' },
          { key: 'completed', label: 'Completed' },
          { key: 'rejected', label: 'Rejected' },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-frido-ink text-white shadow-sm'
                  : 'bg-white text-zinc-600 hover:text-frido-ink hover:bg-zinc-100 border border-frido-line'
              }`}
            >
              {tab.key === 'in_review' && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FCD00F]" />
              )}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-lg border border-frido-line p-3.5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Debounced Search */}
          <div className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="Search by reference (RD-...), order ID, customer name, or item..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-frido-amber focus:border-transparent bg-zinc-50 focus:bg-white text-zinc-900"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Reason Filter */}
          <div>
            <select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full py-2 px-3 text-sm rounded-md border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-frido-amber focus:border-transparent bg-zinc-50 focus:bg-white text-zinc-800"
            >
              <option value="">All Return Reasons</option>
              <option value="damaged">Damaged</option>
              <option value="wrong_item">Wrong Item</option>
              <option value="size_issue">Size Issue</option>
              <option value="not_as_described">Not as Described</option>
              <option value="changed_mind">Changed Mind</option>
            </select>
          </div>

          {/* Clear Filters button */}
          {(search || statusFilter || reasonFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setReasonFilter('');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="text-xs font-medium text-zinc-600 hover:text-frido-ink border border-dashed border-zinc-300 rounded-md py-2 px-3 hover:border-zinc-400 transition-colors flex items-center justify-center gap-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg bg-rose-50 border border-rose-200 p-4 text-sm text-rose-800 flex items-start gap-3 shadow-sm">
          <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Failed to fetch return requests</p>
            <p className="mt-0.5 text-rose-700">{error}</p>
          </div>
          <button
            onClick={() => fetchRequests()}
            className="text-xs font-semibold px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table or Card List */}
      <div className="bg-white rounded-lg border border-frido-line shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">
            <div className="inline-block animate-spin w-6 h-6 border-2 border-frido-amber border-t-transparent rounded-full mb-3" />
            <p className="text-sm font-medium">Loading return requests..</p>
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto text-zinc-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-frido-ink">No return requests found</h3>
            <p className="text-sm text-zinc-500 max-w-sm mx-auto">
              {debouncedSearch || statusFilter || reasonFilter
                ? 'No requests match your current search and filter criteria. Try adjusting or clearing filters.'
                : 'There are currently no active return requests on the desk.'}
            </p>
            {(debouncedSearch || statusFilter || reasonFilter) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('');
                  setReasonFilter('');
                }}
                className="mt-2 text-xs font-semibold text-frido-amber-dark hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-frido-line text-left text-sm">
                <thead className="bg-[#F7F7F7] text-xs font-semibold text-zinc-600 uppercase tracking-wider select-none">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      <button
                        onClick={() => handleSort('reference')}
                        className="flex items-center gap-1.5 group hover:text-frido-ink focus:outline-none"
                      >
                        Reference {getSortIcon('reference')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        onClick={() => handleSort('customer_name')}
                        className="flex items-center gap-1.5 group hover:text-frido-ink focus:outline-none"
                      >
                        Customer {getSortIcon('customer_name')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        onClick={() => handleSort('order_id')}
                        className="flex items-center gap-1.5 group hover:text-frido-ink focus:outline-none"
                      >
                        Order & Item {getSortIcon('order_id')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        onClick={() => handleSort('reason')}
                        className="flex items-center gap-1.5 group hover:text-frido-ink focus:outline-none"
                      >
                        Reason {getSortIcon('reason')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1.5 group hover:text-frido-ink focus:outline-none"
                      >
                        Status {getSortIcon('status')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="inline-flex items-center gap-1.5 group hover:text-frido-ink focus:outline-none"
                      >
                        Created {getSortIcon('created_at')}
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-frido-line bg-white">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-amber-50/40 transition-colors group cursor-pointer"
                      onClick={() => (window.location.href = `/requests/${item.id}`)}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <Link
                          href={`/requests/${item.id}`}
                          className="font-mono font-bold text-frido-ink group-hover:text-amber-700 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-medium text-frido-ink">{item.customer_name}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[180px]">
                          {item.customer_contact}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs font-mono text-zinc-500">{item.order_id}</div>
                        <div className="font-medium text-zinc-900 line-clamp-1 max-w-[260px]">
                          {item.item_name} <span className="text-zinc-500 font-normal">×{item.quantity}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <ReasonBadge reason={item.reason} />
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={item.status} />
                          {item.resolution && (
                            <ResolutionBadge
                              resolution={item.resolution}
                              refundAmount={item.refund_amount}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-xs text-zinc-500 font-mono">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (down to 375px) */}
            <div className="md:hidden divide-y divide-frido-line">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/requests/${item.id}`}
                  className="block p-4 hover:bg-zinc-50 active:bg-zinc-100 transition-colors space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-sm text-frido-ink">
                      {item.reference}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  <div>
                    <div className="font-semibold text-sm text-frido-ink">{item.customer_name}</div>
                    <div className="text-xs text-zinc-600 line-clamp-1 mt-0.5">
                      {item.item_name} <span className="text-zinc-500">×{item.quantity}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ReasonBadge reason={item.reason} />
                      {item.resolution && (
                        <ResolutionBadge
                          resolution={item.resolution}
                          refundAmount={item.refund_amount}
                        />
                      )}
                    </div>
                    <span className="font-mono text-zinc-400">
                      {new Date(item.created_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Pagination Footer */}
        {!loading && pagination.total > 0 && (
          <div className="bg-[#F7F7F7] px-4 py-3 border-t border-frido-line flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-600">
            <div>
              Showing{' '}
              <span className="font-semibold text-zinc-900">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-zinc-900">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-zinc-900">{pagination.total}</span> requests
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-zinc-700 transition-colors"
              >
                Previous
              </button>

              <span className="px-2 py-1 text-zinc-700 font-mono">
                {pagination.page} / {pagination.totalPages || 1}
              </span>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-zinc-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
