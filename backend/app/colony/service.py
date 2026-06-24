from sqlalchemy import func
from sqlalchemy.orm import Session

from app.colony.schemas import AirQualityBrief, ColonyStatsResponse
from models.air_quality import AirQuality
from models.order import Order
from models.user import User

# Valeurs de repli si aucune mesure n'a encore été enregistrée.
_DEFAULT_AIR = AirQualityBrief(
    sulfur=0.0, monoxide=0.0, particulate=0.0, boiler_pressure=0.0, alert_red=False
)


def _num(value) -> float:
    return float(value) if value is not None else 0.0


class ColonyService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def stats(self) -> ColonyStatsResponse:
        citizens = self.db.query(func.count(User.id)).scalar() or 0
        orders = self.db.query(func.count(Order.id)).scalar() or 0

        reading = (
            self.db.query(AirQuality)
            .order_by(AirQuality.created_at.desc(), AirQuality.id.desc())
            .first()
        )
        if reading is None:
            air = _DEFAULT_AIR
        else:
            air = AirQualityBrief(
                sulfur=_num(reading.sulfur_level),
                monoxide=_num(reading.monoxide_level),
                particulate=_num(reading.particulate_level),
                boiler_pressure=_num(reading.boiler_pressure),
                alert_red=bool(reading.alert_red),
            )

        return ColonyStatsResponse(citizens=citizens, orders=orders, air=air)
