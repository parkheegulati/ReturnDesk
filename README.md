# 📦 ReturnDesk 
**_Track and resolve customer returns in real time_**

It is a dedicated returns operations and lifecycle management desk engineered for e-commerce support teams. In modern online retail, the post-purchase return experience is one of the highest friction touchpoints between a business and its customers. Rather than relying on generic, lenient CRUD scaffolding, ReturnDesk is architected around **strict, server-enforced business domain rules**.

<img width="1130" height="746" alt="Screenshot 2026-09-04 at 12 36 46 AM" src="https://github.com/user-attachments/assets/9f46dd91-5775-4193-b58a-173d6f69f74e" />

---

- 🌐 **Live Deployed Application**: [https://return-desk-ebon.vercel.app](https://return-desk-ebon.vercel.app)
- 💻 **GitHub Repository**: [https://github.com/parkheegulati/ReturnDesk](https://github.com/parkheegulati/ReturnDesk)
- ⏱️ **Time Spent**: ~3 hours

---

## 🛠️ Technology Stack

| Layer | Technology | Decision Rationale |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), React, TypeScript | Fast server rendering, clean route conventions, strict TypeScript typing |
| **Styling** | Tailwind CSS | Semantic design tokens, flat minimal layout, responsive down to 375px, Light/Dark mode |
| **Backend** | Next.js Route Handlers (Node.js) | Co-located API endpoints, atomic SQL transactions, server-enforced business logic |
| **Database** | PostgreSQL (Neon Serverless) | Relational integrity, foreign keys, and partial unique indexes |
| **ORM / Query** | Drizzle ORM | Type-safe SQL builder with zero runtime bloat; all filtering/sorting happens in SQL |

---

## 🚀 Setup Steps 

### Prerequisites
- Node.js 18.17+ or 20+
- A PostgreSQL connection string (e.g., Neon, Supabase, or local Postgres)

### 1. Clone & Install
```bash
git clone https://github.com/parkheegulati/ReturnDesk.git
cd ReturnDesk
npm install
```

### 2. Environment Configuration
Copy the example environment file and add your PostgreSQL connection string:
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@YOUR_NEON_HOST/neondb?sslmode=require"
```

### 3. Database Migration & Seeding
Push the schema to PostgreSQL and seed at least 30 requests spread across all statuses and reasons:
```bash
# Push table schemas and partial unique indexes to PostgreSQL
npm run db:push

# Seed clean database with 35 realistic return requests and notes
npm run seed
```

### 4. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Automated Business Rule Test Suite
Runs automated HTTP assertions verifying all 5 business rules (success paths and refusal paths with 409 conflict checks):
```bash
npm run test:rules
```

---

## 🛡️ Business Rules: Server-Enforced Invariants

Every business rule is enforced on the server. If an agent or third-party client bypasses the UI and calls the API directly, the server strictly refuses non-conforming actions:

1. **Status Flow Lifecycle**:
   - Legal progression: `Open → In Review → Approved → Completed` (or `→ Rejected`).
   - `Completed` and `Rejected` are terminal. Any illegal jump (e.g., `Open` straight to `Completed`, or reopening a completed ticket) is refused with `409 Conflict` (`ILLEGAL_TRANSITION`).
2. **Approval Needs a Resolution**:
   - Moving to `Approved` requires a resolution (`Refund`, `Replacement`, or `Store Credit`).
   - If `Refund`, a `refund_amount > 0` is strictly required. Non-refund resolutions cannot record any refund amount.
   - Enforced atomically in a single PostgreSQL transaction (`APPROVAL_INCOMPLETE`).
3. **One Live Request per Item**:
   - A customer cannot have two active returns for the same item on the same order.
   - Guarded at the query level and backed by a PostgreSQL **partial unique index** (`WHERE removed_at IS NULL AND status NOT IN ('rejected', 'completed')`). Duplicates return `409 Conflict` (`DUPLICATE_LIVE_REQUEST`).
4. **Locked Once Decided**:
   - Once a request reaches `Approved`, `Rejected`, or `Completed`, customer and item details can no longer be edited (`RECORD_LOCKED`). Internal staff notes can still be appended at any stage.
5. **Soft Removal**:
   - Requests are never destroyed from the database. Only `Open` or `Rejected` requests can be removed (`CANNOT_REMOVE_REQUEST`).
   - Sets `removed_at = NOW()`; soft-removed requests disappear from list views and return `404 Not Found` if fetched directly.

---

## 📡 API Design & Error Refusal Protocol

All refusals return honest HTTP status codes and a consistent, machine-readable JSON error body:

```json
{
  "error": {
    "code": "ILLEGAL_TRANSITION",
    "message": "Cannot transition request from 'open' to 'completed'. Legal transitions are: in_review, rejected"
  }
}
```

| Verb | Endpoint | Purpose | Enforced Rules |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/requests` | List paged returns with server-side search & filtering | SQL-level `LIMIT`/`OFFSET`, `removed_at IS NULL` |
| `POST` | `/api/requests` | Raise a new return request | Enforces Rule 3 (active duplicate check) |
| `GET` | `/api/requests/:id` | Fetch return details & timeline notes | Returns `404 Not Found` if soft-deleted |
| `PATCH` | `/api/requests/:id` | Edit customer/item details | Enforces Rule 4 (`RECORD_LOCKED` on decided tickets) |
| `PATCH` | `/api/requests/:id/status` | Transition status & assign resolution | Enforces Rules 1 & 2 atomically |
| `POST` | `/api/requests/:id/notes` | Append internal staff note | Append-only; permitted in all states |
| `POST` | `/api/requests/:id/remove` | Soft-remove return from active desk | Enforces Rule 5 (`CANNOT_REMOVE_REQUEST`) |

---

## 📌 Assumptions Made

1. **Internal Single-Store Desk**: Designed as an internal operations tool for support agents without external multi-tenant complexity.
2. **Free-Text Item Names**: Items are referenced by their name/description from order invoices without an external product catalog service. A partial unique index prevents duplicate active claims on the same order.
3. **Currency Precision**: Refund amounts are stored using PostgreSQL `numeric(10, 2)` to eliminate floating-point rounding errors in commercial transactions.

---

## ⚖️ What Was Prioritized

1. **100% Server-Side Enforcement**: All 5 business rules validated in API route handlers and backed by 15 automated test assertions.
2. **Relational Data Model**: Real PostgreSQL foreign keys, sequences, transactions, and partial unique constraints.
3. **Server-Side Operations**: Search (`ILIKE`), status filters, reason filters, sorting, and pagination all offloaded to SQL.
4. **Accessible, Minimal UI**: Color-tinted queue scanning, dark/light mode toggle, debounced search, and responsive layout down to 375px.

---

## 🔮 What I Would Build Next (Given More Time)

1. **Customer Email / Webhook Notifications**: Automated email notifications to the customer when a return is approved or refund processed.
2. **Item Return Inspection Checklist**: A staging checklist for warehouse agents to log received condition before marking a return Completed.
3. **Multi-Item Batch Returns**: Allowing a customer to raise returns for multiple items from the same order in a single workflow.
4. **Audit Trail Log**: Tracking which agent changed which field, displayed as a timeline alongside staff notes.
