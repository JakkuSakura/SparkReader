# SparkReader core

Read-only FastAPI server that searches the local Spark Desktop SQLite mail cache.

See the repository root `README.md` for the full project overview, and `ui/` for the frontend.

## Run

```sh
uv sync
uv run spark-reader --port 8765
```

Interactive docs at `http://127.0.0.1:8765/docs`.
