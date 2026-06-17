import os

from fastapi import APIRouter, HTTPException
from mailtrap import Address, Mail, MailtrapClient
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/dev", tags=["Dev"])


class TestMailPayload(BaseModel):
    send_to: EmailStr
    subject: str
    body: str


def _resolve_inbox_id(token: str) -> str:
    inbox_id = os.getenv("MAILTRAP_INBOX_ID")
    if inbox_id:
        return inbox_id

    client = MailtrapClient(token=token)
    accounts = client.general_api.accounts.get_list()
    if not accounts:
        raise HTTPException(status_code=500, detail="No Mailtrap account found for this token")

    account_client = MailtrapClient(token=token, account_id=str(accounts[0].id))
    inboxes = account_client.testing_api.inboxes.get_list()
    if not inboxes:
        raise HTTPException(status_code=500, detail="No Mailtrap inbox found for this account")

    return str(inboxes[0].id)


def _get_mailtrap_client() -> MailtrapClient:
    token = os.getenv("MAILTRAP_API_TOKEN")
    if not token:
        raise HTTPException(status_code=500, detail="MAILTRAP_API_TOKEN is not set")

    use_sandbox = os.getenv("MAILTRAP_USE_SANDBOX", "true").lower() == "true"
    if use_sandbox:
        return MailtrapClient(token=token, sandbox=True, inbox_id=_resolve_inbox_id(token))

    return MailtrapClient(token=token)


@router.post("/test-email")
async def send_test_email(payload: TestMailPayload):
    from_email = os.getenv("SMTP_FROM", "noreply@zone-franche.local")

    mail = Mail(
        sender=Address(email=from_email),
        to=[Address(email=payload.send_to)],
        subject=payload.subject,
        text=payload.body,
    )
    try:
        client = _get_mailtrap_client()
        response = client.send(mail)
        if response.get("success"):
            return {"message": "Email sent successfully"}
        raise HTTPException(status_code=500, detail=str(response))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
