from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class LoginResponse(BaseModel):
    message: str
    requires_2fa: bool
    challenge_token: str | None = None
    access_token: str | None = None
    token_type: str = "bearer"


class Verify2FARequest(BaseModel):
    challenge_token: str
    code: str = Field(min_length=6, max_length=6, pattern=r"^\d{6}$")


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MessageResponse(BaseModel):
    message: str
