import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { requests } from '@/drizzle/schema';
import { statusTransitionSchema } from '@/lib/validations';
import { errorResponse, handleApiError } from '@/lib/api-error';
import { isLegalTransition, isTerminalStatus } from '@/lib/transitions';
import { eq } from 'drizzle-orm';

interface RouteContext {
  params: { id: string };
}

/**
 * PATCH /api/requests/[id]/status
 * Dedicated lifecycle transition endpoint.
 *
 * Enforces:
 * - Business Rule 1: Status flow state machine.
 *   Terminal states (rejected, completed) are immutable.
 *   Illegal transitions return 409 ILLEGAL_TRANSITION.
 * - Business Rule 2: Atomic approval resolution.
 *   Transitioning to approved requires resolution; refund requires refund_amount > 0;
 *   non-refund forbids refund_amount. Validated and written as a single atomic unit.
 *   Violations return 409 APPROVAL_INCOMPLETE.
 */
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    // 1. Fetch current record
    const [existing] = await db
      .select()
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!existing || existing.removed_at !== null) {
      return errorResponse(404, 'NOT_FOUND', 'Return request not found or has been removed.');
    }

    // 2. Parse and cross-validate payload atomically with Zod
    const json = await req.json();
    const parseResult = statusTransitionSchema.safeParse(json);

    if (!parseResult.success) {
      // Check if the validation issue was specifically our Rule 2 cross-field rules
      const rule2Issue = parseResult.error.issues.find(
        (i) => i.path.includes('resolution') || i.path.includes('refund_amount')
      );

      if (rule2Issue && (json.status === 'approved' || json.resolution !== undefined)) {
        return errorResponse(
          409,
          'APPROVAL_INCOMPLETE',
          rule2Issue.message,
          parseResult.error.issues
        );
      }

      // General schema validation failure
      return handleApiError(parseResult.error);
    }

    const { status: targetStatus, resolution, refund_amount } = parseResult.data;

    // 3. Enforce Rule 1: State Machine & Terminal check
    if (isTerminalStatus(existing.status)) {
      return errorResponse(
        409,
        'ILLEGAL_TRANSITION',
        `Cannot transition from terminal status "${existing.status}". Completed and rejected requests cannot be reopened or transitioned.`
      );
    }

    if (!isLegalTransition(existing.status, targetStatus)) {
      return errorResponse(
        409,
        'ILLEGAL_TRANSITION',
        `Illegal transition from "${existing.status}" to "${targetStatus}". Allowed next statuses: ${
          existing.status === 'open'
            ? 'in_review, rejected'
            : existing.status === 'in_review'
            ? 'approved, rejected'
            : existing.status === 'approved'
            ? 'completed'
            : 'none (terminal)'
        }.`
      );
    }

    // 4. Atomic single update statement in PostgreSQL
    const updatePayload: {
      status: typeof targetStatus;
      resolution?: typeof resolution;
      refund_amount?: string | null;
      updated_at: Date;
    } = {
      status: targetStatus,
      updated_at: new Date(),
    };

    if (targetStatus === 'approved') {
      updatePayload.resolution = resolution;
      updatePayload.refund_amount =
        resolution === 'refund' && refund_amount !== undefined && refund_amount !== null
          ? refund_amount.toString()
          : null;
    }

    const [updated] = await db
      .update(requests)
      .set(updatePayload)
      .where(eq(requests.id, id))
      .returning();

    return NextResponse.json({ data: updated });
  } catch (err) {
    return handleApiError(err);
  }
}
