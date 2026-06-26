from sqlalchemy.orm import Session

from app.journal.schemas import JournalType
from models.colony_log import ColonyLog

# Mots-clés (en minuscules, sans accent géré via test simple) servant à colorer
# le flux du journal selon le type d'événement.
_KEYWORDS: list[tuple[JournalType, tuple[str, ...]]] = [
    ("alert", ("refus", "échec", "echec", "alerte", "soufre", "incident", "fuite")),
    ("troc", ("troc", "bordereau", "échange", "echange", "marché", "marche")),
    ("chaudiere", ("chaudière", "chaudiere", "vapeur", "pression chaudière", "soupape")),
    ("vote", ("vote", "pression populaire", "classement")),
    ("acces", ("connexion", "accès", "acces", "accrédité", "accredite", "inscription",
               "arrivant", "déconnexion", "deconnexion", "sceau", "sas")),
]


def classify(action: str) -> JournalType:
    """Déduit le type d'entrée du journal à partir du texte de l'action."""
    lowered = action.lower()
    for entry_type, keywords in _KEYWORDS:
        if any(keyword in lowered for keyword in keywords):
            return entry_type
    return "acces"


class JournalService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_recent(self, limit: int = 12) -> list[ColonyLog]:
        logs = (
            self.db.query(ColonyLog)
            .order_by(ColonyLog.created_at.desc(), ColonyLog.id.desc())
            .limit(limit)
            .all()
        )
        for log in logs:
            log.type = classify(log.action)
        return logs
