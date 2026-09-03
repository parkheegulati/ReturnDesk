import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  integer,
  numeric,
  timestamp,
  text,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';

// ─── Enums ────────────────────────────────────────────────────────────────────
// Defined as Postgres native enums so the DB itself rejects out-of-range values.

export const reasonEnum = pgEnum('return_reason', [
  'damaged',
  'wrong_item',
  'size_issue',
  'not_as_described',
  'changed_mind',
]);

export const statusEnum = pgEnum('request_status', [
  'open',
  'in_review',
  'approved',
  'completed',
  'rejected',
]);

export const resolutionEnum = pgEnum('request_resolution', [
  'refund',
  'replacement',
  'store_credit',
]);

// ─── requests ─────────────────────────────────────────────────────────────────

export const requests = pgTable(
  'requests',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Human-readable reference generated server-side from a DB sequence.
    // Format: RD-000001, RD-000002, … (zero-padded to 6 digits).
    // Using a sequence (not MAX+1) guarantees uniqueness under concurrent inserts.
    reference: varchar('reference', { length: 20 }).notNull().unique(),

    customer_name: varchar('customer_name', { length: 255 }).notNull(),
    customer_contact: varchar('customer_contact', { length: 255 }).notNull(),

    order_id: varchar('order_id', { length: 100 }).notNull(),
    item_name: varchar('item_name', { length: 255 }).notNull(),
    quantity: integer('quantity').notNull(),

    reason: reasonEnum('reason').notNull(),
    status: statusEnum('status').notNull().default('open'),
    resolution: resolutionEnum('resolution'),

    // Only populated when resolution = 'refund'. Must be > 0 in that case.
    refund_amount: numeric('refund_amount', { precision: 10, scale: 2 }),

    // Soft-delete: set to a timestamp to "take off the desk" without destroying
    // the record. Removed requests are excluded from list/detail GETs.
    removed_at: timestamp('removed_at', { withTimezone: true }),

    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    // Fast lookups by common filter fields
    index('idx_requests_status').on(table.status),
    index('idx_requests_reason').on(table.reason),
    index('idx_requests_order_id').on(table.order_id),
    index('idx_requests_customer_name').on(table.customer_name),

    // THE key constraint (Business Rule 3):
    // Only one live (non-removed, non-terminal) request per (order_id, item_name).
    // Implemented as a PARTIAL UNIQUE INDEX so the DB enforces it atomically —
    // an app-level check-then-insert would have a TOCTOU race under concurrency.
    // 'rejected' and 'completed' are excluded so you can re-open a request after
    // a prior one was closed.
    uniqueIndex('uq_live_request_per_item').on(table.order_id, table.item_name).where(
      sql`removed_at IS NULL AND status NOT IN ('rejected','completed')`
    ),
  ]
);

// ─── notes ────────────────────────────────────────────────────────────────────

export const notes = pgTable('notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  request_id: uuid('request_id')
    .notNull()
    .references(() => requests.id, { onDelete: 'cascade' }),
  body: text('body').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ─── Type helpers ─────────────────────────────────────────────────────────────

export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;

export type ReturnReason = (typeof reasonEnum.enumValues)[number];
export type RequestStatus = (typeof statusEnum.enumValues)[number];
export type RequestResolution = (typeof resolutionEnum.enumValues)[number];
