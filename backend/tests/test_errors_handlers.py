import pytest
from fastapi import FastAPI, HTTPException
from fastapi.testclient import TestClient
from pydantic import BaseModel

from app.errors.exceptions import AppError
from app.errors.handlers import register_error_handlers


class Payload(BaseModel):
    qty: int


@pytest.fixture
def harness_client():
    app = FastAPI()
    register_error_handlers(app)

    @app.get("/raise-app-error")
    def _app_error():
        raise AppError("INSUFFICIENT_STOCK", "Stock insuffisant.", 400)

    @app.get("/raise-http")
    def _http():
        raise HTTPException(status_code=404, detail="Produit introuvable.")

    @app.post("/validate")
    def _validate(_: Payload):
        return {"ok": True}

    @app.get("/boom")
    def _boom():
        raise RuntimeError("secret internal detail")

    return TestClient(app, raise_server_exceptions=False)


def test_app_error_envelope(harness_client):
    resp = harness_client.get("/raise-app-error")
    assert resp.status_code == 400
    assert resp.json() == {
        "error": {"code": "INSUFFICIENT_STOCK", "message": "Stock insuffisant.", "status": 400}
    }


def test_http_exception_envelope_derives_code(harness_client):
    resp = harness_client.get("/raise-http")
    assert resp.status_code == 404
    body = resp.json()["error"]
    assert body == {"code": "NOT_FOUND", "message": "Produit introuvable.", "status": 404}


def test_validation_error_envelope_has_fields(harness_client):
    resp = harness_client.post("/validate", json={"qty": "not-an-int"})
    assert resp.status_code == 422
    body = resp.json()["error"]
    assert body["code"] == "VALIDATION_ERROR"
    assert body["status"] == 422
    assert any(f["field"] == "qty" for f in body["fields"])


def test_unhandled_exception_is_500_without_leak(harness_client):
    resp = harness_client.get("/boom")
    assert resp.status_code == 500
    body = resp.json()["error"]
    assert body == {
        "code": "INTERNAL_ERROR",
        "message": "Une erreur interne est survenue.",
        "status": 500,
    }
    assert "secret internal detail" not in resp.text
