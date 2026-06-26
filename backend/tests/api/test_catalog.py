from api_tester.catalog import ENDPOINTS, format_path


def test_catalog_contains_all_documented_endpoints():
    ids = {ep.id for ep in ENDPOINTS}
    expected = {
        "root.health",
        "root.getdata",
        "auth.register",
        "auth.login",
        "auth.verify_2fa",
        "auth.logout",
        "products.list",
        "products.get",
        "products.create",
        "products.update",
        "products.delete",
        "carts.get",
        "carts.add_item",
        "carts.remove_item",
        "orders.create",
        "orders.list_by_user",
        "orders.get",
        "orders.delete",
        "discounts.list",
        "discounts.get",
        "discounts.create",
        "dev.test_email",
    }
    assert expected <= ids
    assert len(ENDPOINTS) == len(expected)


def test_format_path_replaces_placeholders():
    assert format_path("/orders/user/{user_id}", {"user_id": 42}) == "/orders/user/42"
    assert format_path("/discounts/{code}", {"code": "VAPEUR10"}) == "/discounts/VAPEUR10"
