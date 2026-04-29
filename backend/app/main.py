import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.database import db
from app.routes.expenses import router as expenses_router
from app.services.expense_service import AppError


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS")
    if raw_origins:
        return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return ["http://localhost:5173"]


def error_response(
    *,
    status_code: int,
    code: str,
    message: str,
    details: list[dict[str, str]] | None = None,
) -> JSONResponse:
    return JSONResponse(
        status_code=status_code,
        content={
            "error": {
                "code": code,
                "message": message,
                "details": details,
            }
        },
    )


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await db.init_models()
    yield
    await db.dispose()


app = FastAPI(title="Cashaura API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(expenses_router)


@app.get("/health")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.exception_handler(AppError)
async def app_error_handler(_: Request, exc: AppError) -> JSONResponse:
    return error_response(
        status_code=exc.status_code,
        code=exc.code,
        message=exc.message,
        details=exc.details,
    )


@app.exception_handler(RequestValidationError)
async def request_validation_error_handler(
    _: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = exc.errors()
    has_json_error = any(error["type"] == "json_invalid" for error in errors)
    if has_json_error:
        return error_response(
            status_code=422,
            code="malformed_request",
            message="Malformed request body.",
        )

    details = []
    for error in errors:
        location = [
            str(part)
            for part in error["loc"]
            if part not in {"body", "query", "header"}
        ]
        details.append(
            {
                "field": ".".join(location) if location else None,
                "message": error["msg"],
            }
        )

    return error_response(
        status_code=400,
        code="validation_error",
        message="Request validation failed.",
        details=details,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, __: Exception) -> JSONResponse:
    return error_response(
        status_code=500,
        code="internal_server_error",
        message="An unexpected error occurred.",
    )
