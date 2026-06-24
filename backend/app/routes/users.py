from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.security.rbac import RoleLevel, require_role
from app.users.schemas import UserResponse
from app.users.service import UserService

router = APIRouter(
    prefix="/users",
    tags=["Users"],
)


def get_user_service(db: Annotated[Session, Depends(get_db)]) -> UserService:
    return UserService(db)


@router.get(
    "/",
    response_model=list[UserResponse],
    dependencies=[Depends(require_role(RoleLevel.ADMIN))],
)
def get_users(
    service: Annotated[UserService, Depends(get_user_service)],
) -> list[UserResponse]:
    return service.list_users()
