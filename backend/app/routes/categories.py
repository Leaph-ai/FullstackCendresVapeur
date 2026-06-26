from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.categories.schemas import CategoryResponse
from app.categories.service import CategoryService
from app.core.database import get_db

router = APIRouter(
    prefix="/categories",
    tags=["Categories"],
)


def get_category_service(
    db: Annotated[Session, Depends(get_db)],
) -> CategoryService:
    return CategoryService(db)


@router.get("/", response_model=list[CategoryResponse])
def get_categories(
    service: Annotated[CategoryService, Depends(get_category_service)],
) -> list[CategoryResponse]:
    return service.list_categories()
