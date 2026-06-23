from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserRoleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    email: str
    role_id: int
    created_at: datetime
    role: UserRoleResponse | None = None
