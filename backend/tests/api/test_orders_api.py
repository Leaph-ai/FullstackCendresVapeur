import pytest

from api_tester.catalog import get_endpoint
from api_tester.client import ApiClient


@pytest.mark.parametrize(
    "endpoint_id",
    [
        "orders.create",
        "orders.list_by_user",
        "orders.get",
        "orders.delete",
    ],
)
def test_orders_routes_reachable(api_client: ApiClient, endpoint_id: str):
    """Inclut DELETE /orders/{id} (branche orders)."""
    endpoint = get_endpoint(endpoint_id)
    response = api_client.call_unauthenticated(endpoint)
    assert response.status_code not in (404, 405), endpoint_id


@pytest.mark.parametrize(
    "endpoint_id",
    ["orders.create", "orders.list_by_user", "orders.get", "orders.delete"],
)
def test_orders_routes_require_auth_when_implemented(
    api_client: ApiClient,
    api_implemented: bool,
    endpoint_id: str,
):
    if not api_implemented:
        pytest.skip("Routes orders encore en stub")
    endpoint = get_endpoint(endpoint_id)
    response = api_client.call_unauthenticated(endpoint)
    assert response.status_code in (401, 403), endpoint_id


def test_orders_user_route_path(api_client: ApiClient):
    """GET /orders/user/{id} ne doit pas être capturé par GET /orders/{order_id}."""
    endpoint = get_endpoint("orders.list_by_user")
    response = api_client.call_unauthenticated(endpoint, path_params={"user_id": 1})
    assert response.url == "/orders/user/1"
    assert response.status_code not in (404, 405)
