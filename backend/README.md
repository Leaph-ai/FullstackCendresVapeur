# Backend

API REST construite avec **FastAPI** et **Python 3.14**.

## Prérequis

- Python 3.14+
- [uv](https://docs.astral.sh/uv/) (recommandé) ou pip

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
