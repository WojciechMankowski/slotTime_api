
import os
import smtplib
from email.message import EmailMessage
from typing import List

EMAIL_HOST = os.getenv("EMAIL_HOST", "smtp.office365.com")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"

EMAIL_USER = os.getenv("EMAIL_USER")       # np. api-user@twojafirma.com
EMAIL_PASSWORD = os.getenv("EMAIL_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM")       # np. slot-notifications@twojafirma.com


def send_email_notification(subject: str, body: str, to_addrs: List[str]):
    """
    Prosta funkcja wysyłająca maila przez SMTP (Microsoft 365).
    Używana w tle (BackgroundTask) przy rezerwacji slotu.
    """
    if not EMAIL_USER or not EMAIL_PASSWORD or not EMAIL_FROM:
        # brak konfiguracji – nie rzucamy wyjątku, tylko logujemy
        print("Email not sent: missing EMAIL_USER / EMAIL_PASSWORD / EMAIL_FROM")
        return

    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = EMAIL_FROM
    msg["To"] = ", ".join(to_addrs)
    msg.set_content(body)

    with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
        if EMAIL_USE_TLS:
            server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        server.send_message(msg)
        print(f"Email sent to {to_addrs}")
