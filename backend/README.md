# Backend

API REST construite avec **FastAPI** et **Python 3.14**.

## Prérequis

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) (recommandé) ou pip
- [Docker](https://docs.docker.com/get-docker/) et Docker Compose (pour la base PostgreSQL)

## Architecture des conteneurs

`docker-compose.yml` définit deux services :

| Service | Rôle | Démarré par défaut ? |
|---------|------|----------------------|
| `db`  | PostgreSQL (port 5432) | **Oui** |
| `api` | L'API FastAPI conteneurisée (port 8000) | **Non** — derrière le profil `full` |

Le service `api` est **opt-in** : il ne démarre qu'avec `--profile full`. Ça
permet, en développement backend, de ne lancer que la base et de faire tourner
FastAPI en local (hot reload), sans conflit sur le port 8000.

> Le volume `./uploads:/app/uploads` est un *bind mount* vers le dossier hôte
> `backend/uploads/`. Les fichiers (factures, uploads) atterrissent au même
> endroit que l'API tourne en conteneur **ou** en local — la fonctionnalité est
> identique dans les deux cas.

## Choisir son workflow

### A. Développer le backend (recommandé pour coder l'API)

Seule la base tourne en conteneur ; l'API tourne en local avec rechargement à chaud.

```bash
# Depuis le dossier backend/
./db/db.sh setup                  # démarre UNIQUEMENT db + applique schéma/seed
uv sync                           # installe les dépendances (1re fois)
uv run fastapi dev app/main.py    # API en local sur :8000, hot reload, zéro rebuild
```

`db.sh setup` crée automatiquement `.env` depuis `.env.example` s'il est absent.
`DATABASE_URL` y pointe vers `localhost:5432` (la base publiée par le conteneur).

### B. Lancer la stack complète (front/démo, sans toucher au backend)

L'API tourne aussi en conteneur. À utiliser quand on ne développe pas le backend.

```bash
# Depuis le dossier backend/
docker compose --profile full up -d --build

# À noter que si les conteneurs sont lancés avec le profil full, ils doivent aussi être arrêtés avec ce profil :
docker compose --profile full down
```

Ici `DATABASE_URL` est surchargé par compose pour viser le service `db` (et non
`localhost`). L'API est sur http://localhost:8000.

> ⚠️ Ne pas mélanger A et B : si le conteneur `api` tourne, il occupe déjà le
> port 8000 et `fastapi dev` échouera. Faire `docker compose down` avant de
> repasser en workflow A.

## Base de données

Le script `db/db.sh` gère tout le cycle de vie. Seul prérequis : **Docker**
(pas besoin d'un client PostgreSQL local).

```bash
./db/db.sh setup   # démarre la base, applique le schéma (si absent) puis le seed
./db/db.sh reset   # remet la base à zéro (supprime le volume) — confirmation requise
./db/db.sh seed    # réinjecte uniquement les données de dev
./db/db.sh psql    # ouvre un shell psql interactif dans le conteneur
```

## Installation locale (sans uv)

```bash
python -m venv .venv
source .venv/bin/activate          # Linux/macOS — .venv\Scripts\activate sous Windows
pip install -r requirements.txt
fastapi dev app/main.py
```

## Accès

- **API** : http://localhost:8000
- **Documentation interactive (Swagger)** : http://localhost:8000/docs
- **Schéma OpenAPI** : http://localhost:8000/openapi.json

## Routes

L'API est découpée en routers par domaine (montés dans `app/main.py`). La liste
exhaustive et à jour est dans la **doc interactive `/docs`** ; vue d'ensemble :

| Domaine | Préfixe | Description |
|---------|---------|-------------|
| Auth | `/auth` | OAuth, login, 2FA, tokens |
| Produits | `/products` | Catalogue, pricing dynamique (Bourse du Cuivre) |
| Catégories | `/categories` | Catégories du catalogue |
| Votes | `/votes` | Pression Populaire (likes) |
| Paniers | `/carts` | Panier d'achat |
| Commandes | `/orders` | Checkout, factures |
| Codes promo | `/discounts` | Codes de réduction |
| Cuivre | `/copper` | Flux SSE de l'indice du cuivre |
| Air | `/air` | Toxicity Monitor — flux SSE qualité de l'air |
| Chat | `/chat` | Shadow Telegraph (WebSocket Admin/Editor) |
| Journal | `/journal` | Survivors Journal (log d'activité) |
| Colonie | `/colony` | Colony Chronometer (calendrier, notes) |
| Contact | `/contact` | Formulaire de contact (email) |
| Fichiers | `/files`, `/uploads` | Upload et service de fichiers statiques |
| Utilisateurs | `/users` | Gestion des utilisateurs |
| Logs | — | Journalisation applicative |
