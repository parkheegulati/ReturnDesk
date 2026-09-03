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
          <h1 className="text-[24px] font-medium tracking-tight text-[var(--text-primary)] m-0">
            Returns Operations
          </h1>
          <p className="text-[13px] font-normal text-[var(--text-secondary)] mt-1">
            Real-time customer return tickets, lifecycle progression, and resolutions.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <div className="px-3 py-1 rounded-[var(--radius)] bg-[var(--bg-success)] border border-[var(--border-success)] text-[12px] font-medium text-[var(--text-success)] flex items-center gap-2">
            <span className="w-[7px] h-[7px] rounded-full bg-[var(--fill-success)] pulse-dot inline-block" />
            <span>Live sync</span>
          </div>
        </div>
      </div>

      {/* 4 Executive Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Returns */}
        <div className="bg-[var(--surface-2)] rounded-[12px] p-5 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-secondary)] uppercase tracking-[0.4px] font-medium">
              Total returns
            </span>
            <span className="w-[7px] h-[7px] rounded-full bg-[var(--fill-accent)] inline-block" />
          </div>
          <div className="text-[32px] font-medium font-mono text-[var(--text-primary)] mt-2 leading-none">
            {stats.total}
          </div>
          <div className="text-[12px] text-[var(--text-secondary)] mt-2">
            Live tickets across desk
          </div>
        </div>

        {/* Card 2: In Review (Featured / Urgent Card: 2px warning border per design system) */}
        <div className="bg-[var(--surface-2)] rounded-[12px] p-5 border-2 border-[var(--border-warning)]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-warning)] uppercase tracking-[0.4px] font-medium">
              In review
            </span>
            <span className="w-[7px] h-[7px] rounded-full bg-[var(--fill-warning)] pulse-dot inline-block" />
          </div>
          <div className="text-[32px] font-medium font-mono text-[var(--text-warning)] mt-2 leading-none">
            {stats.in_review}
          </div>
          <div className="text-[12px] text-[var(--text-warning)] mt-2">
            Needs attention
          </div>
        </div>

        {/* Card 3: Approved */}
        <div className="bg-[var(--surface-2)] rounded-[12px] p-5 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-secondary)] uppercase tracking-[0.4px] font-medium">
              Approved
            </span>
            <span className="w-[7px] h-[7px] rounded-full bg-[var(--fill-accent)] inline-block" />
          </div>
          <div className="text-[32px] font-medium font-mono text-[var(--text-primary)] mt-2 leading-none">
            {stats.approved}
          </div>
          <div className="text-[12px] text-[var(--text-secondary)] mt-2 font-mono">
            {stats.totalApprovedRefunds > 0 ? `₹${stats.totalApprovedRefunds.toFixed(0)} in refunds` : 'Ready to fulfill'}
          </div>
        </div>

        {/* Card 4: Completed */}
        <div className="bg-[var(--surface-2)] rounded-[12px] p-5 border border-[var(--border)]">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-[var(--text-secondary)] uppercase tracking-[0.4px] font-medium">
              Completed
            </span>
            <span className="w-[7px] h-[7px] rounded-full bg-[var(--fill-success)] inline-block" />
          </div>
          <div className="text-[32px] font-medium font-mono text-[var(--text-primary)] mt-2 leading-none">
            {stats.completed}
          </div>
          <div className="text-[12px] text-[var(--text-secondary)] mt-2">
            Closed & fulfilled
          </div>
        </div>
      </div>

      {/* Filter/Tab Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[var(--border)] scrollbar-none">
        {[
          { key: '', label: 'All returns', count: stats.total, dotColor: 'var(--fill-accent)' },
          { key: 'open', label: 'Open', count: stats.open, dotColor: 'var(--text-muted)' },
          { key: 'in_review', label: 'In review', count: stats.in_review, dotColor: 'var(--fill-warning)' },
          { key: 'approved', label: 'Approved', count: stats.approved, dotColor: 'var(--fill-accent)' },
          { key: 'completed', label: 'Completed', count: stats.completed, dotColor: 'var(--fill-success)' },
          { key: 'rejected', label: 'Rejected', count: stats.rejected, dotColor: 'var(--fill-danger)' },
        ].map((tab) => {
          const isActive = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => {
                setStatusFilter(tab.key);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-4 py-[9px] text-[13px] font-medium rounded-[var(--radius)] transition-colors whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? 'bg-[var(--fill-accent)] text-[var(--on-accent)] border-none'
                  : 'bg-transparent border border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
              }`}
            >
              <span
                className="w-[7px] h-[7px] rounded-full inline-block shrink-0"
                style={{ backgroundColor: isActive ? 'var(--on-accent)' : tab.dotColor }}
              />
              <span>{tab.label}</span>
              <span className={`text-[12px] font-mono ${isActive ? 'text-[var(--on-accent)]' : 'text-[var(--text-muted)]'}`}>
                ({tab.count})
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter and Search Bar Surface */}
      <div className="bg-[var(--surface-2)] rounded-[12px] border border-[var(--border)] p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {/* Debounced Search */}
          <div className="relative sm:col-span-2">
            <input
              type="text"
              placeholder="Search by reference, order, or customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 h-11 text-[13px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--fill-accent)] focus:outline-none"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center gap-1.5">
              {search ? (
                <button
                  onClick={() => setSearch('')}
                  className="text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  aria-label="Clear search"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : (
                <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[11px] font-mono text-[var(--text-muted)] bg-[var(--surface-2)] border border-[var(--border)] rounded">
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
              className="w-full h-11 px-3 text-[13px] rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-primary)] focus:border-[var(--fill-accent)] focus:outline-none"
            >
              <option value="">All return reasons</option>
              <option value="damaged">Damaged</option>
              <option value="wrong_item">Wrong item</option>
              <option value="size_issue">Size issue</option>
              <option value="not_as_described">Not as described</option>
              <option value="changed_mind">Changed mind</option>
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
              className="h-11 px-4 text-[13px] font-medium text-[var(--text-secondary)] border border-[var(--border-strong)] rounded-[var(--radius)] bg-transparent hover:border-[var(--border-strong)] transition-colors flex items-center justify-center gap-1"
            >
              Reset filters
            </button>
          )}
        </div>

        {/* Active Filter Chips */}
        {(debouncedSearch || statusFilter || reasonFilter) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)] text-[12px]">
            <span className="text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.4px]">
              Active:
            </span>
            {debouncedSearch && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-[4px] bg-[var(--bg-accent)] text-[var(--text-accent)] font-medium text-[12px] border border-[var(--border)]">
                Query: &ldquo;{debouncedSearch}&rdquo;
                <button
                  onClick={() => setSearch('')}
                  className="text-[var(--text-accent)] hover:opacity-75"
                  aria-label="Remove search filter"
                >
                  ✕
                </button>
              </span>
            )}
            {statusFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-[4px] bg-[var(--bg-accent)] text-[var(--text-accent)] font-medium text-[12px] border border-[var(--border)]">
                Status: {statusFilter.replace('_', ' ')}
                <button
                  onClick={() => setStatusFilter('')}
                  className="text-[var(--text-accent)] hover:opacity-75"
                  aria-label="Remove status filter"
                >
                  ✕
                </button>
              </span>
            )}
            {reasonFilter && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-[3px] rounded-[4px] bg-[var(--bg-accent)] text-[var(--text-accent)] font-medium text-[12px] border border-[var(--border)]">
                Reason: {reasonFilter.replace('_', ' ')}
                <button
                  onClick={() => setReasonFilter('')}
                  className="text-[var(--text-accent)] hover:opacity-75"
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
              className="text-[12px] font-medium text-[var(--text-accent)] hover:underline ml-1"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-[12px] bg-[var(--bg-danger)] border border-[var(--border-danger)] p-4 text-[13px] text-[var(--text-danger)] flex items-start gap-3">
          <svg className="w-5 h-5 text-[var(--text-danger)] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="font-medium">Failed to fetch return requests</p>
            <p className="mt-0.5 text-[12px] text-[var(--text-danger)]">{error}</p>
          </div>
          <button
            onClick={() => fetchRequests()}
            className="text-[12px] font-medium px-3 py-1 rounded-[var(--radius)] bg-transparent border border-[var(--border-danger)] text-[var(--text-danger)] hover:bg-[var(--bg-danger)]"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table or Card List */}
      <div className="bg-[var(--surface-2)] rounded-[12px] border border-[var(--border)] overflow-hidden">
        {loading ? (
          /* Table Skeleton Loader */
          <div className="divide-y divide-[var(--border)] bg-[var(--surface-2)]">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="px-4 py-3.5 flex items-center justify-between gap-4 animate-pulse">
                <div className="w-24 h-4 bg-[var(--surface-1)] rounded-[4px]" />
                <div className="w-36 h-4 bg-[var(--surface-1)] rounded-[4px] hidden sm:block" />
                <div className="w-52 h-4 bg-[var(--surface-1)] rounded-[4px] flex-1" />
                <div className="w-20 h-4 bg-[var(--surface-1)] rounded-[4px] hidden md:block" />
                <div className="w-24 h-5 bg-[var(--surface-1)] rounded-[4px]" />
                <div className="w-16 h-4 bg-[var(--surface-1)] rounded-[4px] text-right" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          /* Empty state */
          <div className="p-12 text-center space-y-3">
            <div className="w-10 h-10 rounded-[var(--radius)] bg-[var(--bg-accent)] flex items-center justify-center mx-auto text-[var(--text-accent)]">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-[16px] font-medium text-[var(--text-primary)] m-0">No return requests found</h3>
            <p className="text-[13px] text-[var(--text-secondary)] max-w-sm mx-auto">
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
                className="mt-2 text-[13px] font-medium text-[var(--text-accent)] hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-[var(--border)] text-left text-[13px]">
                <thead className="bg-[var(--surface-1)] text-[12px] font-medium text-[var(--text-secondary)] uppercase tracking-[0.4px] select-none">
                  <tr>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        onClick={() => handleSort('reference')}
                        className="flex items-center gap-1 group hover:text-[var(--text-primary)] focus:outline-none"
                      >
                        Reference {getSortIcon('reference')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        onClick={() => handleSort('customer_name')}
                        className="flex items-center gap-1 group hover:text-[var(--text-primary)] focus:outline-none"
                      >
                        Customer {getSortIcon('customer_name')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        onClick={() => handleSort('order_id')}
                        className="flex items-center gap-1 group hover:text-[var(--text-primary)] focus:outline-none"
                      >
                        Item & order {getSortIcon('order_id')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        onClick={() => handleSort('reason')}
                        className="flex items-center gap-1 group hover:text-[var(--text-primary)] focus:outline-none"
                      >
                        Reason {getSortIcon('reason')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5">
                      <button
                        onClick={() => handleSort('status')}
                        className="flex items-center gap-1 group hover:text-[var(--text-primary)] focus:outline-none"
                      >
                        Status {getSortIcon('status')}
                      </button>
                    </th>
                    <th scope="col" className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => handleSort('created_at')}
                        className="inline-flex items-center gap-1 group hover:text-[var(--text-primary)] focus:outline-none"
                      >
                        Created {getSortIcon('created_at')}
                      </button>
                    </th>
                    <th scope="col" className="w-8 px-2 py-3.5" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] bg-[var(--surface-2)]">
                  {items.map((item) => {
                    const isActionNeeded = item.status === 'in_review';
                    return (
                      <tr
                        key={item.id}
                        className={`transition-colors cursor-pointer ${
                          isActionNeeded ? 'bg-[var(--bg-warning)]/40 hover:bg-[var(--bg-warning)]/60' : 'hover:bg-[rgba(0,0,0,0.015)]'
                        }`}
                        onClick={() => (window.location.href = `/requests/${item.id}`)}
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <Link
                            href={`/requests/${item.id}`}
                            className="font-mono text-[13px] font-medium text-[var(--text-primary)] hover:text-[var(--text-accent)] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.reference}
                          </Link>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="font-medium text-[13px] text-[var(--text-primary)]">{item.customer_name}</div>
                          <div className="text-[12px] font-mono text-[var(--text-secondary)] truncate max-w-[160px]">
                            {item.customer_contact}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5 font-normal text-[13px] text-[var(--text-primary)]">
                            <span className="line-clamp-1 max-w-[240px]">{item.item_name}</span>
                            <span className="px-1.5 py-[1px] rounded-[4px] bg-[var(--surface-1)] text-[11px] font-mono text-[var(--text-secondary)] font-medium border border-[var(--border)] shrink-0">
                              ×{item.quantity}
                            </span>
                          </div>
                          <div className="text-[12px] font-mono text-[var(--text-secondary)] mt-0.5">
                            {item.order_id}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <ReasonBadge reason={item.reason} />
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
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
                        <td className="px-4 py-3.5 whitespace-nowrap text-right text-[12px] text-[var(--text-secondary)] font-mono">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-2 py-3.5 text-right">
                          <svg
                            className="w-4 h-4 text-[var(--text-muted)] group-hover:text-[var(--text-accent)] transition-colors ml-auto"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (down to 375px) */}
            <div className="md:hidden divide-y divide-[var(--border)]">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/requests/${item.id}`}
                  className="block p-4 hover:bg-[var(--surface-1)] transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-medium text-[13px] text-[var(--text-primary)]">
                      {item.reference}
                    </span>
                    <StatusBadge status={item.status} size="sm" />
                  </div>

                  <div>
                    <div className="font-medium text-[13px] text-[var(--text-primary)]">{item.customer_name}</div>
                    <div className="text-[12px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">
                      {item.item_name} <span className="text-[var(--text-muted)]">×{item.quantity}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[12px] pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <ReasonBadge reason={item.reason} />
                      {item.resolution && (
                        <ResolutionBadge
                          resolution={item.resolution}
                          refundAmount={item.refund_amount}
                        />
                      )}
                    </div>
                    <span className="font-mono text-[12px] text-[var(--text-muted)]">
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
          <div className="bg-[var(--surface-1)] px-4 py-3 border-t border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-[var(--text-secondary)]">
            <div>
              Showing{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium text-[var(--text-primary)]">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{' '}
              of <span className="font-medium text-[var(--text-primary)]">{pagination.total}</span> requests
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3.5 py-1.5 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface-2)] hover:bg-[var(--surface-1)] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[13px] text-[var(--text-secondary)] transition-colors"
              >
                Previous
              </button>

              <span className="px-2 py-1 text-[var(--text-secondary)] font-mono text-[12px]">
                {pagination.page} / {pagination.totalPages || 1}
              </span>

              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3.5 py-1.5 rounded-[var(--radius)] border border-[var(--border-strong)] bg-[var(--surface-2)] hover:bg-[var(--surface-1)] disabled:opacity-40 disabled:cursor-not-allowed font-medium text-[13px] text-[var(--text-secondary)] transition-colors"
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
