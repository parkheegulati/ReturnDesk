import { z } from 'zod';

export const REASON_VALUES = [
  'damaged',
  'wrong_item',
  'size_issue',
  'not_as_described',
  'changed_mind',
] as const;

export const STATUS_VALUES = [
  'open',
  'in_review',
  'approved',
  'completed',
  'rejected',
] as const;

export const RESOLUTION_VALUES = ['refund', 'replacement', 'store_credit'] as const;

export const createRequestSchema = z
  .object({
    customer_name: z
      .string({ required_error: 'Customer name is required' })
      .trim()
      .min(1, 'Customer name cannot be empty')
      .max(255, 'Customer name cannot exceed 255 characters'),
    customer_contact: z
      .string({ required_error: 'Customer contact is required' })
      .trim()
      .min(1, 'Customer contact cannot be empty')
      .max(255, 'Customer contact cannot exceed 255 characters'),
    order_id: z
      .string({ required_error: 'Order ID is required' })
      .trim()
      .min(1, 'Order ID cannot be empty')
      .max(100, 'Order ID cannot exceed 100 characters'),
    item_name: z
      .string({ required_error: 'Item name is required' })
      .trim()
      .min(1, 'Item name cannot be empty')
      .max(255, 'Item name cannot exceed 255 characters'),
    quantity: z
      .number({ required_error: 'Quantity is required' })
      .int('Quantity must be an integer')
      .positive('Quantity must be at least 1'),
    reason: z.enum(REASON_VALUES, {
      required_error: 'Return reason is required',
      invalid_type_error: `Reason must be one of: ${REASON_VALUES.join(', ')}`,
    }),
  })
  .strict();

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

/**
 * General field edit schema (Rule 4 applies here: locked once approved/rejected/completed).
 * Strictly forbids lifecycle or identifier fields.
 */
export const updateRequestSchema = z
  .object({
    customer_name: z.string().trim().min(1).max(255).optional(),
    customer_contact: z.string().trim().min(1).max(255).optional(),
    order_id: z.string().trim().min(1).max(100).optional(),
    item_name: z.string().trim().min(1).max(255).optional(),
    quantity: z.number().int().positive().optional(),
    reason: z.enum(REASON_VALUES).optional(),
  })
  .strict({
    message:
      'Only customer_name, customer_contact, order_id, item_name, quantity, and reason may be modified here. Use /status to advance lifecycle.',
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided to update.'
  );

export type UpdateRequestInput = z.infer<typeof updateRequestSchema>;

/**
 * Atomic status transition schema (Rules 1 & 2).
 * Validates status change, resolution, and refund_amount in a single atomic parse.
 */
export const statusTransitionSchema = z
  .object({
    status: z.enum(STATUS_VALUES, {
      required_error: 'Target status is required',
      invalid_type_error: `Status must be one of: ${STATUS_VALUES.join(', ')}`,
    }),
    resolution: z.enum(RESOLUTION_VALUES).optional().nullable(),
    refund_amount: z
      .union([
        z.number().positive('Refund amount must be greater than 0'),
        z
          .string()
          .regex(/^\d+(\.\d{1,2})?$/, 'Refund amount must be a valid positive currency format')
          .transform((v) => parseFloat(v))
          .refine((v) => v > 0, 'Refund amount must be greater than 0'),
      ])
      .optional()
      .nullable(),
  })
  .strict({
    message:
      'Only status, resolution, and refund_amount are accepted on the status transition endpoint.',
  })
  .superRefine((data, ctx) => {
    // Rule 2: Moving to approved requires setting resolution atomically
    if (data.status === 'approved') {
      if (!data.resolution) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['resolution'],
          message:
            'A resolution (refund, replacement, or store_credit) is strictly required when approving a request.',
        });
      }

      if (data.resolution === 'refund') {
        if (data.refund_amount === undefined || data.refund_amount === null || data.refund_amount <= 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['refund_amount'],
            message:
              'A refund amount greater than 0 is required when resolution is set to "refund".',
          });
        }
      } else if (data.resolution && data.resolution !== 'refund') {
        if (data.refund_amount !== undefined && data.refund_amount !== null) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['refund_amount'],
            message:
              'Refund amount must be null or omitted when resolution is not "refund".',
          });
        }
      }
    } else {
      // If status is not approved, resolution and refund_amount should not be assigned
      if (data.resolution) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['resolution'],
          message: 'Resolution can only be set when status transitions to "approved".',
        });
      }
      if (data.refund_amount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['refund_amount'],
          message: 'Refund amount can only be set when status transitions to "approved".',
        });
      }
    }
  });

export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;

export const createNoteSchema = z
  .object({
    body: z
      .string({ required_error: 'Note body is required' })
      .trim()
      .min(1, 'Note cannot be empty')
      .max(5000, 'Note cannot exceed 5000 characters'),
  })
  .strict();

export type CreateNoteInput = z.infer<typeof createNoteSchema>;

export const listQuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(STATUS_VALUES).optional(),
  reason: z.enum(REASON_VALUES).optional(),
  sortBy: z
    .enum(['created_at', 'updated_at', 'reference', 'customer_name', 'order_id', 'status', 'reason'])
    .default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type ListQueryParams = z.infer<typeof listQuerySchema>;
