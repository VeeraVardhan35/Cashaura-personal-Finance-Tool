# Expense Tracker

Production-style full-stack expense tracker built as a monorepo with:

- `backend`: FastAPI + SQLAlchemy async + SQLite
- `frontend`: React 18 + TypeScript + Vite + TailwindCSS

## Setup

Run the app in three commands from the repository root:

```bash
cd backend && uv sync
cd ../frontend && npm install
cd .. && powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

The frontend runs on `http://localhost:5173` and the backend runs on `http://127.0.0.1:8000`.

## Test

```bash
cd backend
uv run pytest
```

## Design Decisions

### Why SQLite

SQLite is pragmatic for this scope: it is fast to set up, file-based, and keeps local development simple. The app uses SQLAlchemy async, so moving to Postgres is mostly a connection-string change plus production migration setup.

### Why DECIMAL instead of float

Financial values require exact arithmetic. `DECIMAL(12, 2)` avoids floating point rounding problems such as `0.1 + 0.2 !== 0.3`, which would be unacceptable for expense totals.

### Why idempotency

The `Idempotency-Key` header protects against retries, double-clicks, flaky networks, and browser re-submits. The server stores the key and returns the original expense for repeated identical submissions, while rejecting conflicting payloads with `409`.

### Why totals are computed server-side

The backend aggregates totals using decimal arithmetic and returns the formatted result as a string. That avoids client-side floating point bugs and ensures the UI never needs to sum money values itself.

## Trade-Offs Due To Timebox

- No authentication or per-user data isolation.
- No pagination, which is acceptable for a small personal-use list.
- SQLite is not appropriate for multi-instance deployment because concurrent writers are limited.

## Not Implemented Intentionally

- User accounts and authentication
- Pagination
- Edit and delete flows
- Full migration tooling with Alembic; `create_all` is used for simplicity

## API Summary

### `POST /expenses`

- Accepts `{ amount, category, description, date }`
- Optional `Idempotency-Key` header
- Returns `201` on create, `200` for a repeated identical key, `409` for key conflicts

### `GET /expenses`

- Optional `category` filter
- Optional `sort` query with `date_desc` or `date_asc`
- Returns `{ expenses, total }` with `total` pre-computed server-side

## Deployment Notes

- Backend: suitable for Railway or Render after setting `DATABASE_URL` and widening CORS for the deployed frontend origin.
- Frontend: suitable for Vercel or Netlify with `VITE_API_BASE_URL` pointed at the deployed API.
