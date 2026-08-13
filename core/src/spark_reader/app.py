"""FastAPI routes for searching the Spark Desktop mail cache."""

from __future__ import annotations

import sqlite3
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query

from .db import SparkDB
from .search import (
    MESSAGE_COLUMNS,
    build_field_fts_query,
    build_fts_query,
    build_headers_fts_query,
    message_row_to_dict,
    qualified_columns,
)

app = FastAPI(title="SparkReader", version="0.1.0")
_spark = SparkDB()


def get_db():
    conn = _spark.connect()
    try:
        yield conn
    finally:
        conn.close()


DB = Annotated[sqlite3.Connection, Depends(get_db)]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/accounts")
def accounts(conn: DB) -> list[dict]:
    rows = conn.execute(
        "SELECT pk, accountType, accountTitle, ownerFullName, ownerPictureURL, "
        "additionalInfo FROM accounts ORDER BY orderNumber, pk"
    ).fetchall()
    return [dict(r) for r in rows]


@app.get("/folders")
def folders(conn: DB, account: int | None = None) -> list[dict]:
    sql = "SELECT pk, accountPk, parentPk, folderName, folderPath, imapPath, imapMessageCount FROM folders"
    params: list = []
    if account is not None:
        sql += " WHERE accountPk = ?"
        params.append(account)
    sql += " ORDER BY accountPk, pk"
    return [dict(r) for r in conn.execute(sql, params).fetchall()]


