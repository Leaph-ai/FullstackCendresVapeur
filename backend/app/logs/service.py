from sqlalchemy.orm import Session

from fastapi import HTTPException, status
from models.colony_log import ColonyLog

# Actions visibles publiquement dans le live feed
# Toute action qui commence par l'un de ces préfixes est affichée
PUBLIC_ACTION_PREFIXES = ("achat:", "commande:", "vote:", "événement:")


class LogService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_logs(self, limit: int = 50) -> list[ColonyLog]:
        """Retourne les derniers logs de la colonie, du plus récent au plus ancien.
        Réservé aux administrateurs.
        """
        return (
            self.db.query(ColonyLog)
            .order_by(ColonyLog.created_at.desc())
            .limit(limit)
            .all()
        )

    def public_feed(self, limit: int = 20) -> list[dict]:
        """Retourne les dernières actions publiques pour le live feed.
        Accessible sans authentification.
        Filtre uniquement les actions marquées comme publiques (achat, commande, vote, événement).
        """
        logs = (
            self.db.query(ColonyLog)
            .order_by(ColonyLog.created_at.desc())
            .limit(200)
            .all()
        )
        public = [
            {"id": log.id, "message": log.action, "created_at": log.created_at}
            for log in logs
            if any(log.action.lower().startswith(p) for p in PUBLIC_ACTION_PREFIXES)
        ]
        return public[:limit]

    def add_log(self, user_id: int | None, action: str) -> ColonyLog:
        """Enregistre une action dans le journal de la colonie.
        Appelé depuis les autres services (achat, vote, connexion, etc.)

        Convention pour les actions publiques (visibles dans le live feed) :
            add_log(user_id, "achat: Filtre à vapeur x2 — 420 ⚙")
            add_log(user_id, "commande: #1042 validée")
            add_log(user_id, "vote: +1 sur Boussole en laiton")
            add_log(None,    "événement: Ravitaillement nord programmé")

        Actions privées (admin uniquement) — pas de préfixe spécial :
            add_log(user_id, "connexion échouée pour user 42")
        """
        log = ColonyLog(user_id=user_id, action=action)
        self.db.add(log)
        self.db.commit()
        self.db.refresh(log)
        return log

    def _get_or_404(self, log_id: int) -> ColonyLog:
        log = self.db.query(ColonyLog).get(log_id)
        if log is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entrée de journal introuvable.",
            )
        return log

    def update_log(self, log_id: int, action: str) -> ColonyLog:
        """Modifie le texte d'une entrée. Réservé aux administrateurs."""
        log = self._get_or_404(log_id)
        log.action = action
        self.db.commit()
        self.db.refresh(log)
        return log

    def delete_log(self, log_id: int) -> None:
        """Supprime une entrée. Réservé aux administrateurs."""
        log = self._get_or_404(log_id)
        self.db.delete(log)
        self.db.commit()
