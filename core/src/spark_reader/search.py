"""Query builders and row mapping for Spark Desktop mail search."""

from __future__ import annotations

import json
import sqlite3
from typing import Any

MESSAGE_COLUMNS = "pk, accountPk, messageType, creationDate, receivedDate, messageFrom, messageFromMailbox, messageTo, messageCc, messageBcc, subject, shortBody, conversationPk, numberOfFileAttachments, starred, unseen, inInbox, inSent, inDrafts, snoozed, category, messageId, meta"


def qualified_columns(alias: str) -> str:
    """Prefix each column with a table alias, e.g. 'm.pk, m.accountPk, ...'."""
    return ", ".join(f"{alias}.{c.strip()}" for c in MESSAGE_COLUMNS.split(","))


def build_fts_query(raw: str) -> str:
    """Turn raw user text into a safe FTS5 match expression.

    Each whitespace-separated token is quoted and combined with AND so that
    special FTS5 operators in user input are treated as literal text.
    """
    tokens = raw.split()
    if not tokens:
        raise ValueError("empty search query")
    quoted = [f'"{t.replace(chr(34), chr(34) * 2)}"' for t in tokens]
    return " AND ".join(quoted)


def build_field_fts_query(field: str, raw: str) -> str:
    """Restrict an FTS5 match to a single column, e.g. 'searchBody : "token"'."""
    tokens = raw.split()
    if not tokens:
        raise ValueError("empty search query")
    quoted = [f'{field} : "{t.replace(chr(34), chr(34) * 2)}"' for t in tokens]
    return " AND ".join(quoted)


def build_headers_fts_query(raw: str) -> str:
    """Restrict an FTS5 match to header columns (from, to, subject)."""
    tokens = raw.split()
    if not tokens:
        raise ValueError("empty search query")
    quoted = [f'{{messageFrom messageTo subject}} : "{t.replace(chr(34), chr(34) * 2)}"' for t in tokens]
    return " AND ".join(quoted)


def message_row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    d = dict(row)
    meta = d.pop("meta", None)
    if meta:
        d["meta"] = json.loads(meta)
    return d
