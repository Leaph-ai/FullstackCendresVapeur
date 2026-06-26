import pytest

from api_tester.auth_helper import login_with_2fa, register_user
from api_tester.catalog import get_endpoint
from api_tester.client import ApiClient


@pytest.mark.integration
def test_auth_register_login_verify_logout_flow(
    api_client: ApiClient,
    mock_email: list[str],
    unique_email: str,
):
    register_user(api_client, unique_email, "secret1234")

    token = login_with_2fa(
        api_client,
        unique_email,
        "secret1234",
        code_fetcher=lambda: mock_email[-1],
    )
    api_client.set_token("bearer", token)

    logout = api_client.call(get_endpoint("auth.logout"), token=token)
    assert logout.status_code == 200
    assert "message" in logout.body

    revoked = api_client.call(get_endpoint("carts.get"), path_params={"user_id": 1}, token=token)
    assert revoked.status_code == 401
