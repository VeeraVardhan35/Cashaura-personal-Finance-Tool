# Cashaura

A minimal full-stack personal finance and expense tracking application built as part of the Fenmo SDE internship assignment.

**Live frontend**: [https://cashaura-personal-finance-tool.vercel.app/](https://cashaura-personal-finance-tool.vercel.app/)  
**Live backend**: [https://cashaura-personal-finance-tool.onrender.com](https://cashaura-personal-finance-tool.onrender.com)  
**API docs**: [https://cashaura-personal-finance-tool.onrender.com/docs](https://cashaura-personal-finance-tool.onrender.com/docs)  
**Repo**: [https://github.com/VeeraVardhan35/Cashaura-personal-Finance-Tool](https://github.com/VeeraVardhan35/Cashaura-personal-Finance-Tool)

---

## Quick Start

```bash
# Backend
cd backend
uv sync
uv run uvicorn app.main:app --reload

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`. API runs at `http://127.0.0.1:8000`.  
Backend docs are auto-generated at `http://127.0.0.1:8000/docs`.

Before starting the backend, set `backend/.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@host/database?ssl=require
CORS_ORIGINS=http://localhost:5173,https://cashaura-personal-finance-tool.vercel.app
```

For deployed frontend builds, set:

```env
VITE_API_BASE_URL=https://cashaura-personal-finance-tool.onrender.com
```

---

## Project Structure

```text
/backend
  /app
    main.py              # FastAPI app, CORS, startup
    models.py            # SQLAlchemy ORM models
    schemas.py           # Pydantic request/response validation
    database.py          # DB connection and session management
    /routes
      expenses.py        # Route handlers
    /services
      expense_service.py # Business logic (idempotency, totals)
  requirements.txt
  tests/
    test_expenses.py

/frontend
  /src
    /components
      ExpenseForm.tsx
      ExpenseList.tsx
      ExpenseFilter.tsx
      TotalBar.tsx
      CategorySummary.tsx
    /hooks
      useExpenses.ts
    /api
      expenses.ts
    /types
      index.ts
    App.tsx
  index.html
```

---

## API Routes

### Frontend

- `/` - main application view with form, totals, filters, summary, and expense cards

### Backend

- `GET /health` - health check
- `GET /docs` - Swagger API documentation
- `POST /expenses` - create an expense with optional idempotency protection
- `GET /expenses` - fetch expenses with optional filtering and sorting

---

## Design Decisions

### Why PostgreSQL

I chose PostgreSQL instead of SQLite for the final version so local and deployed environments behave the same way. This avoids filesystem and persistence issues on free hosting platforms and better matches how a production-ready backend should run. The code still stays simple because SQLAlchemy abstracts the database layer cleanly.

### Why SQLAlchemy Async ORM

The backend uses SQLAlchemy async ORM for model definition, connection handling, and query construction. That provides type-safe models, parameterized queries, and a clean async session layer without writing raw SQL everywhere. It also keeps the app portable if the database setup changes later.

### Money stored as DECIMAL(12, 2), never float

Floating point cannot represent most decimal fractions exactly. `0.1 + 0.2` in IEEE 754 gives `0.30000000000000004`. For financial data this is unacceptable. Using SQLAlchemy's `Numeric(precision=12, scale=2)` stores amounts as exact decimals. The API returns totals as a pre-formatted string such as `"1234.50"` so the frontend never performs float aggregation.

### Idempotency on `POST /expenses`

The assignment explicitly mentions unreliable networks, browser refreshes, and retries. Without idempotency, a user who clicks submit twice or whose browser retries a timed-out request would create duplicate expenses.

Implementation:

- the client generates a UUID v4 before submitting
- this key is sent as an `Idempotency-Key` header
- the server stores it alongside the created expense
- on a duplicate request with the same key and same payload, the original expense is returned with HTTP `200`
- on a duplicate request with the same key but different payload, the server returns HTTP `409 Conflict`
- the client generates a fresh key only after a confirmed successful submission

This means the backend does not create a new row every time. It creates only one row per successful logical submission.

### Server-side total computation

The `GET /expenses` response includes a `total` field computed on the backend. The frontend displays that value directly. This avoids JavaScript float rounding errors and keeps money math authoritative on the server.

### Validation on both layers

Client-side validation gives immediate feedback for amount, category, and date. Server-side validation through Pydantic re-validates every field independently because the frontend is not trusted. Validation failures return structured `400` responses with field-level detail.

---

## Real-World Reliability Handling

This app was designed assuming real-world conditions:

- unreliable networks
- slow or timed-out requests
- browser refreshes
- duplicate clicks
- retry behavior after uncertain submissions

### Frontend handling

- generates one idempotency key per form session
- reuses the same key on retries until success
- disables submit while a request is in flight
- stores draft form data, idempotency key, and pending submission state in browser storage
- restores draft state after refresh or tab reopen
- shows loading states, inline validation, retry-safe errors, and retry actions
- retries `GET /expenses` on transient failures

### Backend handling

- validates all incoming data again on the server
- rejects negative amounts and malformed payloads
- uses idempotency checks to prevent duplicate inserts
- computes totals server-side using exact numeric types
- returns structured errors for validation, malformed JSON, conflicts, and server failures

---

## Trade-Offs Due To The Timebox

- No authentication or user isolation
- No pagination, which is acceptable for a personal-use dataset
- No edit/delete flows, so the implementation focuses on create + read done well
- Uses `create_all()` on startup instead of a full migration system like Alembic
- No advanced observability such as metrics, tracing, or alerting

---

## What I Intentionally Did Not Build

- User accounts and authentication
- Multi-user access control
- Pagination
- Edit expense
- Delete expense
- Category management UI
- Full Alembic migration workflow
- CSV export
- Charts and analytics pages

These were omitted to keep the core flow correct and production-minded within the assignment timebox.

---

## What I Added Beyond Core

### Basic validation

Implemented on both client and server. Prevents negative amounts, enforces required fields, and returns structured field-level errors.

### Summary view

Added a category summary section showing total spend per category so users can quickly understand spending distribution.

### Automated tests

Added backend tests for:

- successful expense creation
- idempotent retry returning the same expense
- negative amount rejection
- category filtering
- total computation correctness

Run them with:

```bash
cd backend
uv run pytest
```

### Error and loading states

Implemented:

- loading state during expense fetch
- retry banner when fetch fails
- inline form validation messages
- disabled submit button during in-flight requests
- retry-safe messages for timeout/network failures

---

## Tech Choices Summary

| Layer | Choice | Why |
|---|---|---|
| Backend language | Python | Fastest way to write correct and readable API code |
| API framework | FastAPI | Auto-docs, validation, async support |
| ORM | SQLAlchemy Async ORM | Structured models, parameterized queries, DB portability |
| Database | PostgreSQL | Consistent local/production behavior, better deployment fit |
| Frontend | React + TypeScript + Vite | Fast iteration with compile-time safety |
| Styling | Tailwind + custom styles | Fast UI development with full control over look and layout |

---

## If I Had More Time

- Replace `create_all()` with Alembic migrations
- Add edit and delete flows
- Add authentication and per-user isolation
- Add monthly summary charts and trend views
- Add CSV export
- Add deeper backend observability and logging
