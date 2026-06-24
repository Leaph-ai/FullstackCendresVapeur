from app.air.constants import GAUGE_CONFIGS, SULFUR_ID
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
