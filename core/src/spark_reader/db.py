"""Read-only access to the Spark Desktop SQLite cache."""

from __future__ import annotations

import sqlite3
from pathlib import Path

DEFAULT_CORE_DATA = Path.home() / "Library" / "Application Support" / "Spark Desktop" / "core-data"


class SparkDB:
    """Opens the three Spark SQLite files read-only and attaches them."""

    def __init__(self, core_data: Path = DEFAULT_CORE_DATA) -> None:
        self.messages_path = core_data / "messages.sqlite"
        self.cache_path = core_data / "cache.sqlite"
        self.fts_path = core_data / "search_fts5.sqlite"

    def connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(f"file:{self.messages_path}?mode=ro", uri=True)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA query_only = ON")
        conn.execute("PRAGMA busy_timeout = 5000")
        conn.execute(f"ATTACH DATABASE 'file:{self.cache_path}?mode=ro' AS cache")
        conn.execute(f"ATTACH DATABASE 'file:{self.fts_path}?mode=ro' AS fts")
        return conn
