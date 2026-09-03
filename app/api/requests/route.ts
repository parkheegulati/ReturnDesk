import { NextRequest, NextResponse } from 'next/server';
import { db, pool } from '@/drizzle/db';
import { requests, RequestStatus, ReturnReason } from '@/drizzle/schema';
import { createRequestSchema, listQuerySchema } from '@/lib/validations';
import { handleApiError } from '@/lib/api-error';
import { and, asc, desc, eq, ilike, isNull, or, sql } from 'drizzle-orm';

/**
 * GET /api/requests
 * Lists requests with search, filter, sort, and pagination — strictly executed in SQL.
 * Removed requests (removed_at IS NOT NULL) are automatically filtered out.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());
    const query = listQuerySchema.parse(searchParams);

    // Base conditions: exclude soft-deleted records
    const conditions = [isNull(requests.removed_at)];

    if (query.status) {
      conditions.push(eq(requests.status, query.status as RequestStatus));
    }

    if (query.reason) {
      conditions.push(eq(requests.reason, query.reason as ReturnReason));
    }

    if (query.search && query.search.trim() !== '') {
      const pattern = `%${query.search.trim()}%`;
      conditions.push(
        or(
          ilike(requests.reference, pattern),
          ilike(requests.customer_name, pattern),
          ilike(requests.order_id, pattern),
          ilike(requests.item_name, pattern),
          ilike(requests.customer_contact, pattern)
        )!
      );
    }

    const whereClause = and(...conditions);

    // Sorting column mapping
    const sortColumnMap = {
      created_at: requests.created_at,
      updated_at: requests.updated_at,
      reference: requests.reference,
      customer_name: requests.customer_name,
      order_id: requests.order_id,
      status: requests.status,
      reason: requests.reason,
    };

    const targetColumn = sortColumnMap[query.sortBy] ?? requests.created_at;
    const orderDirection = query.sortOrder === 'asc' ? asc(targetColumn) : desc(targetColumn);

    const offset = (query.page - 1) * query.limit;

    // Run data fetch, filtered total, global status breakdown, and approved refund sum concurrently in PostgreSQL
    const [data, totalCountRes, statusCountsRes, approvedRefundRes] = await Promise.all([
      db
        .select()
        .from(requests)
        .where(whereClause)
        .orderBy(orderDirection)
        .limit(query.limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(requests)
        .where(whereClause),
      db
        .select({
          status: requests.status,
          count: sql<number>`count(*)::int`,
        })
        .from(requests)
        .where(isNull(requests.removed_at))
        .groupBy(requests.status),
      db
        .select({
          totalRefund: sql<string>`COALESCE(sum(refund_amount), 0)::text`,
        })
        .from(requests)
        .where(and(isNull(requests.removed_at), eq(requests.status, 'approved'))),
    ]);

    const total = totalCountRes[0]?.count ?? 0;
    const totalPages = Math.ceil(total / query.limit);

    const counts: Record<string, number> = {
      open: 0,
      in_review: 0,
      approved: 0,
      completed: 0,
      rejected: 0,
    };
    let globalTotal = 0;
    for (const row of statusCountsRes) {
      counts[row.status] = row.count;
      globalTotal += row.count;
    }

    return NextResponse.json({
      data,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages,
      },
      stats: {
        total: globalTotal,
        open: counts.open,
        in_review: counts.in_review,
        approved: counts.approved,
        completed: counts.completed,
        rejected: counts.rejected,
        totalApprovedRefunds: parseFloat(approvedRefundRes[0]?.totalRefund ?? '0'),
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/requests
 * Creates a new return request in 'open' status.
 *
 * Enforces Business Rule 3:
 * One live request per item per order. Enforced at the DB level via partial unique index.
 * Postgres constraint violation 23505 is caught and cleanly returned as 409 DUPLICATE_LIVE_REQUEST.
 */
export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const data = createRequestSchema.parse(json);

    // Atomically fetch next sequence number for reference RD-000123
    const seqResult = await pool.query(
      "SELECT LPAD(nextval('request_reference_seq')::text, 6, '0') as ref"
    );
    const reference = `RD-${seqResult.rows[0].ref}`;

    // Insert into database
    const [created] = await db
      .insert(requests)
      .values({
        reference,
        customer_name: data.customer_name,
        customer_contact: data.customer_contact,
        order_id: data.order_id,
        item_name: data.item_name,
        quantity: data.quantity,
        reason: data.reason,
        status: 'open',
      })
      .returning();

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
