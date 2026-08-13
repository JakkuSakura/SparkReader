# SparkReader

A local, read-only search interface for the [Spark Desktop](https://sparkmailapp.com/)
mail cache. It reads Spark's on-disk SQLite databases directly — no IMAP, no OAuth,
no network access — and exposes them through a FastAPI backend and a SolidJS frontend.

## Structure

```
.
├── core/   # Python FastAPI backend (uv + uv-build)
│   ├── src/spark_reader/
│   └── tests/
└── ui/     # SolidJS + TypeScript + VitePlus + Tailwind (pnpm)
    └── src/
```

## Features

- Full-text search over headers (subject, sender, recipient) and body via Spark's FTS5 index
- Structured filters: sender (contains / exact / domain), recipient, subject,
  date range, and flags (inbox, sent, drafts, starred, unseen, snoozed, attachments)
- Message detail with rendered HTML body, thread view, and attachments
- Read-only SQLite access (Spark can keep running while you search)

## Backend (`core/`)

```sh
cd core
uv sync
uv run spark-reader --port 8765
```

Interactive docs at `http://127.0.0.1:8765/docs`.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness check |
| GET | `/accounts` | List email accounts |
| GET | `/folders?account=` | List folders |
| GET | `/messages/search` | Full-text + structured message search |
| GET | `/messages/{pk}` | Message detail incl. HTML body |
| GET | `/messages/{pk}/attachments` | Attachments of a message |
| GET | `/conversations/{pk}/messages` | Thread messages |
| GET | `/attachments/search` | Attachment content search |

### Search query params (`/messages/search`)

- `q` — full-text over subject / from / to
- `body` — full-text over message body only
- `from`, `fromExact`, `fromDomain` — sender filter (substring / exact / domain)
- `to`, `subject` — substring filters
- `account` — account pk
- `starred`, `unseen`, `inInbox`, `inSent`, `inDrafts`, `snoozed` — booleans
- `has_attachments` — boolean
- `since`, `until` — `receivedDate` bounds (unix seconds)
- `limit` (default 20, max 200), `offset`

## Frontend (`ui/`)

```sh
cd ui
pnpm install
pnpm dev
```

The dev server runs at `http://localhost:5173` and proxies `/messages`, `/accounts`,
`/folders`, `/conversations`, `/attachments`, and `/health` to the backend at
`127.0.0.1:8765`.

## License

[MIT](LICENSE)
