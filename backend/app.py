import json
import sqlite3
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "tasks.db"
SCHEMA_PATH = BASE_DIR / "schema.sql"
ALLOWED_STATUSES = {"open", "completed"}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def get_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with get_connection() as connection:
        connection.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))


def serialize_task(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "title": row["title"],
        "description": row["description"],
        "status": row["status"],
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
    }


class TaskRequestHandler(BaseHTTPRequestHandler):
    server_version = "TaskServer/1.0"

    def do_OPTIONS(self) -> None:
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/tasks":
            self._send_json(404, {"error": "Not found"})
            return

        query = parse_qs(parsed.query)
        search = query.get("search", [""])[0].strip()
        status = query.get("status", ["all"])[0].strip().lower() or "all"

        if status != "all" and status not in ALLOWED_STATUSES:
            self._send_json(400, {"error": "Invalid status filter"})
            return

        filters = []
        values: list[str] = []

        if search:
            filters.append("(LOWER(title) LIKE ? OR LOWER(description) LIKE ?)")
            pattern = f"%{search.lower()}%"
            values.extend([pattern, pattern])

        if status != "all":
            filters.append("status = ?")
            values.append(status)

        where_clause = f"WHERE {' AND '.join(filters)}" if filters else ""
        sql = f"""
            SELECT id, title, description, status, created_at, updated_at
            FROM tasks
            {where_clause}
            ORDER BY created_at DESC, id DESC
        """

        with get_connection() as connection:
            rows = connection.execute(sql, values).fetchall()

        self._send_json(200, [serialize_task(row) for row in rows])

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path != "/api/tasks":
            self._send_json(404, {"error": "Not found"})
            return

        payload = self._read_json_body()
        if payload is None:
            return

        title = str(payload.get("title", "")).strip()
        description = str(payload.get("description", "")).strip()

        if not title:
            self._send_json(400, {"error": "Title is required"})
            return

        now = utc_now_iso()
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO tasks (title, description, status, created_at, updated_at)
                VALUES (?, ?, 'open', ?, ?)
                """,
                (title, description, now, now),
            )
            task_id = cursor.lastrowid
            row = connection.execute(
                """
                SELECT id, title, description, status, created_at, updated_at
                FROM tasks
                WHERE id = ?
                """,
                (task_id,),
            ).fetchone()

        self._send_json(201, serialize_task(row))

    def do_PUT(self) -> None:
        task_id = self._extract_task_id()
        if task_id is None:
            return

        payload = self._read_json_body()
        if payload is None:
            return

        title = str(payload.get("title", "")).strip()
        description = str(payload.get("description", "")).strip()
        status = str(payload.get("status", "open")).strip().lower()

        if not title:
            self._send_json(400, {"error": "Title is required"})
            return

        if status not in ALLOWED_STATUSES:
            self._send_json(400, {"error": "Invalid status"})
            return

        now = utc_now_iso()
        with get_connection() as connection:
            cursor = connection.execute(
                """
                UPDATE tasks
                SET title = ?, description = ?, status = ?, updated_at = ?
                WHERE id = ?
                """,
                (title, description, status, now, task_id),
            )
            if cursor.rowcount == 0:
                self._send_json(404, {"error": "Task not found"})
                return

            row = connection.execute(
                """
                SELECT id, title, description, status, created_at, updated_at
                FROM tasks
                WHERE id = ?
                """,
                (task_id,),
            ).fetchone()

        self._send_json(200, serialize_task(row))

    def do_DELETE(self) -> None:
        task_id = self._extract_task_id()
        if task_id is None:
            return

        with get_connection() as connection:
            cursor = connection.execute("DELETE FROM tasks WHERE id = ?", (task_id,))

        if cursor.rowcount == 0:
            self._send_json(404, {"error": "Task not found"})
            return

        self._send_json(200, {"message": "Task deleted"})

    def _extract_task_id(self) -> int | None:
        parsed = urlparse(self.path)
        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) != 3 or parts[0] != "api" or parts[1] != "tasks":
            self._send_json(404, {"error": "Not found"})
            return None

        try:
            return int(parts[2])
        except ValueError:
            self._send_json(400, {"error": "Invalid task id"})
            return None

    def _read_json_body(self) -> dict | None:
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self._send_json(400, {"error": "Invalid request body"})
            return None

        raw_body = self.rfile.read(length) if length > 0 else b"{}"
        try:
            return json.loads(raw_body.decode("utf-8"))
        except json.JSONDecodeError:
            self._send_json(400, {"error": "Request body must be valid JSON"})
            return None

    def _send_json(self, status_code: int, payload: dict | list) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_cors_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def log_message(self, format: str, *args) -> None:
        return


def run() -> None:
    init_db()
    host = "127.0.0.1"
    port = 8000
    server = ThreadingHTTPServer((host, port), TaskRequestHandler)
    print(f"Task API running at http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    run()