@app.get("/messages/search")
def search_messages(
    conn: DB,
    q: str | None = Query(None, description="Full-text query (subject, from, to)"),
    account: int | None = Query(None, description="Filter by account pk"),
    from_addr: str | None = Query(None, alias="from", description="Sender address (LIKE)"),
    from_exact: str | None = Query(None, alias="fromExact", description="Sender mailbox exact match"),
    from_domain: str | None = Query(None, alias="fromDomain", description="Sender domain (e.g. stripe.com)"),
    to_addr: str | None = Query(None, alias="to", description="Recipient address (LIKE)"),
    subject: str | None = Query(None, description="Subject substring (LIKE)"),
    body: str | None = Query(None, description="Full-text query over message body only"),
    starred: bool | None = None,
    unseen: bool | None = None,
    in_inbox: bool | None = Query(None, alias="inInbox"),
    in_sent: bool | None = Query(None, alias="inSent"),
    in_drafts: bool | None = Query(None, alias="inDrafts"),
    snoozed: bool | None = None,
    has_attachments: bool | None = None,
    since: int | None = Query(None, description="receivedDate >= since (unix seconds)"),
    until: int | None = Query(None, description="receivedDate <= until (unix seconds)"),
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    where: list[str] = []
    params: list = []

    if account is not None:
        where.append("m.accountPk = ?")
        params.append(account)
    if from_addr is not None:
        where.append("(m.messageFromMailbox LIKE ? OR m.messageFrom LIKE ?)")
        params.extend([f"%{from_addr}%", f"%{from_addr}%"])
    if from_exact is not None:
        where.append("m.messageFromMailbox = ?")
        params.append(from_exact)
    if from_domain is not None:
        domain = from_domain.lstrip("@")
        where.append("m.messageFromMailbox LIKE ?")
        params.append(f"%@{domain}")
    if to_addr is not None:
        where.append("(m.messageTo LIKE ? OR m.messageCc LIKE ? OR m.messageBcc LIKE ?)")
        params.extend([f"%{to_addr}%", f"%{to_addr}%", f"%{to_addr}%"])
    if subject is not None:
        where.append("m.subject LIKE ?")
        params.append(f"%{subject}%")
    if starred is not None:
        where.append("m.starred = ?")
        params.append(int(starred))
    if unseen is not None:
        where.append("m.unseen = ?")
        params.append(int(unseen))
    if in_inbox is not None:
        where.append("m.inInbox = ?")
        params.append(int(in_inbox))
    if in_sent is not None:
        where.append("m.inSent = ?")
        params.append(int(in_sent))
    if in_drafts is not None:
        where.append("m.inDrafts = ?")
        params.append(int(in_drafts))
    if snoozed is not None:
        where.append("m.snoozed = ?")
        params.append(int(snoozed))
    if has_attachments is not None:
        where.append(f"m.numberOfFileAttachments {'>' if has_attachments else '='} 0")
    if since is not None:
        where.append("m.receivedDate >= ?")
        params.append(since)
    if until is not None:
        where.append("m.receivedDate <= ?")
        params.append(until)

    fts_clauses: list[str] = []
    if q:
        fts_clauses.append(build_headers_fts_query(q))
    if body:
        fts_clauses.append(build_field_fts_query("searchBody", body))

    if fts_clauses:
        join = " JOIN fts.messagesfts f ON f.messagePk = m.pk"
        where.append("f.messagesfts MATCH ?")
        params.append(" AND ".join(fts_clauses))
        order = " ORDER BY bm25(messagesfts), m.receivedDate DESC"
    else:
        join = ""
        order = " ORDER BY m.receivedDate DESC"

    where_sql = (" WHERE " + " AND ".join(where)) if where else ""

    total = conn.execute(
        f"SELECT COUNT(*) FROM messages m{join}{where_sql}", params
    ).fetchone()[0]

    rows = conn.execute(
        f"SELECT {qualified_columns('m')} FROM messages m{join}{where_sql}"
        f"{order} LIMIT ? OFFSET ?",
        params + [limit, offset],
    ).fetchall()

    return {"total": total, "count": len(rows), "results": [message_row_to_dict(r) for r in rows]}


@app.get("/messages/{pk}")
def get_message(conn: DB, pk: int) -> dict:
    row = conn.execute(
        f"SELECT {MESSAGE_COLUMNS} FROM messages WHERE pk = ?", (pk,)
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=404, detail="message not found")

    html = conn.execute(
        "SELECT data FROM cache.messageBodyHtml WHERE messagePk = ?", (pk,)
    ).fetchone()

    result = message_row_to_dict(row)
    result["bodyHtml"] = html["data"].decode("utf-8", errors="replace") if html else None
    return result


@app.get("/messages/{pk}/attachments")
def message_attachments(conn: DB, pk: int) -> list[dict]:
    rows = conn.execute(
        "SELECT pk, attachmentType, attachmentMIMEType, attachmentSize, attachmentName, "
        "attachmentURL, remoteURL, imageDimensions FROM messageAttachment WHERE messagePk = ?",
        (pk,),
    ).fetchall()
    return [dict(r) for r in rows]


@app.get("/conversations/{pk}/messages")
def conversation_messages(conn: DB, pk: int) -> list[dict]:
    rows = conn.execute(
        f"SELECT {MESSAGE_COLUMNS} FROM messages WHERE conversationPk = ? "
        "ORDER BY receivedDate ASC",
        (pk,),
    ).fetchall()
    return [message_row_to_dict(r) for r in rows]


@app.get("/attachments/search")
def search_attachments(
    conn: DB,
    q: str | None = Query(None, description="Full-text query over attachment content"),
    name: str | None = Query(None, description="Filename substring (LIKE)"),
    mime: str | None = Query(None, description="MIME type substring (LIKE)"),
    account: int | None = None,
    limit: int = Query(20, ge=1, le=200),
    offset: int = Query(0, ge=0),
) -> dict:
    if q:
        rows = conn.execute(
            "SELECT DISTINCT a.messagePk, a.attachmentMIMEType, a.attachmentSize, "
            "a.attachmentName FROM fts.attachmentsfts f "
            "JOIN messageAttachment a ON a.pk = f.attachmentPk "
            "WHERE f.attachmentsfts MATCH ? LIMIT ? OFFSET ?",
            (build_fts_query(q), limit, offset),
        ).fetchall()
    else:
        where: list[str] = []
        params: list = []
        if name is not None:
            where.append("a.attachmentName LIKE ?")
            params.append(f"%{name}%")
        if mime is not None:
            where.append("a.attachmentMIMEType LIKE ?")
            params.append(f"%{mime}%")
        if account is not None:
            where.append("m.accountPk = ?")
            params.append(account)
        where_sql = (" WHERE " + " AND ".join(where)) if where else ""
        rows = conn.execute(
            f"SELECT a.messagePk, a.attachmentMIMEType, a.attachmentSize, a.attachmentName "
            f"FROM messageAttachment a JOIN messages m ON m.pk = a.messagePk{where_sql} "
            f"LIMIT ? OFFSET ?",
            params + [limit, offset],
        ).fetchall()

    return {"count": len(rows), "results": [dict(r) for r in rows]}
