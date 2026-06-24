from datetime import UTC, datetime

from app.air.constants import GAUGE_CONFIGS, SULFUR_ID
from app.air.schemas import AirSnapshot, GaugeReading
from app.config import get_settings


def test_gauge_configs_cover_four_pollutants():
    ids = [g.id for g in GAUGE_CONFIGS]
    assert ids == ["soufre", "monoxyde", "particules", "pression"]
    assert SULFUR_ID == "soufre"
    soufre = next(g for g in GAUGE_CONFIGS if g.id == SULFUR_ID)
    assert soufre.unit == "ppm"
    assert soufre.danger == 70


def test_air_settings_defaults():
    settings = get_settings()
    assert settings.air_tick_seconds == 2.6
    assert settings.air_sulfur_threshold == 70.0
    assert settings.air_sulfur_threshold_low == 60.0
    assert settings.air_spark_length == 16
    assert 0.0 < settings.air_sulfur_spike_chance < 1.0


def test_air_snapshot_serializes():
    snap = AirSnapshot(
        gauges=[GaugeReading(id="soufre", label="Soufre", value=34, unit="ppm", warn=False, danger=False)],
        sulfur_spark=[34.0, 36.0],
        sulfur_level=34.0,
        alert_red=False,
        threshold=70.0,
        timestamp=datetime.now(UTC),
    )
    payload = snap.model_dump(mode="json")
    assert payload["alert_red"] is False
    assert payload["threshold"] == 70.0
    assert payload["gauges"][0]["id"] == "soufre"
    assert len(payload["sulfur_spark"]) == 2
