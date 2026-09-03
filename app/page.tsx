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

  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    in_review: 0,
    approved: 0,
    completed: 0,
    rejected: 0,
    totalApprovedRefunds: 0,
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
      if (json.stats) {
        setStats(json.stats);
      }
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
        <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg className="w-3.5 h-3.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-3.5 h-3.5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Returns Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time customer return tickets, lifecycle progression, and resolutions.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 shadow-2xs flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Live Sync</span>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Total Live Returns */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">Total Returns</span>
            <span className="w-2 h-2 rounded-full bg-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-slate-900 mt-2">
            {stats.total}
          </div>
          <div className="text-[11px] text-green-600 font-medium mt-1 flex items-center gap-1">
            <span>↑ Live tickets</span>
          </div>
        </div>

        {/* Card 2: In Review (amber-500) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">In Review</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-900 mt-2">
            {stats.in_review}
          </div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Pending agent action
          </div>
        </div>

        {/* Card 3: Approved (blue-600) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">Approved</span>
            <span className="w-2 h-2 rounded-full bg-blue-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-blue-900 mt-2">
            {stats.approved}
          </div>
          <div className="text-[11px] text-blue-700 font-medium mt-1 font-mono">
            {stats.totalApprovedRefunds > 0 ? `₹${stats.totalApprovedRefunds.toFixed(0)} refunds` : 'Ready to fulfill'}
          </div>
        </div>

        {/* Card 4: Completed (green-600) */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-xs transition-shadow">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span className="font-medium">Completed</span>
            <span className="w-2 h-2 rounded-full bg-green-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-green-900 mt-2">
            {stats.completed}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-1">
            Closed & fulfilled
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {[
          { key: '', label: 'All Returns', count: stats.total },
          { key: 'open', label: 'Open', count: stats.open },
          { key: 'in_review', label: 'In Review', count: stats.in_review },
          { key: 'approved', label: 'Approved', count: stats.approved },
          { key: 'completed', label: 'Completed', count: stats.completed },
          { key: 'rejected', label: 'Rejected', count: stats.rejected },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isActive
                      ? 'bg-blue-200/80 text-blue-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Debounced Search */}
          <div className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="Search by reference, order, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-12 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/70 focus:bg-white text-slate-900 placeholder:text-slate-400"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="text-slate-400 hover:text-slate-600"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 border border-slate-200 rounded">
                  /
                </kbd>
              )}
            </div>
          </div>

          {/* Reason Filter */}
          <div>
            <select
              value={reasonFilter}
              onChange={(e) => {
                setReasonFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full py-2 px-3 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50/70 focus:bg-white text-slate-800"
            >
              <option value="">All Return Reasons</option>
              <option value="damaged">Damaged</option>
              <option value="wrong_item">Wrong Item</option>
              <option value="size_issue">Size Issue</option>
              <option value="not_as_described">Not as Described</option>
              <option value="changed_mind">Changed Mind</option>
            </select>
          </div>

          {/* Reset Filters button */}
          {(search || statusFilter || reasonFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setReasonFilter('');
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="text-xs font-semibold text-slate-600 hover:text-blue-600 border border-dashed border-slate-300 rounded-lg py-2 px-3 hover:border-slate-400 transition-colors flex items-center justify-center gap-1"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        {(debouncedSearch || statusFilter || reasonFilter) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Active:
            </span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 font-medium text-xs border border-blue-200">
                Query: &ldquo;{debouncedSearch}&rdquo;
                <button
                  onClick={() => setSearch('')}
                  className="text-blue-400 hover:text-blue-700 font-bold"
                  aria-label="Remove search filter"
                >
                  ✕
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 font-medium text-xs border border-blue-200 capitalize">
                Status: {statusFilter.replace('_', ' ')}
                <button
                  onClick={() => setStatusFilter('')}
                  className="text-blue-400 hover:text-blue-700 font-bold"
                  aria-label="Remove status filter"
                >
                  ✕
                </button>
              </span>
            )}
            {reasonFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-900 font-medium text-xs border border-blue-200 capitalize">
                Reason: {reasonFilter.replace('_', ' ')}
                <button
                  onClick={() => setReasonFilter('')}
                  className="text-blue-400 hover:text-blue-700 font-bold"
                  aria-label="Remove reason filter"
                >
                  ✕
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('');
                setReasonFilter('');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-800 flex items-start gap-3 shadow-2xs">
          <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-semibold">Failed to fetch return requests</p>
            <p className="mt-0.5 text-red-700">{error}</p>
          </div>
          <button
            onClick={() => fetchRequests()}
            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-red-100 hover:bg-red-200 text-red-800 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table or Card List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {loading ? (
          /* Table Skeleton Loader */
          <div className="divide-y divide-slate-200 bg-white">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4 animate-pulse">
                <div className="w-24 h-4 bg-slate-100 rounded" />
                <div className="w-36 h-4 bg-slate-100 rounded hidden sm:block" />
                <div className="w-52 h-4 bg-slate-100 rounded flex-1" />
                <div className="w-20 h-4 bg-slate-100 rounded hidden md:block" />
                <div className="w-24 h-5 bg-slate-100 rounded-full" />
                <div className="w-16 h-4 bg-slate-100 rounded text-right" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-slate-900">No return requests found</h3>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">
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
                className="mt-2 text-xs font-semibold text-blue-600 hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 uppercase tracking-wider select-none">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      <button
                        onClick={() => handleSort('reference')}
                        className="flex items-center gap-1 group hover:text-slate-900 focus:outline-none"
                      >
                        Reference {getSortIcon('reference')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <button
                        onClick={() => handleSort('customer_name')}
                        className="flex items-center gap-1 group hover:text-slate-900 focus:outline-none"
                      >
                        Customer {getSortIcon('customer_name')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <button
                        onClick={() => handleSort('order_id')}
                        className="flex items-center gap-1 group hover:text-slate-900 focus:outline-none"
                      >
                        Item & Order {getSortIcon('order_id')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <button
                        onClick={() => handleSort('reason')}
                        className="flex items-center gap-1 group hover:text-slate-900 focus:outline-none"
                      >
                        Reason {getSortIcon('reason')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 group hover:text-slate-900 focus:outline-none"
                      >
                        Status {getSortIcon('status')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="inline-flex items-center gap-1 group hover:text-slate-900 focus:outline-none"
                      >
                        Created {getSortIcon('created_at')}
                      </button>
                    </th>
                    <th scope="col" className="w-8 px-2 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => (window.location.href = `/requests/${item.id}`)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Link
                          href={`/requests/${item.id}`}
                          className="font-mono text-xs font-bold text-slate-900 group-hover:text-blue-600 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {item.reference}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-xs text-slate-900">{item.customer_name}</div>
                        <div className="text-[11px] font-mono text-slate-500 truncate max-w-[160px]">
                          {item.customer_contact}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-xs text-slate-900">
                          <span className="line-clamp-1 max-w-[240px]">{item.item_name}</span>
                          <span className="px-1.5 py-0.2 rounded bg-slate-100 text-[10px] font-mono text-slate-700 font-semibold border border-slate-200 shrink-0">
                            ×{item.quantity}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                          {item.order_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <ReasonBadge reason={item.reason} />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <StatusBadge status={item.status} size="sm" />
                          {item.resolution && (
                            <ResolutionBadge
                              resolution={item.resolution}
                              refundAmount={item.refund_amount}
                            />
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-xs text-slate-500 font-mono">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-2 py-3 text-right">
                        <svg
                          className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors ml-auto"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
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
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing{' '}
              <span className="font-semibold text-slate-900">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-semibold text-slate-900">{pagination.total}</span> requests
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors shadow-2xs"
              >
                Previous
              </button>

              <span className="px-2 py-1 text-slate-700 font-mono">
                {pagination.page} / {pagination.totalPages || 1}
              </span>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-slate-700 transition-colors shadow-2xs"
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
