from sqlalchemy.orm import Session, joinedload

from models.user import User


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list_users(self) -> list[User]:
        return (
            self.db.query(User)
            .options(joinedload(User.role))
            .order_by(User.id)
            .all()
        )
