# Backend

API REST construite avec **FastAPI** et **Python 3.14**.

## Prérequis

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) (recommandé) ou pip
- [Docker](https://docs.docker.com/get-docker/) et Docker Compose (pour la base PostgreSQL)

## Base de données (Docker)

PostgreSQL est fourni via Docker Compose.

```bash
# Depuis le dossier backend/
cp .env.example .env

# Démarrer PostgreSQL
docker compose up -d

# Vérifier que le conteneur est prêt
docker compose ps
```

La base écoute sur `localhost:5432` par défaut. Les identifiants et l’URL de connexion sont dans `.env` (`DATABASE_URL` pour SQLAlchemy).

```bash
# Arrêter la base
docker compose down

# Arrêter et supprimer les données persistées
docker compose down -v
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
