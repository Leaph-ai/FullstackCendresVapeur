from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr

from app.config import Settings, get_settings
from app.services.mail import send_email

router = APIRouter(prefix="/dev", tags=["Dev"])


class TestMailPayload(BaseModel):
    send_to: EmailStr
    subject: str
    body: str


@router.post("/test-email")
async def send_test_email(
    payload: TestMailPayload,
    settings: Annotated[Settings, Depends(get_settings)],
):
    try:
        send_email(
            settings,
            to=payload.send_to,
            subject=payload.subject,
            body=payload.body,
        )
        return {"message": "Email sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e
