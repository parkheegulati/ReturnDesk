import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { requests } from '@/drizzle/schema';
import { errorResponse, handleApiError } from '@/lib/api-error';
import { isRemovableStatus } from '@/lib/transitions';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: { id: string };
}

/**
 * POST /api/requests/[id]/remove
 * Soft deletes a return request by setting `removed_at = NOW()`.
 *
 * Enforces Business Rule 5:
 * Only 'open' or 'rejected' requests may be removed.
 * Attempts to remove requests in 'in_review', 'approved', or 'completed' status
 * are refused with HTTP 409 CANNOT_REMOVE_REQUEST.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    const [existing] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!existing || existing.removed_at !== null) {
      return errorResponse(404, 'NOT_FOUND', 'Return request not found or has already been removed.');
    }

    // Business Rule 5: Only Open or Rejected requests may be removed
    if (!isRemovableStatus(existing.status)) {
      return errorResponse(
        409,
        'CANNOT_REMOVE_REQUEST',
        `Only "open" or "rejected" return requests can be removed from the desk. Current status is "${existing.status}".`
      );
    }

    const [updated] = await db
      .update(requests)
      .set({
        removed_at: new Date(),
        updated_at: new Date(),
      })
      .where(eq(requests.id, id))
      .returning();

    return NextResponse.json({
      message: 'Request successfully removed from the desk.',
      data: {
        id: updated.id,
        reference: updated.reference,
        removed_at: updated.removed_at,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
