from collections.abc import AsyncIterator
from pathlib import Path
import os
import sys

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import database
from app import main

app = main.app


@pytest.fixture
async def client(monkeypatch) -> AsyncIterator[AsyncClient]:
    test_db_url = os.getenv("TEST_DATABASE_URL")
    if not test_db_url:
        pytest.skip("TEST_DATABASE_URL is required for backend tests.")

    test_database = database.Database(database.normalize_database_url(test_db_url))
    monkeypatch.setattr(database, "db", test_database)
    monkeypatch.setattr(main, "db", test_database)

    await test_database.init_models()
    async with test_database.engine.begin() as connection:
        await connection.execute(text("TRUNCATE TABLE expenses RESTART IDENTITY"))

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client

    await test_database.dispose()
