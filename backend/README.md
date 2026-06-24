# Backend

API REST construite avec **FastAPI** et **Python 3.14**.

## Prérequis

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) (recommandé) ou pip
- [Docker](https://docs.docker.com/get-docker/) et Docker Compose (pour la base PostgreSQL)

## Base de données (Docker)

PostgreSQL tourne dans Docker. Le script `db/db.sh` gère tout le cycle de vie.
Seul prérequis : **Docker** (pas besoin d’un client PostgreSQL local).

```bash
# Depuis le dossier backend/
# Démarre la base, applique le schéma et les données de dev
./db/db.sh setup
```

Le script crée automatiquement `.env` depuis `.env.example` s’il est absent.
La base écoute sur `localhost:5432` ; `DATABASE_URL` (pour SQLAlchemy) est dans `.env`.

Autres commandes :

```bash
./db/db.sh reset   # remet la base à zéro (supprime le volume) — confirmation requise
./db/db.sh seed    # réinjecte uniquement les données de dev
./db/db.sh psql    # ouvre un shell psql interactif dans le conteneur
```

## Installation et démarrage

### Avec uv (recommandé)

```bash
# Installer les dépendances et créer l'environnement virtuel
uv sync

# Démarrer le serveur de développement
uv run fastapi dev app/main.py
```

### Avec pip

```bash
# Créer et activer un environnement virtuel
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

# Installer les dépendances
pip install "fastapi[standard]"

# Démarrer le serveur de développement
fastapi dev app/main.py
```

## Accès

Une fois démarré, l'API est disponible sur :

- **API** : http://localhost:8000
- **Documentation interactive** : http://localhost:8000/docs

## Routes disponibles

| Méthode | Route      | Description                  |
|---------|------------|------------------------------|
| GET     | `/`        | Vérification que l'API tourne |
| POST    | `/getdata` | Enregistre du contenu dans un fichier |
| POST    | `/upload` | Uploade un fichier (pdf, png, jpg, webp) |