from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models  # noqa: F401 — enregistre tous les modèles sur Base.metadata
from app.auth.dependencies import get_current_user
from app.core.database import Base, get_db
from app.main import app
from models.category import Category
from models.product import Product
from models.role import Role
from models.user import User


@pytest.fixture
def db_session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(engine)
    TestingSession = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    session = TestingSession()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)


@pytest.fixture
def client(db_session):
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def as_user(client):
    def _login(user_id=1, role_level=1, email="citoyen@zone.local", role="user"):
        app.dependency_overrides[get_current_user] = lambda: {
            "id": user_id,
            "email": email,
            "role": role,
            "role_level": role_level,
        }
        return client

    return _login


@pytest.fixture
def factory(db_session):
    class Factory:
        def role(self, name=None):
            row = Role(name=name or f"role-{uuid4().hex[:8]}")
            db_session.add(row)
            db_session.commit()
            db_session.refresh(row)
            return row

        def user(self, role=None, username=None, email=None):
            role = role or self.role()
            name = username or f"user-{uuid4().hex[:8]}"
            row = User(
                username=name,
                email=email or f"{name}@zone.local",
                password_hash="x",
                role_id=role.id,
            )
            db_session.add(row)
            db_session.commit()
            db_session.refresh(row)
            return row

        def category(self, name=None):
            row = Category(name=name or f"cat-{uuid4().hex[:8]}")
            db_session.add(row)
            db_session.commit()
            db_session.refresh(row)
            return row

        def product(self, category=None, name="Engrenage", price="10.00", stock=5, url=None):
            category = category or self.category()
            row = Product(
                category_id=category.id,
                name=name,
                description=None,
                url=url,
                stock=stock,
                price=Decimal(price),
            )
            db_session.add(row)
            db_session.commit()
            db_session.refresh(row)
            return row

    return Factory()
