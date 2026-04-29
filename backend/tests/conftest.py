from collections.abc import AsyncIterator
from pathlib import Path
import sys

import pytest
from httpx import ASGITransport, AsyncClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app import database
from app.main import app


@pytest.fixture
async def client(tmp_path, monkeypatch) -> AsyncIterator[AsyncClient]:
    test_db_url = f"sqlite+aiosqlite:///{tmp_path / 'test-expenses.db'}"
    test_database = database.Database(test_db_url)
    monkeypatch.setattr(database, "db", test_database)

    await test_database.init_models()

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as async_client:
        yield async_client

    await test_database.dispose()
