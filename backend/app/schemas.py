from datetime import date, datetime
from decimal import Decimal, ROUND_HALF_UP
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, field_validator


TWOPLACES = Decimal("0.01")


def normalize_amount(value: Decimal) -> Decimal:
    return value.quantize(TWOPLACES, rounding=ROUND_HALF_UP)


class ExpenseCreate(BaseModel):
    amount: Decimal = Field(..., max_digits=12, decimal_places=2)
    category: str = Field(..., max_length=100)
    description: str | None = Field(default=None)
    date: date

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, value: Decimal) -> Decimal:
        if value <= 0:
            raise ValueError("Amount must be greater than 0")
        return normalize_amount(value)

    @field_validator("category")
    @classmethod
    def validate_category(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("Category cannot be empty")
        return cleaned

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str | None) -> str | None:
        if value is None:
            return None
        cleaned = value.strip()
        return cleaned or None


class ExpenseResponse(BaseModel):
    id: str
    amount: str
    category: str
    description: str | None
    date: date
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("amount", mode="before")
    @classmethod
    def stringify_amount(cls, value: Any) -> str:
        return f"{Decimal(value).quantize(TWOPLACES):.2f}"


class ExpenseListResponse(BaseModel):
    expenses: list[ExpenseResponse]
    total: str


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorBody(BaseModel):
    code: str
    message: str
    details: list[ErrorDetail] | None = None


class ErrorResponse(BaseModel):
    error: ErrorBody
