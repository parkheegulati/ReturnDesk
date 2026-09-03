import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Creates a consistent JSON error response across all API routes.
 * Guaranteed format: { "error": { "code": "...", "message": "...", "details"?: ... } }
 */
export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
): NextResponse<ApiErrorBody> {
  const body: ApiErrorBody = {
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
  return NextResponse.json(body, { status });
}

/**
 * Handles caught errors in route handlers:
 * - Known ApiError -> respective status and code
 * - ZodError -> 400 VALIDATION_ERROR with structured field errors
 * - Postgres 23505 (Unique violation) -> 409 with specific message
 * - Fallback -> 500 INTERNAL_SERVER_ERROR
 */
export function handleApiError(err: unknown): NextResponse<ApiErrorBody> {
  if (err instanceof ApiError) {
    return errorResponse(err.statusCode, err.code, err.message, err.details);
  }

  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    return errorResponse(
      400,
      'VALIDATION_ERROR',
      'Validation failed for the request payload.',
      issues
    );
  }

  // Check for Postgres errors
  const pgErr = err as { code?: string; constraint?: string; message?: string };
  if (pgErr && pgErr.code === '23505') {
    if (pgErr.constraint === 'uq_live_request_per_item') {
      return errorResponse(
        409,
        'DUPLICATE_LIVE_REQUEST',
        'A live return request already exists for this item on this order. Only one active request is allowed at a time.'
      );
    }
    if (pgErr.constraint === 'requests_reference_unique') {
      return errorResponse(
        409,
        'REFERENCE_EXISTS',
        'A request with this reference number already exists.'
      );
    }
  }

  console.error('Unhandled server error:', err);
  return errorResponse(
    500,
    'INTERNAL_SERVER_ERROR',
    'An unexpected internal error occurred. Please try again later.'
  );
}
