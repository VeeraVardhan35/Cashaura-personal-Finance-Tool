from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Header, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.schemas import ErrorResponse, ExpenseCreate, ExpenseListResponse, ExpenseResponse
from app.services.expense_service import create_expense, list_expenses

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.post(
    "",
    response_model=ExpenseResponse,
    responses={
        400: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
        422: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def create_expense_route(
    payload: ExpenseCreate,
    response: Response,
    session: Annotated[AsyncSession, Depends(get_session)],
    idempotency_key: Annotated[str | None, Header(alias="Idempotency-Key")] = None,
) -> ExpenseResponse:
    expense, response_status = await create_expense(session, payload, idempotency_key)
    response.status_code = response_status
    return expense


@router.get(
    "",
    response_model=ExpenseListResponse,
    responses={500: {"model": ErrorResponse}},
)
async def list_expenses_route(
    session: Annotated[AsyncSession, Depends(get_session)],
    category: Annotated[str | None, Query()] = None,
    sort: Annotated[Literal["date_desc", "date_asc"], Query()] = "date_desc",
) -> ExpenseListResponse:
    expenses, total = await list_expenses(session, category=category, sort=sort)
    return ExpenseListResponse(expenses=expenses, total=total)
