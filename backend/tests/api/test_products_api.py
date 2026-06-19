import pytest

from api_tester.catalog import get_endpoint
from api_tester.client import ApiClient


@pytest.mark.parametrize(
    "endpoint_id",
    [
        "products.list",
        "products.get",
        "products.create",
        "products.update",
        "products.delete",
    ],
)
def test_products_routes_exist(api_client: ApiClient, endpoint_id: str):
    endpoint = get_endpoint(endpoint_id)
    if endpoint.auth.value == "none":
        response = api_client.call(endpoint)
    else:
        response = api_client.call_unauthenticated(endpoint)
    assert response.status_code not in (404, 405), endpoint_id
