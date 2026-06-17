from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func

from app.core.database import Base


class ColonyLog(Base):
    __tablename__ = "colony_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
