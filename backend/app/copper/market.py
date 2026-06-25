from __future__ import annotations

import random
from datetime import UTC, datetime

from app.copper.schemas import CopperSnapshot


class CopperMarket:
    """Simulateur de bourse du cuivre — état partagé côté serveur."""

    def __init__(
        self,
        *,
        base_index: float = 248.0,
        min_index: float = 180.0,
        max_index: float = 320.0,
        spark_length: int = 14,
        volatility: float = 6.0,
    ) -> None:
        self._base_index = base_index
        self._min_index = min_index
        self._max_index = max_index
        self._spark_length = spark_length
        self._volatility = volatility
        self._index = base_index
        self._delta = 0.0
        self._spark = self._initial_spark()

    @property
    def min_index(self) -> float:
        return self._min_index

    @property
    def max_index(self) -> float:
        return self._max_index

    def _initial_spark(self) -> list[float]:
        return [
            max(4.0, min(96.0, 40.0 + random.random() * 50.0))
            for _ in range(self._spark_length)
        ]

    def _trend(self, delta: float) -> str:
        if delta > 0:
            return "up"
        if delta < 0:
            return "down"
        return "flat"

    def snapshot(self) -> CopperSnapshot:
        return CopperSnapshot(
            index=round(self._index, 2),
            delta=round(self._delta, 2),
            trend=self._trend(self._delta),
            spark=[round(value, 2) for value in self._spark],
            timestamp=datetime.now(UTC),
        )

    def tick(self) -> CopperSnapshot:
        self._delta = round((random.random() * 2 - 1) * self._volatility, 2)
        self._index = max(
            self._min_index,
            min(self._max_index, self._index + self._delta),
        )
        next_spark = max(4.0, min(96.0, 30.0 + random.random() * 62.0))
        self._spark = self._spark[1:] + [next_spark]
        return self.snapshot()

    def reset(self) -> None:
        self._index = self._base_index
        self._delta = 0.0
        self._spark = self._initial_spark()


market = CopperMarket()
