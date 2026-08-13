"""Smoke tests against the live Spark cache (read-only)."""

from __future__ import annotations

from fastapi.testclient import TestClient

from spark_reader.app import app

client = TestClient(app)


def test_health() -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_accounts() -> None:
    accounts = client.get("/accounts").json()
    assert len(accounts) > 0
    assert "accountTitle" in accounts[0]


def test_fts_search() -> None:
    result = client.get("/messages/search", params={"q": "Binance", "limit": 3}).json()
    assert result["total"] > 0
    assert result["count"] <= 3


def test_structured_search() -> None:
    result = client.get("/messages/search", params={"inSent": "true", "limit": 2}).json()
    assert result["total"] > 0
    for m in result["results"]:
        assert m["inSent"] == 1


def test_message_detail() -> None:
    message = client.get("/messages/search", params={"limit": 1}).json()["results"][0]
    detail = client.get(f"/messages/{message['pk']}").json()
    assert detail["pk"] == message["pk"]
    assert "bodyHtml" in detail


def test_attachments_search() -> None:
    result = client.get("/attachments/search", params={"limit": 3}).json()
    assert result["count"] <= 3
