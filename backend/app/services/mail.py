from mailtrap import Address, Mail, MailtrapClient

from app.config import Settings


def _resolve_inbox_id(settings: Settings) -> str:
    if settings.mailtrap_inbox_id:
        return settings.mailtrap_inbox_id

    client = MailtrapClient(token=settings.mailtrap_api_token)
    accounts = client.general_api.accounts.get_list()
    if not accounts:
        raise RuntimeError("No Mailtrap account found for this token")

    account_client = MailtrapClient(
        token=settings.mailtrap_api_token,
        account_id=str(accounts[0].id),
    )
    inboxes = account_client.testing_api.inboxes.get_list()
    if not inboxes:
        raise RuntimeError("No Mailtrap inbox found for this account")

    return str(inboxes[0].id)


def get_mailtrap_client(settings: Settings) -> MailtrapClient:
    if not settings.mailtrap_api_token:
        raise RuntimeError("MAILTRAP_API_TOKEN is not set")

    if settings.mailtrap_use_sandbox:
        return MailtrapClient(
            token=settings.mailtrap_api_token,
            sandbox=True,
            inbox_id=_resolve_inbox_id(settings),
        )

    return MailtrapClient(token=settings.mailtrap_api_token)


def send_email(settings: Settings, *, to: str, subject: str, body: str) -> None:
    mail = Mail(
        sender=Address(email=settings.smtp_from),
        to=[Address(email=to)],
        subject=subject,
        text=body,
    )
    client = get_mailtrap_client(settings)
    response = client.send(mail)
    if not response.get("success"):
        raise RuntimeError(str(response))
