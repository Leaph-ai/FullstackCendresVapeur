from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class AuthLevel(str, Enum):
    NONE = "none"
    BEARER = "bearer"
    EDITOR = "editor"


@dataclass(frozen=True)
class EndpointDef:
    """Définition d'un endpoint de l'API (source de vérité pour les tests)."""

    id: str
    method: str
    path: str
    auth: AuthLevel
    description: str
    body: dict[str, Any] | None = None
    path_params: dict[str, Any] = field(default_factory=dict)
    # Statuts acceptables en smoke test (route joignable / comportement nominal)
    smoke_statuses: tuple[int, ...] = (200, 201, 204)
    # Sans token : 401 attendu pour les routes protégées
    unauthenticated_statuses: tuple[int, ...] = (401, 403)


# Catalogue complet — aligné sur l'historique du projet (branches products, carts,
# orders avec DELETE, discounts, auth, racine, dev).
ENDPOINTS: tuple[EndpointDef, ...] = (
    # --- Racine ---
    EndpointDef(
        id="root.health",
        method="GET",
        path="/",
        auth=AuthLevel.NONE,
        description="Santé de l'API",
    ),
    EndpointDef(
        id="root.getdata",
        method="POST",
        path="/getdata",
        auth=AuthLevel.NONE,
        description="Endpoint de test d'écriture fichier",
        body={"content": "api-tester smoke"},
    ),
    # --- Auth ---
    EndpointDef(
        id="auth.register",
        method="POST",
        path="/auth/register",
        auth=AuthLevel.NONE,
        description="Inscription utilisateur",
        body={"email": "tester@example.com", "password": "secret1234"},
        smoke_statuses=(201, 409),
    ),
    EndpointDef(
        id="auth.login",
        method="POST",
        path="/auth/login",
        auth=AuthLevel.NONE,
        description="Connexion (envoi code 2FA)",
        body={"email": "admin@example.com", "password": "Admin123!"},
        smoke_statuses=(200, 401, 500),
    ),
    EndpointDef(
        id="auth.verify_2fa",
        method="POST",
        path="/auth/verify-2fa",
        auth=AuthLevel.NONE,
        description="Validation du code 2FA",
        body={"challenge_token": "invalid", "code": "000000"},
        smoke_statuses=(200, 401),
    ),
    # --- Produits ---
    EndpointDef(
        id="products.list",
        method="GET",
        path="/products/",
        auth=AuthLevel.NONE,
        description="Liste des produits",
    ),
    EndpointDef(
        id="products.get",
        method="GET",
        path="/products/{product_id}",
        auth=AuthLevel.NONE,
        description="Détail d'un produit",
        path_params={"product_id": 1},
        smoke_statuses=(200, 404),
    ),
    EndpointDef(
        id="products.create",
        method="POST",
        path="/products/",
        auth=AuthLevel.EDITOR,
        description="Création d'un produit",
        body={
            "category_id": 1,
            "name": "Produit testeur API",
            "description": "Créé par api_tester",
            "stock": 5,
            "price": "19.99",
        },
        smoke_statuses=(201, 403, 404, 409),
    ),
    EndpointDef(
        id="products.update",
        method="PUT",
        path="/products/{product_id}",
        auth=AuthLevel.EDITOR,
        description="Mise à jour d'un produit",
        path_params={"product_id": 1},
        body={"stock": 10},
        smoke_statuses=(200, 403, 404),
    ),
    EndpointDef(
        id="products.delete",
        method="DELETE",
        path="/products/{product_id}",
        auth=AuthLevel.EDITOR,
        description="Suppression d'un produit",
        path_params={"product_id": 99999},
        smoke_statuses=(204, 403, 404, 409),
    ),
    # --- Paniers ---
    EndpointDef(
        id="carts.get",
        method="GET",
        path="/carts/{user_id}",
        auth=AuthLevel.BEARER,
        description="Consulter le panier d'un utilisateur",
        path_params={"user_id": 1},
        smoke_statuses=(200, 403, 404),
    ),
    EndpointDef(
        id="carts.add_item",
        method="POST",
        path="/carts/{user_id}/items",
        auth=AuthLevel.BEARER,
        description="Ajouter un article au panier",
        path_params={"user_id": 1},
        body={"product_id": 1, "quantity": 1},
        smoke_statuses=(201, 400, 403, 404),
    ),
    EndpointDef(
        id="carts.remove_item",
        method="DELETE",
        path="/carts/{user_id}/items/{item_id}",
        auth=AuthLevel.BEARER,
        description="Retirer un article du panier",
        path_params={"user_id": 1, "item_id": 1},
        smoke_statuses=(200, 403, 404),
    ),
    # --- Commandes ---
    EndpointDef(
        id="orders.create",
        method="POST",
        path="/orders/",
        auth=AuthLevel.BEARER,
        description="Créer une commande depuis le panier",
        body={"discount_code": "VAPEUR10"},
        smoke_statuses=(201, 400, 404),
    ),
    EndpointDef(
        id="orders.list_by_user",
        method="GET",
        path="/orders/user/{user_id}",
        auth=AuthLevel.BEARER,
        description="Lister les commandes d'un utilisateur",
        path_params={"user_id": 1},
        smoke_statuses=(200, 403),
    ),
    EndpointDef(
        id="orders.get",
        method="GET",
        path="/orders/{order_id}",
        auth=AuthLevel.BEARER,
        description="Détail d'une commande",
        path_params={"order_id": 1},
        smoke_statuses=(200, 403, 404),
    ),
    EndpointDef(
        id="orders.delete",
        method="DELETE",
        path="/orders/{order_id}",
        auth=AuthLevel.EDITOR,
        description="Supprimer une commande (restaure le stock)",
        path_params={"order_id": 99999},
        smoke_statuses=(204, 403, 404),
    ),
    # --- Codes promo ---
    EndpointDef(
        id="discounts.list",
        method="GET",
        path="/discounts/",
        auth=AuthLevel.EDITOR,
        description="Lister les codes de réduction",
        smoke_statuses=(200, 403),
    ),
    EndpointDef(
        id="discounts.get",
        method="GET",
        path="/discounts/{code}",
        auth=AuthLevel.BEARER,
        description="Consulter un code de réduction",
        path_params={"code": "VAPEUR10"},
        smoke_statuses=(200, 404),
    ),
    EndpointDef(
        id="discounts.create",
        method="POST",
        path="/discounts/",
        auth=AuthLevel.EDITOR,
        description="Créer un code de réduction",
        body={"code": "TESTAPI", "percentage": "15.00", "active": True},
        smoke_statuses=(201, 403, 409),
    ),
    # --- Dev ---
    EndpointDef(
        id="dev.test_email",
        method="POST",
        path="/dev/test-email",
        auth=AuthLevel.NONE,
        description="Envoi d'email de test (Mailtrap)",
        body={
            "send_to": "test@example.com",
            "subject": "API tester",
            "body": "Smoke test",
        },
        smoke_statuses=(200, 500),
    ),
    EndpointDef(
        id="auth.logout",
        method="POST",
        path="/auth/logout",
        auth=AuthLevel.BEARER,
        description="Déconnexion (révocation du token)",
    ),
)


def get_endpoint(endpoint_id: str) -> EndpointDef:
    for endpoint in ENDPOINTS:
        if endpoint.id == endpoint_id:
            return endpoint
    raise KeyError(f"Endpoint inconnu : {endpoint_id}")


def format_path(path: str, path_params: dict[str, Any] | None = None) -> str:
    params = path_params or {}
    return path.format(**params)
