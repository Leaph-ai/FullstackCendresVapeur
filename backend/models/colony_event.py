from sqlalchemy import Column, Integer, String, Text, Date

from app.core.database import Base


class ColonyEvent(Base):
    __tablename__ = "colony_events"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    description = Column(Text)
    event_date = Column(Date, nullable=False)
    priority = Column(String, nullable=False)
