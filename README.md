# Cashaura

Production-style full-stack personal finance tracker built as a monorepo with:

- `backend`: FastAPI + SQLAlchemy async + PostgreSQL
- `frontend`: React 18 + TypeScript + Vite + TailwindCSS

## Setup

Run the app in three commands from the repository root:

```bash
cd backend && uv sync
cd ../frontend && npm install
cd .. && powershell -ExecutionPolicy Bypass -File .\dev.ps1
```

The frontend runs on `http://localhost:5173` and the backend runs on `http://127.0.0.1:8000`.

Before starting the backend, set `backend/.env` with your Neon or Postgres `DATABASE_URL`.

## Test

```bash
cd backend
uv run pytest
```

## Design Decisions

### Why Postgres

The app now uses Postgres end to end so local and production environments behave the same way. That removes the class of issues caused by SQLite filesystem behavior on serverless or free hosting platforms and matches how Neon and managed Postgres providers are typically used in deployment.

### Why DECIMAL instead of float

Financial values require exact arithmetic. `DECIMAL(12, 2)` avoids floating point rounding problems such as `0.1 + 0.2 !== 0.3`, which would be unacceptable for expense totals.

### Why idempotency

The `Idempotency-Key` header protects against retries, double-clicks, flaky networks, and browser re-submits. The server stores the key and returns the original expense for repeated identical submissions, while rejecting conflicting payloads with `409`.

### Why totals are computed server-side

The backend aggregates totals using decimal arithmetic and returns the formatted result as a string. That avoids client-side floating point bugs and ensures the UI never needs to sum money values itself.

## Trade-Offs Due To Timebox

- No authentication or per-user data isolation.
- No pagination, which is acceptable for a small personal-use list.
- No background jobs or rate limiting for operational hardening.

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
