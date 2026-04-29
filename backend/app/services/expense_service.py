from decimal import Decimal

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Expense
from app.schemas import ExpenseCreate, ExpenseResponse


class AppError(Exception):
    def __init__(
        self,
        *,
        status_code: int,
        code: str,
        message: str,
        details: list[dict[str, str]] | None = None,
    ) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details
        super().__init__(message)


def serialize_expense(expense: Expense) -> ExpenseResponse:
    return ExpenseResponse.model_validate(expense)


def amounts_match(left: Decimal, right: Decimal) -> bool:
    return left.quantize(Decimal("0.01")) == right.quantize(Decimal("0.01"))


def same_payload(existing: Expense, payload: ExpenseCreate) -> bool:
    return (
        amounts_match(existing.amount, payload.amount)
        and existing.category == payload.category
        and (existing.description or None) == payload.description
        and existing.date == payload.date
    )


async def create_expense(
    session: AsyncSession,
    payload: ExpenseCreate,
    idempotency_key: str | None,
) -> tuple[ExpenseResponse, int]:
    if idempotency_key:
        existing = await session.scalar(
            select(Expense).where(Expense.idempotency_key == idempotency_key)
        )
        if existing is not None:
            if not same_payload(existing, payload):
                raise AppError(
                    status_code=409,
                    code="idempotency_conflict",
                    message="This idempotency key has already been used with a different expense payload.",
                )
            return serialize_expense(existing), 200

    expense = Expense(
        amount=payload.amount,
        category=payload.category,
        description=payload.description,
        date=payload.date,
        idempotency_key=idempotency_key,
    )
    session.add(expense)
    await session.commit()
    await session.refresh(expense)
    return serialize_expense(expense), 201


def list_expenses_query(category: str | None, sort: str) -> Select[tuple[Expense]]:
    statement = select(Expense)
    if category:
        statement = statement.where(Expense.category == category)

    if sort == "date_asc":
        return statement.order_by(Expense.date.asc(), Expense.created_at.asc())
    return statement.order_by(Expense.date.desc(), Expense.created_at.desc())


async def list_expenses(
    session: AsyncSession,
    *,
    category: str | None,
    sort: str,
) -> tuple[list[ExpenseResponse], str]:
    expenses = (
        await session.scalars(list_expenses_query(category=category, sort=sort))
    ).all()

    total_statement = select(func.coalesce(func.sum(Expense.amount), 0))
    if category:
        total_statement = total_statement.where(Expense.category == category)

    total = await session.scalar(total_statement)
    total_decimal = Decimal(total or 0).quantize(Decimal("0.01"))
    return [serialize_expense(expense) for expense in expenses], f"{total_decimal:.2f}"
