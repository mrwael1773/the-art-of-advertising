import sqlite3
from pathlib import Path

db = sqlite3.connect(":memory:")
db.executescript(Path("migrations/0001_initial.sql").read_text(encoding="utf-8"))
tables = {row[0] for row in db.execute("SELECT name FROM sqlite_master WHERE type='table'")}
assert {"users", "sessions", "progress", "rate_limits"} <= tables
assert db.execute("PRAGMA foreign_keys").fetchone()[0] == 1

db.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", ("u1", "student_one", "salt", "hash", 1))
db.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", ("u2", "student_two", "salt", "hash", 1))
db.execute("INSERT INTO progress VALUES (?, ?, ?, ?)", ("u1", "lesson-a", '{"score":5}', 2))
db.execute("INSERT INTO progress VALUES (?, ?, ?, ?)", ("u2", "lesson-a", '{"score":2}', 2))
db.execute("INSERT INTO sessions VALUES (?, ?, ?, ?)", ("token-u1", "u1", 100, 1))

assert db.execute("SELECT COUNT(*) FROM progress WHERE user_id='u1'").fetchone()[0] == 1
assert db.execute("SELECT COUNT(*) FROM progress WHERE user_id='u2'").fetchone()[0] == 1
assert db.execute("SELECT user_id FROM sessions WHERE token_hash='token-u1'").fetchone()[0] == "u1"

try:
    db.execute("INSERT INTO users VALUES (?, ?, ?, ?, ?)", ("u3", "STUDENT_ONE", "salt", "hash", 1))
    raise AssertionError("Username uniqueness must be case-insensitive")
except sqlite3.IntegrityError:
    pass

try:
    db.execute("INSERT INTO progress VALUES (?, ?, ?, ?)", ("u1", "lesson-a", '{"score":9}', 3))
    raise AssertionError("A user must have only one record per lesson")
except sqlite3.IntegrityError:
    pass

db.execute("DELETE FROM users WHERE id='u1'")
assert db.execute("SELECT COUNT(*) FROM progress WHERE user_id='u1'").fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM sessions WHERE user_id='u1'").fetchone()[0] == 0
assert db.execute("SELECT COUNT(*) FROM progress WHERE user_id='u2'").fetchone()[0] == 1
print("D1 schema, case-insensitive usernames, unique lesson records, foreign-key cascades, and account isolation checks passed.")
