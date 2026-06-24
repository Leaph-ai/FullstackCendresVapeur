from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class CategoryBrief(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class ProductCreate(BaseModel):
    category_id: int
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    url: str | None = Field(default=None, max_length=2048)
    stock: int = Field(ge=0, default=0)
    price: Decimal = Field(gt=0, max_digits=10, decimal_places=2)


class ProductUpdate(BaseModel):
    category_id: int | None = None
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    url: str | None = Field(default=None, max_length=2048)
    stock: int | None = Field(default=None, ge=0)
    price: Decimal | None = Field(default=None, gt=0, max_digits=10, decimal_places=2)


class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    category_id: int
    name: str
    description: str | None
    url: str | None
    stock: int
    price: Decimal
    previous_price: Decimal | None
    likes_count: int
    created_at: datetime
    category: CategoryBrief | None = None
