import smtplib
from email.message import EmailMessage

from app.config import Settings


def send_email(settings: Settings, *, to: str, subject: str, body: str) -> None:
    if not settings.smtp_user or not settings.smtp_password:
        raise RuntimeError("SMTP_USER and SMTP_PASSWORD must be set")

    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = to
    message["Subject"] = subject
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=30) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(message)
