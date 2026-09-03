import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { notes, requests } from '@/drizzle/schema';
import { updateRequestSchema } from '@/lib/validations';
import { ApiError, errorResponse, handleApiError } from '@/lib/api-error';
import { isLockedStatus } from '@/lib/transitions';
import { asc, eq, isNull } from 'drizzle-orm';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/requests/[id]
 * Retrieves request details and note history.
 * Soft-deleted records (removed_at IS NOT NULL) return 404 NOT_FOUND.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    const [request] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!request || request.removed_at !== null) {
      return errorResponse(404, 'NOT_FOUND', 'Return request not found or has been removed.');
    }

    // Fetch notes ordered chronologically
    const requestNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.request_id, id))
      .orderBy(asc(notes.created_at));

    return NextResponse.json({
      data: {
        ...request,
        notes: requestNotes,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * PATCH /api/requests/[id]
 * General field edit for a return request.
 *
 * Enforces Business Rule 4:
 * Locked once decided. If status is approved, rejected, or completed,
 * fields (customer_name, customer_contact, order_id, item_name, quantity, reason)
 * are immutable. Edits are refused with HTTP 409 RECORD_LOCKED.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    const [existing] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!existing || existing.removed_at !== null) {
      return errorResponse(404, 'NOT_FOUND', 'Return request not found or has been removed.');
    }

    // Business Rule 4: Locked once decided
    if (isLockedStatus(existing.status)) {
      return errorResponse(
        409,
        'RECORD_LOCKED',
        `This return request has already been decided (status: "${existing.status}"). Details cannot be edited once approved, rejected, or completed.`
      );
    }

    const json = await req.json();
    const updateData = updateRequestSchema.parse(json);

    const [updated] = await db
      .update(requests)
      .set({
        ...updateData,
        updated_at: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
