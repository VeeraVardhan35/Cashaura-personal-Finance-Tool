import os
from collections.abc import AsyncIterator
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

load_dotenv(Path(__file__).resolve().parents[1] / ".env")

Base = declarative_base()


class Database:
    def __init__(self, url: str) -> None:
        self.url = url
        self.engine = create_async_engine(
            url,
            future=True,
            pool_pre_ping=True,
        )
        self.session_factory = async_sessionmaker(
            self.engine,
            expire_on_commit=False,
            class_=AsyncSession,
        )

    async def init_models(self) -> None:
        async with self.engine.begin() as connection:
            await connection.run_sync(Base.metadata.create_all)

    async def dispose(self) -> None:
        await self.engine.dispose()


def normalize_database_url(url: str) -> str:
    normalized_url = url
    if url.startswith("postgresql+asyncpg://"):
        normalized_url = url
    elif url.startswith("postgresql://"):
        normalized_url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        normalized_url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    else:
        return url

    parts = urlsplit(normalized_url)
    query_params = parse_qsl(parts.query, keep_blank_values=True)
    rewritten_query_params: list[tuple[str, str]] = []

    for key, value in query_params:
        if key == "sslmode":
            rewritten_query_params.append(("ssl", value))
        elif key == "channel_binding":
            continue
        else:
            rewritten_query_params.append((key, value))

    return urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urlencode(rewritten_query_params), parts.fragment)
    )


def get_database_url() -> str:
    raw_url = os.getenv("DATABASE_URL")
    if not raw_url:
        raise RuntimeError(
            "DATABASE_URL is required. Set it in the environment or backend/.env."
        )
    return normalize_database_url(raw_url)


db = Database(get_database_url())


async def get_session() -> AsyncIterator[AsyncSession]:
    async with db.session_factory() as session:
        yield session
