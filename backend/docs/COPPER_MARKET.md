# Bourse du cuivre — guide des endpoints

Ce document décrit l’API de simulation de la **bourse du cuivre** : ce qu’elle renvoie, comment la consommer, et comment elle se comporte côté serveur.

> **Note :** il s’agit d’un **simulateur** interne. Les cours ne proviennent pas d’un marché réel. Tous les clients connectés voient le **même** état, mis à jour par le backend.

---

## Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| `GET` | `/copper/current` | Non | Snapshot instantané du marché |
| `GET` | `/copper/stream` | Non | Flux temps réel (SSE) des mises à jour |

Base URL en dev : `http://localhost:8000`

---

## Format de réponse (`CopperSnapshot`)

Les deux endpoints renvoient le même objet JSON :

```json
{
  "index": 248.0,
  "delta": -1.2,
  "trend": "down",
  "spark": [47.58, 67.43, 48.08, 82.0, 64.27, 75.03, 57.04, 66.24, 84.01, 75.82, 82.19, 41.47, 83.98, 59.28],
  "timestamp": "2026-06-23T10:30:25.881620Z"
}
```

### Champs

| Champ | Type | Description |
|-------|------|-------------|
| `index` | `number` | Indice courant du cuivre (entre `COPPER_MIN_INDEX` et `COPPER_MAX_INDEX`, défaut 180–320) |
| `delta` | `number` | Variation depuis le dernier tick (positif = hausse, négatif = baisse) |
| `trend` | `"up"` \| `"down"` \| `"flat"` | Sens du mouvement déduit de `delta` |
| `spark` | `number[]` | Historique court pour la mini sparkline (14 valeurs par défaut, normalisées ~4–96) |
| `timestamp` | `string` (ISO 8601 UTC) | Horodatage du snapshot |

### Interprétation rapide

- **`index`** → valeur affichée comme « cours du cuivre »
- **`delta` + `trend`** → flèche hausse/baisse et amplitude du mouvement
- **`spark`** → courbe récente (graphique en barres ou ligne)
- **`timestamp`** → fraîcheur de la donnée

---

## `GET /copper/current`

Retourne l’état **à l’instant T**, sans ouvrir de connexion persistante.

Utile pour :
- le chargement initial d’une page
- un rafraîchissement ponctuel
- du debug (`curl`, Postman, tests)

```bash
curl http://localhost:8000/copper/current
```

Réponse HTTP `200` avec `Content-Type: application/json`.

---

## `GET /copper/stream` (SSE)

Flux **Server-Sent Events** : le serveur pousse les mises à jour au fil de l’eau.

### Comportement

1. À la connexion, le client reçoit **immédiatement** un snapshot (comme `/copper/current`).
2. Ensuite, à chaque tick du simulateur (~3 s par défaut), un **nouvel événement** est envoyé.
3. Si aucun tick n’arrive pendant l’intervalle configuré, un commentaire keepalive est envoyé (`: keepalive`) pour maintenir la connexion.

### Format SSE

Chaque événement est une ligne `data:` suivie du JSON :

```
data: {"index":252.75,"delta":-3.56,"trend":"down","spark":[...],"timestamp":"..."}

```

### Test en terminal

```bash
curl -N http://localhost:8000/copper/stream
```

L’option `-N` désactive le buffering pour voir les événements au fur et à mesure.

### Exemple frontend (EventSource)

```typescript
const source = new EventSource("http://localhost:8000/copper/stream");

source.onmessage = (event) => {
  const snapshot = JSON.parse(event.data);
  console.log(snapshot.index, snapshot.trend, snapshot.spark);
};

source.onerror = () => {
  source.close();
};
```

En dev avec le proxy Vite, adapter l’URL si besoin (ex. `/api/copper/stream`).

---

## Fonctionnement côté serveur

```text
Ticker (background, toutes les ~3 s)
    → market.tick()          # met à jour l'indice et la sparkline
    → hub.publish(snapshot)  # diffuse à tous les streams ouverts

Client SSE
    → GET /copper/stream
    → reçoit snapshot initial puis chaque tick publié
```

- **Un seul simulateur** partagé : tous les clients voient les mêmes valeurs.
- Pas d’authentification requise pour l’instant.
- L’influence sur les **prix produits** n’est pas encore branchée ; cette API expose uniquement l’état du marché.

---

## Configuration (`.env`)

| Variable | Défaut | Rôle |
|----------|--------|------|
| `COPPER_BASE_INDEX` | `248` | Indice de départ |
| `COPPER_MIN_INDEX` | `180` | Plancher de l’indice |
| `COPPER_MAX_INDEX` | `320` | Plafond de l’indice |
| `COPPER_TICK_SECONDS` | `3` | Intervalle entre deux ticks |
| `COPPER_SPARK_LENGTH` | `14` | Nombre de points dans `spark` |
| `COPPER_VOLATILITY` | `6` | Amplitude max d’un mouvement par tick |

Voir aussi `backend/.env.example`.

---

## Fichiers concernés

```
backend/app/copper/
├── market.py    # simulateur (état + tick)
├── hub.py       # diffusion interne vers les streams SSE
├── ticker.py    # tâche périodique au démarrage de l'API
└── schemas.py   # modèle CopperSnapshot

backend/app/routes/copper.py   # routes /copper/current et /copper/stream
```

---

## Erreurs courantes

| Symptôme | Cause probable |
|----------|----------------|
| `Could not connect to server` | L’API n’est pas démarrée → `uv run fastapi dev app/main.py` depuis `backend/` |
| Le stream ne bouge pas | Vérifier que le serveur tourne et attendre ~3 s entre chaque tick |
| Pas d’événements dans le navigateur | Vérifier CORS / proxy ; `EventSource` doit pointer vers la bonne origine |
