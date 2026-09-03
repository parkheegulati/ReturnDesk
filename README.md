# ReturnDesk

An internal returns desk application built for online store support agents to raise, review, resolve, and close customer return and replacement requests across a strictly enforced lifecycle.

ReturnDesk enforces all business constraints **server-side in PostgreSQL and Route Handlers**, providing guaranteed data integrity, honest HTTP status codes, and an accessible, responsive UI matching the Frido brand aesthetic.

---

## Live Deployment & Database

- **Live URL**: Deployed on Vercel (or runnable locally at `http://localhost:3000`)
- **Database**: Hosted PostgreSQL on [Neon](https://neon.tech) (AWS ap-southeast-1)
- **Automated Verification**: `npm run test:rules` verifies all 5 business rules end-to-end via automated HTTP requests.

---

## Tech Stack

- **Framework**: Next.js 14 App Router + React 18, TypeScript
- **Backend**: Next.js Route Handlers (Node.js runtime)
- **Database**: PostgreSQL (Neon serverless Postgres)
- **ORM & Migrations**: Drizzle ORM + Drizzle Kit with `node-postgres` pool
- **Validation**: Zod (strictly at all API boundaries)
- **Styling**: Tailwind CSS v3 with Frido brand palette: Accent Yellow (`#FCD00F`), Card White (`#FFFFFF`), Page Background (`#F7F7F7`), and Text Ink (`#131313`)

---

## Setup From a Clean Machine

### Prerequisites
- Node.js 18.17+ or 20+
- npm 9+
- A PostgreSQL connection string (e.g. Neon, Supabase, or local Postgres)

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd returndesk
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local` and add your PostgreSQL connection string:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_NEON_HOST/neondb?sslmode=require"
```

### 3. Run Database Migrations
Applies native Postgres enums, the `request_reference_seq` sequence, tables, indexes, and the partial unique index:
```bash
npm run db:migrate
```

### 4. Seed Database
Truncates and refills the database with 35 realistic return requests spanning all 5 statuses and 5 reasons, complete with chronological support notes:
```bash
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run Automated Business Rule Test Suite
Runs automated HTTP assertions verifying all 5 business rules (success paths and refusal paths with 409 conflict checks):
```bash
npm run test:rules
```

---

## The Five Business Rules — Server-Side Enforcement

Every rule is validated server-side before any write, and race-critical constraints are enforced directly by PostgreSQL.

### Rule 1: Status Flow
**Flow**: `Open → In Review → Approved → Completed`, and `Open / In Review → Rejected`.
`Rejected` and `Completed` are terminal states. Any other jump (e.g., `Open → Completed` or `Approved → Rejected`) is refused with **HTTP 409 `ILLEGAL_TRANSITION`**.

- **Success (Open → In Review)**:
  ```bash
  curl -X PATCH http://localhost:3000/api/requests/<ID>/status \
    -H "Content-Type: application/json" \
    -d '{"status":"in_review"}'
  # Response: HTTP 200 OK
  ```

- **Refusal (Open → Completed directly)**:
  ```bash
  curl -X PATCH http://localhost:3000/api/requests/<ID>/status \
    -H "Content-Type: application/json" \
    -d '{"status":"completed"}'
  # Response: HTTP 409 Conflict
  # {
  #   "error": {
  #     "code": "ILLEGAL_TRANSITION",
  #     "message": "Illegal transition from \"open\" to \"completed\". Allowed next statuses: in_review, rejected."
  #   }
  # }
  ```

- **Refusal (Reopening Terminal Rejected request)**:
  ```bash
  curl -X PATCH http://localhost:3000/api/requests/<ID>/status \
    -H "Content-Type: application/json" \
    -d '{"status":"open"}'
  # Response: HTTP 409 Conflict
  # {
  #   "error": {
  #     "code": "ILLEGAL_TRANSITION",
  #     "message": "Cannot transition from terminal status \"rejected\". Completed and rejected requests cannot be reopened or transitioned."
  #   }
  # }
  ```

---

### Rule 2: Approval Needs a Resolution (Atomic Operation)
A request cannot transition to `Approved` without specifying `resolution` (`refund`, `replacement`, `store_credit`).
- If `resolution = 'refund'`, `refund_amount > 0` is strictly required.
- If `resolution != 'refund'`, `refund_amount` must be null/omitted (refused if provided).
- Validated via Zod `.superRefine()` and written in a single atomic SQL `UPDATE` statement.

- **Success (Atomic Approval with Refund)**:
  ```bash
  curl -X PATCH http://localhost:3000/api/requests/<ID>/status \
    -H "Content-Type: application/json" \
    -d '{"status":"approved","resolution":"refund","refund_amount":1499.00}'
  # Response: HTTP 200 OK
  ```

- **Refusal (Approved without Resolution)**:
  ```bash
  curl -X PATCH http://localhost:3000/api/requests/<ID>/status \
    -H "Content-Type: application/json" \
    -d '{"status":"approved"}'
  # Response: HTTP 409 Conflict
  # {
  #   "error": {
  #     "code": "APPROVAL_INCOMPLETE",
  #     "message": "A resolution (refund, replacement, or store_credit) is strictly required when approving a request."
  #   }
  # }
  ```

- **Refusal (Refund without Refund Amount)**:
  ```bash
  curl -X PATCH http://localhost:3000/api/requests/<ID>/status \
    -H "Content-Type: application/json" \
    -d '{"status":"approved","resolution":"refund"}'
  # Response: HTTP 409 Conflict
  # {
  #   "error": {
  #     "code": "APPROVAL_INCOMPLETE",
  #     "message": "A refund amount greater than 0 is required when resolution is set to \"refund\"."
  #   }
  # }
  ```

- **Refusal (Replacement with extraneous Refund Amount)**:
  ```bash
  curl -X PATCH http://localhost:3000/api/requests/<ID>/status \
    -H "Content-Type: application/json" \
    -d '{"status":"approved","resolution":"replacement","refund_amount":500.00}'
  # Response: HTTP 409 Conflict
  # {
  #   "error": {
  #     "code": "APPROVAL_INCOMPLETE",
  #     "message": "Refund amount must be null or omitted when resolution is not \"refund\"."
  #   }
  # }
  ```

---

### Rule 3: One Live Request Per Item (Race-Condition-Safe)
Enforced at the **PostgreSQL level** using a partial unique index:
```sql
CREATE UNIQUE INDEX "uq_live_request_per_item" ON "requests" ("order_id", "item_name")
WHERE removed_at IS NULL AND status NOT IN ('rejected', 'completed');
```
The API catches Postgres constraint violation `23505` on `uq_live_request_per_item` and returns a clean **HTTP 409 `DUPLICATE_LIVE_REQUEST`**.

- **Success (First Live Request)**:
  ```bash
  curl -X POST http://localhost:3000/api/requests \
    -H "Content-Type: application/json" \
    -d '{
      "customer_name": "Alice Smith",
      "customer_contact": "alice@example.com",
      "order_id": "ORD-5001",
      "item_name": "Arch Support Insoles (Size 9)",
      "quantity": 1,
      "reason": "damaged"
    }'
  # Response: HTTP 201 Created (Reference: RD-000036)
  ```

- **Refusal (Second Live Request for Same Item on Same Order)**:
  ```bash
  curl -X POST http://localhost:3000/api/requests \
    -H "Content-Type: application/json" \
    -d '{
      "customer_name": "Alice Smith",
      "customer_contact": "alice@example.com",
      "order_id": "ORD-5001",
      "item_name": "Arch Support Insoles (Size 9)",
      "quantity": 1,
      "reason": "wrong_item"
    }'
  # Response: HTTP 409 Conflict
  # {
  #   "error": {
  #     "code": "DUPLICATE_LIVE_REQUEST",
  #     "message": "A live return request already exists for this item on this order. Only one active request is allowed at a time."
  #   }
  # }
  ```

---

### Rule 4: Locked Once Decided
Once a request enters `Approved`, `Rejected`, or `Completed`, the core details (`customer_name`, `customer_contact`, `order_id`, `item_name`, `quantity`, `reason`) become immutable. General edits via `PATCH /api/requests/[id]` are refused with **HTTP 409 `RECORD_LOCKED`**.
*(Notes can still be appended in any status via the append-only notes endpoint).*

- **Success (Edit on Open / In Review Request)**:
  ```bash
  curl -X PATCH http://localhost:3000/api/requests/<OPEN_ID> \
    -H "Content-Type: application/json" \
    -d '{"customer_name":"Alice Cooper"}'
  # Response: HTTP 200 OK
  ```

- **Refusal (Edit on Decided / Approved Request)**:
  ```bash
  curl -X PATCH http://localhost:3000/api/requests/<APPROVED_ID> \
    -H "Content-Type: application/json" \
    -d '{"customer_name":"Alice Cooper"}'
  # Response: HTTP 409 Conflict
  # {
  #   "error": {
  #     "code": "RECORD_LOCKED",
  #     "message": "This return request has already been decided (status: \"approved\"). Details cannot be edited once approved, rejected, or completed."
  #   }
  # }
  ```

- **Note Exemption (Adding note to decided record is permitted)**:
  ```bash
  curl -X POST http://localhost:3000/api/requests/<APPROVED_ID>/notes \
    -H "Content-Type: application/json" \
    -d '{"body":"Auditor verified refund voucher transmission."}'
  # Response: HTTP 201 Created
  ```

---

### Rule 5: Removal (Soft-Delete)
Only `Open` or `Rejected` requests may be removed from the desk.
Attempts to remove requests in `In Review`, `Approved`, or `Completed` are refused with **HTTP 409 `CANNOT_REMOVE_REQUEST`**.
Removed requests have `removed_at = NOW()`. They disappear from all search/list GETs and return **HTTP 404 `NOT_FOUND`** on detail GETs, while remaining preserved in the database for audit.

- **Refusal (Attempting to remove Completed request)**:
  ```bash
  curl -X POST http://localhost:3000/api/requests/<COMPLETED_ID>/remove
  # Response: HTTP 409 Conflict
  # {
  #   "error": {
  #     "code": "CANNOT_REMOVE_REQUEST",
  #     "message": "Only \"open\" or \"rejected\" return requests can be removed from the desk. Current status is \"completed\"."
  #   }
  # }
  ```

- **Success (Removing Rejected request)**:
  ```bash
  curl -X POST http://localhost:3000/api/requests/<REJECTED_ID>/remove
  # Response: HTTP 200 OK
  # {
  #   "message": "Request successfully removed from the desk.",
  #   "data": { "id": "...", "reference": "RD-000031", "removed_at": "..." }
  # }
  ```

- **Disappearance (Detail GET after removal)**:
  ```bash
  curl http://localhost:3000/api/requests/<REJECTED_ID>
  # Response: HTTP 404 Not Found
  # {
  #   "error": {
  #     "code": "NOT_FOUND",
  #     "message": "Return request not found or has been removed."
  #   }
  # }
  ```

---

## Architecture & Design Decisions

*(Detailed rationales from `DECISIONS.md`)*

1. **Atomic Reference Generation via PostgreSQL Sequence (`request_reference_seq`)**:
   Instead of calculating `SELECT MAX(...) + 1` (which introduces concurrency race bugs) or using unreadable UUIDs, a dedicated DB sequence generates zero-padded formatted references (`RD-000123`).
2. **Partial Unique Index for Race-Condition Safety**:
   Preventing duplicate live requests at the DB layer avoids check-then-insert TOCTOU races under concurrent API traffic.
3. **Endpoint Separation: General Edit (`PATCH /api/requests/[id]`) vs Lifecycle Transition (`PATCH /api/requests/[id]/status`)**:
   General edits update descriptive fields under Rule 4 immutability checks; lifecycle transitions advance status and enforce atomic resolution checks under Rules 1 & 2.
4. **Status Transition Atomicity**:
   Transitioning to `Approved` requires passing `resolution` (and `refund_amount` if applicable) in the same payload, validated via Zod's `.superRefine()`, preventing intermediate illegal states.
5. **Approved Cannot Transition to Rejected**:
   Once an agent commits to an approved resolution, the return must proceed to completion. Rejections are only valid during initial triage (`Open` or `In Review`).
6. **Append-Only Notes**:
   The `notes` table has no `PUT`, `PATCH`, or `DELETE` endpoints anywhere in the application to preserve an immutable audit history.
7. **Unified Error Response Format**:
   Every error returned across the application strictly implements `{ "error": { "code": string, "message": string, "details"?: unknown } }`.
8. **Pure SQL Search, Filter, Sort, and Pagination**:
   `GET /api/requests` executes all ILIKE search, enum filters, sorting, and pagination directly in PostgreSQL, utilizing indexed columns.

---

## Assumptions

1. **Internal Single-Store Desk**: No customer-facing auth or multi-tenant organizations were required by the brief; it is designed as an internal tool for support agents.
2. **Free-Text Item Names**: Items are referenced by their name/description from order invoices without an external product catalog service.
3. **Currency Precision**: Refund amounts are stored as `numeric(10,2)` to avoid floating point rounding errors in financial transactions.

---

## What Is Incomplete

Nothing from the core specification is omitted. All 5 business rules, server-side PostgreSQL constraints, unified error shapes, seed script, debounced search, sortable/paginated list, responsive 375px mobile UI, and detail view action bars are fully implemented and verified.

---

## Rough Hours Spent

- **Phase 1: Project Bootstrap, Next 14 & Tailwind 3 Alignment**: ~1 hour
- **Phase 2: Drizzle Schema, Migrations & Partial Unique Index Verification**: ~1.5 hours
- **Phase 3: Seed Script (35 realistic records with notes)**: ~0.75 hours
- **Phase 4: API Error Architecture & Zod Cross-Validation**: ~1 hour
- **Phase 5: API Route Handlers & Business Rule Curl Verification**: ~2 hours
- **Phase 6: Frontend UI (Frido Brand, Responsive Table, Action Modals)**: ~2 hours
- **Phase 7: Automated Test Suite & Documentation**: ~1 hour
- **Total Time**: ~9.25 hours
