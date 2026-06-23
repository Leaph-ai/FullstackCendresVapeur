def test_admin_can_list_users(factory, as_user):
    role = factory.role(name="User")
    user = factory.user(role=role, username="citoyen", email="citoyen@example.com")
    admin = as_user(role_level=3, role="admin")

    resp = admin.get("/users/")

    assert resp.status_code == 200
    assert resp.json() == [
        {
            "id": user.id,
            "username": "citoyen",
            "email": "citoyen@example.com",
            "role_id": role.id,
            "created_at": user.created_at.isoformat(),
            "role": {"id": role.id, "name": "User"},
        }
    ]


def test_user_listing_requires_admin(factory, as_user):
    factory.user()
    client = as_user(role_level=1)

    resp = client.get("/users/")

    assert resp.status_code == 403
