from __future__ import annotations

import random
from datetime import UTC, datetime

from app.air.constants import GAUGE_CONFIGS, SULFUR_ID, GaugeConfig
from app.air.schemas import AirSnapshot, GaugeReading


class AirMonitor:
    """Simulateur d'état de l'air — état partagé côté serveur."""

    def __init__(
        self,
        *,
        configs: list[GaugeConfig] = GAUGE_CONFIGS,
        threshold_high: float = 70.0,
        threshold_low: float = 60.0,
        spark_length: int = 16,
        volatility: float = 6.0,
        spike_chance: float = 0.15,
    ) -> None:
        self._configs = configs
        self._threshold_high = threshold_high
        self._threshold_low = threshold_low
        self._spark_length = spark_length
        self._volatility = volatility
        self._spike_chance = spike_chance
        self._sulfur_cfg = next(c for c in configs if c.id == SULFUR_ID)
        self._values: dict[str, float] = {c.id: float(c.center) for c in configs}
        self._spark: list[float] = self._initial_spark()
        self._alert_active = False

    def _jitter(self, center: float, amp: float) -> float:
        return max(4.0, min(96.0, center + (random.random() * 2 - 1) * amp))

    def _initial_spark(self) -> list[float]:
        center = self._sulfur_cfg.center
        return [round(self._jitter(center, self._volatility)) for _ in range(self._spark_length)]

    def _next_sulfur(self) -> float:
        if random.random() < self._spike_chance:
            return float(round(random.uniform(self._threshold_high, 96.0)))
        return float(round(self._jitter(self._sulfur_cfg.center, self._volatility)))

    def _apply_hysteresis(self, sulfur: float) -> bool:
        """Met à jour l'état d'alerte. Retourne True uniquement sur le front montant."""
        if not self._alert_active and sulfur >= self._threshold_high:
            self._alert_active = True
            return True
        if self._alert_active and sulfur < self._threshold_low:
            self._alert_active = False
        return False

    def _readings(self) -> list[GaugeReading]:
        readings: list[GaugeReading] = []
        for cfg in self._configs:
            value = self._values[cfg.id]
            readings.append(
                GaugeReading(
                    id=cfg.id,
                    label=cfg.label,
                    value=value,
                    unit=cfg.unit,
                    warn=cfg.warn <= value < cfg.danger,
                    danger=value >= cfg.danger,
                )
            )
        return readings

    def snapshot(self) -> AirSnapshot:
        return AirSnapshot(
            gauges=self._readings(),
            sulfur_spark=list(self._spark),
            sulfur_level=self._values[SULFUR_ID],
            alert_red=self._alert_active,
            threshold=self._threshold_high,
            timestamp=datetime.now(UTC),
        )

    def tick(self) -> tuple[AirSnapshot, bool]:
        for cfg in self._configs:
            if cfg.id == SULFUR_ID:
                self._values[cfg.id] = self._next_sulfur()
            else:
                self._values[cfg.id] = float(round(self._jitter(cfg.center, self._volatility)))
        sulfur = self._values[SULFUR_ID]
        self._spark = self._spark[1:] + [sulfur]
        alert_edge = self._apply_hysteresis(sulfur)
        return self.snapshot(), alert_edge

    def reset(self) -> None:
        self._values = {c.id: float(c.center) for c in self._configs}
        self._spark = self._initial_spark()
        self._alert_active = False


monitor = AirMonitor()
