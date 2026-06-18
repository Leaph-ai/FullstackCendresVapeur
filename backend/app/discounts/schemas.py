from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class DiscountCodeCreate(BaseModel):
    code: str = Field(min_length=1, max_length=64)
    percentage: Decimal = Field(gt=0, le=100, max_digits=5, decimal_places=2)
    active: bool = True


class DiscountCodeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    code: str
    percentage: Decimal
    active: bool
