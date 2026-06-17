from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, UniqueConstraint

from app.core.database import Base


class ShiftNote(Base):
    __tablename__ = "shift_notes"
    __table_args__ = (UniqueConstraint("user_id", "note_date", "shift"),)

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    note_date = Column(Date, nullable=False)
    shift = Column(String, nullable=False)
    content = Column(Text)
