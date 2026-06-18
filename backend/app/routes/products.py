from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.core.database import get_db
from app.products.schemas import ProductCreate, ProductResponse, ProductUpdate
from app.products.service import ProductService

router = APIRouter(
    prefix="/products",
    tags=["Products"],
)

EDITOR_ROLE_LEVEL = 2


def get_product_service(
    db: Annotated[Session, Depends(get_db)],
) -> ProductService:
    return ProductService(db)


def require_editor(
    current_user: Annotated[dict, Depends(get_current_user)],
) -> dict:
    if current_user.get("role_level", 0) < EDITOR_ROLE_LEVEL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accès réservé aux éditeurs et administrateurs.",
        )
    return current_user


@router.get("/", response_model=list[ProductResponse])
def get_products(
    service: Annotated[ProductService, Depends(get_product_service)],
) -> list[ProductResponse]:
    return service.list_products()


@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    service: Annotated[ProductService, Depends(get_product_service)],
) -> ProductResponse:
    return service.get_product(product_id)


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    service: Annotated[ProductService, Depends(get_product_service)],
    _: Annotated[dict, Depends(require_editor)],
) -> ProductResponse:
    return service.create_product(payload)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    service: Annotated[ProductService, Depends(get_product_service)],
    _: Annotated[dict, Depends(require_editor)],
) -> ProductResponse:
    return service.update_product(product_id, payload)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    service: Annotated[ProductService, Depends(get_product_service)],
    _: Annotated[dict, Depends(require_editor)],
) -> None:
    service.delete_product(product_id, payload)
