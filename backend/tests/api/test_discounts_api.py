import pytest

from api_tester.catalog import get_endpoint
from api_tester.client import ApiClient


@pytest.mark.parametrize(
    "endpoint_id",
    ["discounts.list", "discounts.get", "discounts.create"],
)
def test_discounts_routes_reachable(api_client: ApiClient, endpoint_id: str):
    endpoint = get_endpoint(endpoint_id)
    response = api_client.call_unauthenticated(endpoint)
    assert response.status_code not in (404, 405), endpoint_id


@pytest.mark.parametrize(
    "endpoint_id",
    ["discounts.list", "discounts.get", "discounts.create"],
)
def test_discounts_routes_require_auth_when_implemented(
    api_client: ApiClient,
    api_implemented: bool,
    endpoint_id: str,
):
    if not api_implemented:
        pytest.skip("Routes discounts encore en stub")
    endpoint = get_endpoint(endpoint_id)
    response = api_client.call_unauthenticated(endpoint)
    assert response.status_code in (401, 403), endpoint_id
