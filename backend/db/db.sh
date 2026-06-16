#!/usr/bin/env bash
# Gestion de la base PostgreSQL de "Cendres et Vapeur" (dev).
# Pilote psql à l'intérieur du conteneur Docker : seul prérequis = Docker.
#
# Usage (depuis backend/) :
#   ./db/db.sh setup   # démarre la DB, applique schéma + seed
#   ./db/db.sh reset   # remet la DB à zéro (confirmation requise)
#   ./db/db.sh seed    # réinjecte les données de dev
#   ./db/db.sh psql    # shell psql interactif

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
cd "$BACKEND_DIR"

# Charge .env si présent (pour POSTGRES_USER / POSTGRES_DB)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

POSTGRES_USER="${POSTGRES_USER:-cendres}"
POSTGRES_DB="${POSTGRES_DB:-cendres_vapeur}"

SCHEMA_FILE="db/schema.sql"
SEED_FILE="db/seed.sql"

log() { printf '\033[1;36m[db]\033[0m %s\n' "$*"; }
err() { printf '\033[1;31m[db]\033[0m %s\n' "$*" >&2; }

wait_for_db() {
  log "Attente de PostgreSQL..."
  for _ in $(seq 1 30); do
    if docker compose exec -T db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      log "PostgreSQL est prêt."
      return 0
    fi
    sleep 1
  done
  err "PostgreSQL n'est pas prêt après 30s."
  return 1
}

apply_sql() {
  local file="$1"
  log "Application de $file"
  docker compose exec -T db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$file"
}

schema_exists() {
  docker compose exec -T db psql -tA -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    -c "SELECT to_regclass('public.roles') IS NOT NULL;" 2>/dev/null | grep -q '^t$'
}

ensure_up() {
  docker compose up -d
  wait_for_db
}

cmd_setup() {
  if [ ! -f .env ]; then
    log "Création de .env depuis .env.example"
    cp .env.example .env
  fi
  ensure_up
  if schema_exists; then
    log "Schéma déjà présent, application ignorée."
  else
    apply_sql "$SCHEMA_FILE"
  fi
  # Le seed est rejoué à chaque setup : db/seed.sql DOIT rester idempotent
  # (ON CONFLICT DO NOTHING / WHERE NOT EXISTS), sous peine de doublons.
  apply_sql "$SEED_FILE"
  log "Setup terminé."
}

cmd_reset() {
  read -r -p "Cela SUPPRIME toutes les données de la DB. Continuer ? [y/N] " ans
  case "$ans" in
    y|Y) ;;
    *) log "Annulé."; exit 0 ;;
  esac
  docker compose down -v
  ensure_up
  apply_sql "$SCHEMA_FILE"
  apply_sql "$SEED_FILE"
  log "Reset terminé."
}

cmd_seed() {
  ensure_up
  apply_sql "$SEED_FILE"
  log "Seed terminé."
}

cmd_psql() {
  ensure_up
  docker compose exec db psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
}

usage() {
  cat <<'EOF'
Usage : ./db/db.sh <commande>

  setup   Démarre la DB, applique le schéma (si absent) puis le seed
  reset   Remet la DB à zéro (supprime le volume) — confirmation requise
  seed    Réinjecte les données de dev
  psql    Ouvre un shell psql interactif dans le conteneur
EOF
}

case "${1:-}" in
  setup) cmd_setup ;;
  reset) cmd_reset ;;
  seed)  cmd_seed ;;
  psql)  cmd_psql ;;
  *) usage; exit 1 ;;
esac
