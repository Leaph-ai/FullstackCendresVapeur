"""Compare le mapping ORM à la vraie base (schema.sql appliqué via ./db/db.sh setup).

Skippé automatiquement si Postgres n'est pas joignable.
"""
import pytest
from sqlalchemy import inspect
from sqlalchemy.exc import OperationalError

from app.core.database import Base, engine
import models  # noqa: F401


def _db_available() -> bool:
    try:
        engine.connect().close()
        return True
    except OperationalError:
        return False


pytestmark = pytest.mark.skipif(
    not _db_available(),
    reason="Postgres indisponible — lancer `./db/db.sh setup` d'abord.",
)


def test_orm_columns_exist_in_database():
    insp = inspect(engine)
    db_tables = set(insp.get_table_names())
    for table_name, table in Base.metadata.tables.items():
        assert table_name in db_tables, f"Table absente en base: {table_name}"
        db_cols = {c["name"] for c in insp.get_columns(table_name)}
        orm_cols = set(table.columns.keys())
        missing = orm_cols - db_cols
        assert not missing, f"{table_name}: colonnes ORM absentes en base: {missing}"
