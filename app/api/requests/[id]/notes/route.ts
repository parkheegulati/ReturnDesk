import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/drizzle/db';
import { notes, requests } from '@/drizzle/schema';
import { createNoteSchema } from '@/lib/validations';
import { errorResponse, handleApiError } from '@/lib/api-error';
import { asc, eq } from 'drizzle-orm';

interface RouteContext {
  params: { id: string };
}

/**
 * GET /api/requests/[id]/notes
 * Lists all notes for a return request in chronological order (oldest to newest).
 * Soft-deleted requests return 404 NOT_FOUND.
 */
export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    const [parent] = await db
      .select({ id: requests.id, removed_at: requests.removed_at })
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!parent || parent.removed_at !== null) {
      return errorResponse(404, 'NOT_FOUND', 'Return request not found or has been removed.');
    }

    const requestNotes = await db
      .select()
      .from(notes)
      .where(eq(notes.request_id, id))
      .orderBy(asc(notes.created_at));

    return NextResponse.json({ data: requestNotes });
  } catch (err) {
    return handleApiError(err);
  }
}

/**
 * POST /api/requests/[id]/notes
 * Appends a new timestamped note to a return request.
 *
 * Design decision:
 * Notes are strictly APPEND-ONLY. No PUT, PATCH, or DELETE route exists for notes anywhere in the API.
 * Notes can be added in any status (open, in_review, approved, completed, rejected)
 * as long as the request is not soft-deleted.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;

    const [parent] = await db
      .select({ id: requests.id, removed_at: requests.removed_at })
      .from(requests)
      .where(eq(requests.id, id))
      .limit(1);

    if (!parent || parent.removed_at !== null) {
      return errorResponse(404, 'NOT_FOUND', 'Return request not found or has been removed.');
    }

    const json = await req.json();
    const data = createNoteSchema.parse(json);

    const [newNote] = await db
      .insert(notes)
      .values({
        request_id: id,
        body: data.body,
      })
      .returning();

    return NextResponse.json({ data: newNote }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
