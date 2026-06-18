#!/usr/bin/env python3
"""CLI — tester toute l'API ou un sous-ensemble d'endpoints."""

from __future__ import annotations

import argparse
import os
import sys
from dataclasses import dataclass

from api_tester.auth_helper import login_with_2fa
from api_tester.catalog import ENDPOINTS, AuthLevel, EndpointDef, get_endpoint
from api_tester.client import ApiClient, ApiResponse


@dataclass
class RunResult:
    endpoint: EndpointDef
    response: ApiResponse
    passed: bool
    note: str


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Testeur d'API Cendres et Vapeur — smoke test de tous les endpoints.",
    )
    parser.add_argument(
        "--base-url",
        default=os.getenv("API_TEST_BASE_URL", "http://localhost:8000"),
        help="URL de l'API live (défaut: http://localhost:8000)",
    )
    parser.add_argument(
        "--in-process",
        action="store_true",
        help="Utiliser TestClient (app FastAPI en mémoire) au lieu d'HTTP",
    )
    parser.add_argument(
        "--endpoint",
        action="append",
        dest="endpoints",
        metavar="ID",
        help="Tester uniquement ces IDs (ex: orders.delete)",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="Lister les endpoints du catalogue et quitter",
    )
    parser.add_argument(
        "--user-email",
        default=os.getenv("API_TEST_USER_EMAIL", "admin@cendres.local"),
    )
    parser.add_argument(
        "--user-password",
        default=os.getenv("API_TEST_USER_PASSWORD", "changeme"),
    )
    parser.add_argument(
        "--user-token",
        default=os.getenv("API_TEST_USER_TOKEN"),
        help="JWT utilisateur (skip login si fourni)",
    )
    parser.add_argument(
        "--admin-token",
        default=os.getenv("API_TEST_ADMIN_TOKEN"),
        help="JWT éditeur/admin (skip login si fourni)",
    )
    parser.add_argument(
        "--2fa-code",
        dest="two_fa_code",
        default=os.getenv("API_TEST_2FA_CODE"),
        help="Code 2FA pour le login automatique",
    )
    parser.add_argument(
        "--check-auth-guard",
        action="store_true",
        help="Vérifier aussi que les routes protégées renvoient 401 sans token",
    )
    return parser.parse_args()


def _list_endpoints() -> None:
    print(f"{'ID':<22} {'METHOD':<7} {'AUTH':<8} PATH")
    print("-" * 72)
    for ep in ENDPOINTS:
        print(f"{ep.id:<22} {ep.method:<7} {ep.auth.value:<8} {ep.path}")


def _build_client(args: argparse.Namespace) -> ApiClient:
    if args.in_process:
        from app.main import app

        return ApiClient(app=app)
    return ApiClient(base_url=args.base_url)


def _setup_tokens(client: ApiClient, args: argparse.Namespace) -> None:
    if args.user_token:
        client.set_token("user", args.user_token)
        client.set_token("bearer", args.user_token)
    if args.admin_token:
        client.set_token("admin", args.admin_token)
        client.set_token("editor", args.admin_token)
        return
    if args.admin_token or args.user_token:
        return

    try:
        token = login_with_2fa(
            client,
            args.user_email,
            args.user_password,
            code=args.two_fa_code,
        )
        client.set_token("user", token)
        client.set_token("bearer", token)
        client.set_token("admin", token)
        client.set_token("editor", token)
    except Exception as exc:
        print(f"⚠ Login auto ignoré : {exc}", file=sys.stderr)


def _evaluate_smoke(endpoint: EndpointDef, response: ApiResponse) -> RunResult:
    passed = response.status_code in endpoint.smoke_statuses
    note = "OK" if passed else f"attendu {endpoint.smoke_statuses}, reçu {response.status_code}"
    return RunResult(endpoint, response, passed, note)


def _evaluate_auth_guard(endpoint: EndpointDef, response: ApiResponse) -> RunResult:
    passed = response.status_code in endpoint.unauthenticated_statuses
    note = "guard OK" if passed else f"sans token : attendu {endpoint.unauthenticated_statuses}, reçu {response.status_code}"
    return RunResult(endpoint, response, passed, note)


def run_smoke(client: ApiClient, endpoints: tuple[EndpointDef, ...], *, check_auth_guard: bool) -> list[RunResult]:
    results: list[RunResult] = []

    for endpoint in endpoints:
        response = client.call(endpoint)
        results.append(_evaluate_smoke(endpoint, response))

        if check_auth_guard and endpoint.auth != AuthLevel.NONE:
            guard_response = client.call_unauthenticated(endpoint)
            results.append(_evaluate_auth_guard(endpoint, guard_response))

    return results


def _print_results(results: list[RunResult]) -> int:
    passed = sum(1 for r in results if r.passed)
    failed = len(results) - passed

    print(f"\n{'ENDPOINT':<22} {'STATUS':<6} {'RESULT':<6} NOTE")
    print("-" * 80)
    for result in results:
        status = "PASS" if result.passed else "FAIL"
        print(
            f"{result.endpoint.id:<22} "
            f"{result.response.status_code:<6} "
            f"{status:<6} "
            f"{result.note}"
        )

    print(f"\n{passed} passés, {failed} échoués sur {len(results)} vérifications.")
    return 0 if failed == 0 else 1


def main() -> int:
    args = _parse_args()

    if args.list:
        _list_endpoints()
        return 0

    endpoints = ENDPOINTS
    if args.endpoints:
        endpoints = tuple(get_endpoint(eid) for eid in args.endpoints)

    with _build_client(args) as client:
        _setup_tokens(client, args)
        results = run_smoke(client, endpoints, check_auth_guard=args.check_auth_guard)

    return _print_results(results)


if __name__ == "__main__":
    raise SystemExit(main())
