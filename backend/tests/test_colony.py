from models.air_quality import AirQuality


def test_colony_stats_defaults_when_empty(client):
    body = client.get("/colony/stats").json()
    assert body["citizens"] == 0
    assert body["orders"] == 0
    assert body["air"]["sulfur"] == 0
    assert body["air"]["alert_red"] is False


def test_colony_stats_counts_users_and_air(factory, db_session, client):
    factory.user()
    factory.user()
    db_session.add(
        AirQuality(
            sulfur_level=34,
            monoxide_level=22,
            particulate_level=48,
            boiler_pressure=62,
            alert_red=False,
        )
    )
    db_session.commit()

    body = client.get("/colony/stats").json()
    assert body["citizens"] == 2
    assert body["air"]["sulfur"] == 34
    assert body["air"]["monoxide"] == 22
    assert body["air"]["particulate"] == 48
    assert body["air"]["boiler_pressure"] == 62
