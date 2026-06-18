from __future__ import annotations

from typing import Callable

from api_tester.catalog import AuthLevel, get_endpoint
from api_tester.client import ApiClient


def login_with_2fa(
    client: ApiClient,
    email: str,
    password: str,
    *,
    code: str | None = None,
    code_fetcher: Callable[[], str] | None = None,
) -> str:
    """Flux login → verify-2fa ; retourne le access_token."""
    login = client.call(
        get_endpoint("auth.login"),
        body={"email": email, "password": password},
        auth_override=AuthLevel.NONE,
    )
    if login.status_code != 200:
        raise RuntimeError(f"Login échoué ({login.status_code}) : {login.body}")

    challenge_token = login.body["challenge_token"]
    resolved_code = code
    if resolved_code is None:
        if code_fetcher is None:
            raise RuntimeError("Code 2FA requis (paramètre code ou code_fetcher).")
        resolved_code = code_fetcher()

    verify = client.call(
        get_endpoint("auth.verify_2fa"),
        body={"challenge_token": challenge_token, "code": resolved_code},
        auth_override=AuthLevel.NONE,
    )
    if verify.status_code != 200:
        raise RuntimeError(f"2FA échoué ({verify.status_code}) : {verify.body}")

    return verify.body["access_token"]


def register_user(client: ApiClient, email: str, password: str = "secret1234") -> None:
    response = client.call(
        get_endpoint("auth.register"),
        body={"email": email, "password": password},
        auth_override=AuthLevel.NONE,
    )
    if response.status_code not in (201, 409):
        raise RuntimeError(f"Inscription échouée ({response.status_code}) : {response.body}")
