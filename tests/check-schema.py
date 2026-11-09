import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.executescript(Path("migrations/0001_initial.sql").read_text(encoding="utf-8"))
tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
assert {"users", "sessions", "progress", "rate_limits"} <= tables

db.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", ("u1", "student_one", "salt", "hash", 1))
db.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", ("u2", "student_two", "salt", "hash", 1))
db.execute("INSERT INTO progress VALUES (?, ?, ?, ?)", ("u1", "lesson-a", '{"score":5}', 2))
db.execute("INSERT INTO progress VALUES (?, ?, ?, ?)", ("u2", "lesson-a", '{"score":2}', 2))
assert db.execute("SELECT COUNT(*) FROM progress WHERE user_id='u1'").fetchone()[0] == 1
assert db.execute("SELECT COUNT(*) FROM progress WHERE user_id='u2'").fetchone()[0] == 1
db.execute("DELETE FROM users WHERE id='u1'")
assert db.execute("SELECT COUNT(*) FROM progress WHERE user_id='u1'").fetchone()[0] == 0
print("D1 schema structure and user-scoped progress checks passed.")
