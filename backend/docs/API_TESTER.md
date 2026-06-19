# Testeur d'API — guide d'utilisation

Ce document décrit le module `api_tester/` et la suite pytest `tests/api/`, utilisés pour tester l'API backend de bout en bout.

## Architecture

```
backend/
├── api_tester/           # Moteur réutilisable (catalogue + client + CLI)
│   ├── catalog.py        # Liste de tous les endpoints (source de vérité)
│   ├── client.py         # Client HTTP (TestClient ou httpx)
│   ├── auth_helper.py    # Helpers login / inscription
│   └── runner.py         # Interface en ligne de commande
└── tests/api/            # Tests pytest basés sur le même catalogue
    ├── conftest.py       # Fixtures partagées
    ├── test_catalog.py   # Meta-tests du catalogue
    ├── test_client.py    # Tests du client et routes publiques
    └── test_*_api.py     # Un fichier par domaine (auth, products, …)
```

**Principe :** le fichier `catalog.py` décrit chaque endpoint une seule fois. Le CLI et pytest s'appuient dessus — pas de duplication des URLs dans dix fichiers.

---

## Prérequis

```bash
cd backend
uv sync --group dev
```

PostgreSQL doit être disponible pour les tests marqués `@pytest.mark.integration` (auth complet).

---

## Utilisation du CLI

### Lister les endpoints connus

```bash
uv run python -m api_tester --list
```

### Smoke test — API live (serveur déjà lancé)

```bash
uv run fastapi dev app/main.py   # dans un autre terminal

uv run python -m api_tester --base-url http://localhost:8000
```

### Smoke test — in-process (sans serveur)

```bash
uv run python -m api_tester --in-process
```

### Tester un seul endpoint

```bash
uv run python -m api_tester --in-process --endpoint root.health
uv run python -m api_tester --in-process --endpoint orders.delete
```

### Vérifier les gardes d'authentification

Ajoute un second passage sans token sur les routes protégées (401/403 attendus) :

```bash
uv run python -m api_tester --in-process --check-auth-guard
```

### Variables d'environnement utiles

| Variable | Description |
|----------|-------------|
| `API_TEST_BASE_URL` | URL de base (défaut : `http://localhost:8000`) |
| `API_TEST_USER_EMAIL` | Email pour login auto (défaut : `admin@example.com`) |
| `API_TEST_USER_PASSWORD` | Mot de passe (défaut : `changeme`) |
| `API_TEST_USER_TOKEN` | JWT utilisateur (skip le login si fourni) |
| `API_TEST_ADMIN_TOKEN` | JWT éditeur/admin |
| `API_TEST_2FA_CODE` | Code 2FA si login auto |

Exemple avec token déjà obtenu :

```bash
API_TEST_USER_TOKEN="eyJ..." uv run python -m api_tester --base-url http://localhost:8000
```

Équivalent via le script installé :

```bash
uv run cendres-api-tester --list
```

---

## Utilisation avec pytest

### Lancer toute la suite API

```bash
uv run pytest tests/api/ -v
```

### Par domaine

```bash
uv run pytest tests/api/test_products_api.py -v
uv run pytest tests/api/test_orders_api.py -v
```

### Tests d'intégration uniquement (auth + DB)

```bash
uv run pytest tests/api/ -m integration -v
```

### Tests unitaires rapides (sans DB)

```bash
uv run pytest tests/api/test_catalog.py tests/api/test_client.py -v
```

---

## Catalogue actuel (22 endpoints)

| Domaine | IDs |
|---------|-----|
| Racine | `root.health`, `root.getdata` |
| Auth | `auth.register`, `auth.login`, `auth.verify_2fa`, `auth.logout` |
| Produits | `products.list`, `products.get`, `products.create`, `products.update`, `products.delete` |
| Paniers | `carts.get`, `carts.add_item`, `carts.remove_item` |
| Commandes | `orders.create`, `orders.list_by_user`, `orders.get`, `orders.delete` |
| Réductions | `discounts.list`, `discounts.get`, `discounts.create` |
| Dev | `dev.test_email` |

---

## Ajouter un nouvel endpoint

### 1. Déclarer l'endpoint dans `api_tester/catalog.py`

```python
EndpointDef(
    id="mon_domaine.mon_action",       # identifiant unique (utilisé par le CLI)
    method="POST",
    path="/mon-chemin/{item_id}",
    auth=AuthLevel.BEARER,             # NONE | BEARER | EDITOR
    description="Description courte",
    path_params={"item_id": 1},        # valeurs par défaut pour les tests
    body={"champ": "valeur"},          # corps JSON (POST/PUT)
    smoke_statuses=(201, 400, 404),  # statuts acceptables en smoke test
),
```

Puis ajouter l'ID dans `tests/api/test_catalog.py` → ensemble `expected`.

### 2. Créer ou étendre un fichier de test

**Route joignable** (fonctionne même si la branche n'est pas mergée) :

```python
def test_mon_domaine_route_reachable(api_client: ApiClient):
    endpoint = get_endpoint("mon_domaine.mon_action")
    response = api_client.call_unauthenticated(endpoint)
    assert response.status_code not in (404, 405)
```

**Comportement nominal** (une fois l'endpoint implémenté) :

```python
@pytest.mark.integration
def test_mon_domaine_comportement(api_client: ApiClient, api_implemented: bool):
    if not api_implemented:
        pytest.skip("Route encore en stub")
    api_client.set_token("bearer", "...")
    response = api_client.call(get_endpoint("mon_domaine.mon_action"))
    assert response.status_code == 201
```

### 3. Vérifier

```bash
uv run python -m api_tester --in-process --endpoint mon_domaine.mon_action
uv run pytest tests/api/test_mon_domaine_api.py -v
```

---

## Stubs vs implémentation

Sur `develop`, certaines routes existent mais renvoient `null` (corps `pass` dans le routeur). Le testeur le gère ainsi :

- **`test_*_reachable`** : passe si la route répond (pas 404/405).
- **`test_*_require_auth_when_implemented`** : skippé tant que `api_implemented` est `False` (détecté via `GET /carts/{id}` sans token → 200 = stub, 401 = implémenté).

Quand tu merges une branche feature, les tests d'auth/comportement s'activent automatiquement.

---

## Bonnes pratiques

1. **Toujours mettre à jour `catalog.py` en premier** — le CLI et pytest suivent.
2. **Un fichier `test_<domaine>_api.py` par secteur** — évite un fichier géant.
3. **Smoke test avant PR** : `uv run python -m api_tester --in-process`
4. **Ne pas committer** `backend/output_file.txt` ni `backend/uv.lock.broken`.
5. Pour les routes avec paramètres dynamiques, l'ordre dans FastAPI compte (ex. `GET /orders/user/{id}` avant `GET /orders/{id}`).

---

## Dépannage

| Problème | Piste |
|----------|-------|
| `ModuleNotFoundError: api_tester` | Lancer depuis `backend/` ou vérifier `pythonpath` dans `pyproject.toml` |
| Login auto échoue | Fournir `API_TEST_2FA_CODE` ou `API_TEST_USER_TOKEN` |
| Tests integration en échec | Postgres + `./db/db.sh setup` |
| `orders.delete` → 405 | Normal tant que la branche `orders` n'est pas mergée |
| `uv.lock` invalide | `mv uv.lock uv.lock.bak && uv lock && uv sync --group dev` |
