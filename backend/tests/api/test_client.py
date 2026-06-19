import pytest

from api_tester.catalog import ENDPOINTS, AuthLevel, get_endpoint
from api_tester.client import ApiClient
from api_tester.runner import run_smoke


def test_get_endpoint_unknown_raises():
    try:
        get_endpoint("nope")
    except KeyError as exc:
        assert "nope" in str(exc)
    else:
        raise AssertionError("KeyError attendue")


def test_client_root_health(api_client: ApiClient):
    endpoint = get_endpoint("root.health")
    response = api_client.call(endpoint)
    assert response.status_code == 200
    assert response.body["message"] == "API Cendres et Vapeur opérationnelle"


def test_client_getdata(api_client: ApiClient):
    endpoint = get_endpoint("root.getdata")
    response = api_client.call(endpoint, body={"content": "pytest"})
    assert response.status_code == 200
    assert response.body["content"] == "pytest"


def test_protected_route_requires_auth_when_implemented(
    api_client: ApiClient,
    api_implemented: bool,
):
    if not api_implemented:
        pytest.skip("Routes protégées encore en stub")
    endpoint = get_endpoint("carts.get")
    response = api_client.call_unauthenticated(endpoint)
    assert response.status_code in (401, 403)


def test_smoke_all_routes_in_process(api_client: ApiClient):
    """Smoke test : chaque route répond (pas de 404/405)."""
    public = [ep for ep in ENDPOINTS if ep.auth == AuthLevel.NONE]
    results = run_smoke(api_client, tuple(public), check_auth_guard=False)
    not_found = [r for r in results if r.response.status_code in (404, 405)]
    assert not not_found, f"Routes introuvables : {[r.endpoint.id for r in not_found]}"
