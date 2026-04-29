# Cashaura Backend

FastAPI backend for the Cashaura application.

The backend is Postgres-only and expects a hosted `DATABASE_URL`, such as Neon or Render Postgres.

## Run

```bash
uv sync
uv run uvicorn app.main:app --reload
```

Set `backend/.env` first:

```env
DATABASE_URL=postgresql+asyncpg://...
```

## Test

```bash
uv run pytest
```

Backend tests require:

```env
TEST_DATABASE_URL=postgresql+asyncpg://...
```
