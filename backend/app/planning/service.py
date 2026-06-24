from datetime import date

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from models.colony_event import ColonyEvent
from models.shift_note import ShiftNote

from .schemas import ColonyEventCreate, ShiftNoteUpsert


class PlanningService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_events(self, year: int, month: int) -> list[ColonyEvent]:
        start = date(year, month, 1)
        if month == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month + 1, 1)

        return (
            self.db.query(ColonyEvent)
            .filter(ColonyEvent.event_date >= start, ColonyEvent.event_date < end)
            .order_by(ColonyEvent.event_date)
            .all()
        )

    def create_event(self, payload: ColonyEventCreate) -> ColonyEvent:
        event = ColonyEvent(
            title=payload.title,
            description=payload.description,
            event_date=payload.event_date,
            priority=payload.priority,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)
        return event

    def delete_event(self, event_id: int) -> None:
        event = self.db.query(ColonyEvent).filter(ColonyEvent.id == event_id).first()
        if not event:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Événement introuvable.")
        self.db.delete(event)
        self.db.commit()

    def upsert_shift_note(self, user_id: int, payload: ShiftNoteUpsert) -> ShiftNote:
        note = (
            self.db.query(ShiftNote)
            .filter(
                ShiftNote.user_id == user_id,
                ShiftNote.note_date == payload.note_date,
                ShiftNote.shift == payload.shift,
            )
            .first()
        )
        if note:
            note.content = payload.content
        else:
            note = ShiftNote(
                user_id=user_id,
                note_date=payload.note_date,
                shift=payload.shift,
                content=payload.content,
            )
            self.db.add(note)
        self.db.commit()
        self.db.refresh(note)
        return note

    def list_shift_notes(self, user_id: int, year: int, month: int) -> list[ShiftNote]:
        start = date(year, month, 1)
        if month == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month + 1, 1)

        return (
            self.db.query(ShiftNote)
            .filter(
                ShiftNote.user_id == user_id,
                ShiftNote.note_date >= start,
                ShiftNote.note_date < end,
            )
            .order_by(ShiftNote.note_date, ShiftNote.shift)
            .all()
        )