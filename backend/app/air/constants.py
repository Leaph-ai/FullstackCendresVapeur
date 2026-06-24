from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class GaugeConfig:
    id: str
    label: str
    unit: str
    center: float
    warn: float
    danger: float
    initial_warn: bool = False


GAUGE_CONFIGS: list[GaugeConfig] = [
    GaugeConfig("soufre", "Soufre", "ppm", 34, 45, 70, initial_warn=True),
    GaugeConfig("monoxyde", "Monoxyde", "ppm", 22, 45, 70),
    GaugeConfig("particules", "Particules", "µg", 48, 45, 75, initial_warn=True),
    GaugeConfig("pression", "Pression chaudière", "%", 40, 70, 88),
]

SULFUR_ID = "soufre"
