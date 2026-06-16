from typing import Annotated, Callable

from fastapi import Depends, HTTPException, status

from app.auth.dependencies import get_current_user
from app.security.roles import RoleLevel

__all__ = ["RoleLevel", "require_role"]


def require_role(min_level: RoleLevel) -> Callable[..., dict]:

    def dependency(
        current_user: Annotated[dict, Depends(get_current_user)],
    ) -> dict:
        user_level = current_user.get("role_level", RoleLevel.GUEST)
        if user_level < min_level:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Niveau d'accès insuffisant pour cette ressource.",
            )
        return current_user

    return dependency