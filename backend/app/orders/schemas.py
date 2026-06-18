from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class OrderCreate(BaseModel):
    discount_code: str | None = Field(default=None, min_length=1, max_length=64)


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    discount_code_id: int | None
    total_amount: Decimal
    status: str
    created_at: datetime
    items: list[OrderItemResponse] = []
