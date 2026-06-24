import pytest
from fastapi import HTTPException

from app.logs.service import LogService
from models.colony_log import ColonyLog


def test_add_log_persists_row(db_session):
    service = LogService(db_session)
    log = service.add_log(user_id=7, action="vote: +1 sur Boussole")
    assert log.id is not None
    assert log.user_id == 7
    assert log.action == "vote: +1 sur Boussole"


def test_public_feed_keeps_only_public_prefixes_and_exposes_id(db_session):
    service = LogService(db_session)
    service.add_log(None, "connexion échouée pour user 42")  # privé
    public = service.add_log(3, "commande: #1042 passée — 420 ⚙")
    feed = service.public_feed(limit=20)
    assert len(feed) == 1
    assert feed[0]["id"] == public.id
    assert feed[0]["message"] == "commande: #1042 passée — 420 ⚙"
    assert "created_at" in feed[0]


def test_update_log_changes_action(db_session):
    service = LogService(db_session)
    log = service.add_log(None, "événement: brouillon")
    updated = service.update_log(log.id, "événement: corrigé")
    assert updated.action == "événement: corrigé"
    assert db_session.query(ColonyLog).get(log.id).action == "événement: corrigé"


def test_update_log_missing_raises_404(db_session):
    service = LogService(db_session)
    with pytest.raises(HTTPException) as exc:
        service.update_log(9999, "x")
    assert exc.value.status_code == 404


def test_delete_log_removes_row(db_session):
    service = LogService(db_session)
    log = service.add_log(None, "événement: à supprimer")
    service.delete_log(log.id)
    assert db_session.query(ColonyLog).get(log.id) is None


def test_delete_log_missing_raises_404(db_session):
    service = LogService(db_session)
    with pytest.raises(HTTPException) as exc:
        service.delete_log(9999)
    assert exc.value.status_code == 404
