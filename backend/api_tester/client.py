from __future__ import annotations

import json
from dataclasses import dataclass
from typing import Any

from api_tester.catalog import AuthLevel, EndpointDef, format_path


@dataclass
class ApiResponse:
    status_code: int
    body: Any
    headers: dict[str, str]
    endpoint_id: str
    url: str

    @property
    def ok(self) -> bool:
        return 200 <= self.status_code < 300

    def json(self) -> Any:
        return self.body


class ApiClient:
    """Client HTTP unifié : TestClient (pytest) ou httpx (API live)."""

    def __init__(
        self,
        *,
        app: Any | None = None,
        base_url: str = "http://localhost:8000",
        timeout: float = 30.0,
    ) -> None:
        self._mode = "testclient" if app is not None else "httpx"
        self._tokens: dict[str, str] = {}

        if app is not None:
            from fastapi.testclient import TestClient

            self._client = TestClient(app)
        else:
            import httpx

            self._client = httpx.Client(base_url=base_url.rstrip("/"), timeout=timeout)

    def close(self) -> None:
        if self._mode == "httpx":
            self._client.close()

    def __enter__(self) -> ApiClient:
        return self

    def __exit__(self, *args: object) -> None:
        self.close()

    def set_token(self, role: str, token: str) -> None:
        self._tokens[role] = token

    def get_token(self, auth: AuthLevel) -> str | None:
        if auth == AuthLevel.NONE:
            return None
        if auth == AuthLevel.EDITOR:
            return self._tokens.get("editor") or self._tokens.get("admin") or self._tokens.get("bearer")
        return self._tokens.get("bearer") or self._tokens.get("user")

    def call(
        self,
        endpoint: EndpointDef,
        *,
        token: str | None = None,
        path_params: dict[str, Any] | None = None,
        body: dict[str, Any] | None = None,
        auth_override: AuthLevel | None = None,
    ) -> ApiResponse:
        auth = auth_override or endpoint.auth
        resolved_token = token if token is not None else self.get_token(auth)

        params = {**endpoint.path_params, **(path_params or {})}
        url = format_path(endpoint.path, params)
        payload = body if body is not None else endpoint.body

        headers: dict[str, str] = {}
        if auth != AuthLevel.NONE:
            if not resolved_token:
                headers = {}
            else:
                headers["Authorization"] = f"Bearer {resolved_token}"

        method = endpoint.method.upper()
        kwargs: dict[str, Any] = {"headers": headers}
        if payload is not None and method in {"POST", "PUT", "PATCH"}:
            kwargs["json"] = payload

        response = self._client.request(method, url, **kwargs)

        try:
            parsed_body: Any = response.json()
        except (json.JSONDecodeError, ValueError):
            parsed_body = response.text

        return ApiResponse(
            status_code=response.status_code,
            body=parsed_body,
            headers=dict(response.headers),
            endpoint_id=endpoint.id,
            url=url,
        )

    def call_unauthenticated(self, endpoint: EndpointDef, **kwargs: Any) -> ApiResponse:
        return self.call(endpoint, token="", auth_override=AuthLevel.BEARER, **kwargs)
