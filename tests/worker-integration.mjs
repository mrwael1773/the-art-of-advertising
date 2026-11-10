import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "../src/worker.js";

globalThis.crypto = webcrypto;

class MemoryD1 {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.rates = new Map();
    this.progress = new Map();
  }
  prepare(sql) {
    const db = this;
    let args = [];
    return {
      bind(...values) { args = values; return this; },
      async run() {
        if (sql.startsWith("INSERT INTO rate_limits")) {
          const [key, now, resetAt] = args;
          const old = db.rates.get(key);
          db.rates.set(key, !old || old.window_started <= resetAt
            ? { window_started: now, attempts: 1 }
            : { window_started: old.window_started, attempts: old.attempts + 1 });
          return { success: true };
        }
        if (sql.startsWith("DELETE FROM sessions WHERE expires_at<=")) {
          for (const [key, row] of db.sessions) if (row.expires_at <= args[0]) db.sessions.delete(key);
          return { success: true };
        }
        if (sql.startsWith("DELETE FROM rate_limits")) {
          for (const [key, row] of db.rates) if (row.window_started <= args[0]) db.rates.delete(key);
          return { success: true };
        }
        if (sql.startsWith("INSERT INTO users")) {
          const [id, username, password_salt, password_hash, created_at] = args;
          if ([...db.users.values()].some(row => row.username.toLowerCase() === username.toLowerCase())) {
            throw Error("UNIQUE constraint failed: users.username");
          }
          db.users.set(id, { id, username, password_salt, password_hash, created_at });
          return { success: true };
        }
        if (sql.startsWith("INSERT INTO sessions")) {
          const [token_hash, user_id, expires_at, created_at] = args;
          db.sessions.set(token_hash, { token_hash, user_id, expires_at, created_at });
          return { success: true };
        }
        if (sql.startsWith("DELETE FROM sessions WHERE token_hash=")) {
          db.sessions.delete(args[0]);
          return { success: true };
        }
        if (sql.startsWith("INSERT INTO progress")) {
          const [user_id, lesson_key, progress_json, updated_at] = args;
          db.progress.set(user_id + ":" + lesson_key, { user_id, lesson_key, progress_json, updated_at });
          return { success: true };
        }
        throw Error("Unsupported SQL run: " + sql);
      },
      async first() {
        if (sql.startsWith("SELECT attempts FROM rate_limits")) {
          const row = db.rates.get(args[0]);
          return row ? { attempts: row.attempts } : null;
        }
        if (sql.startsWith("SELECT id,username,password_salt,password_hash FROM users")) {
          return [...db.users.values()].find(row => row.username === args[0]) || null;
        }
        if (sql.startsWith("SELECT users.id,users.username FROM sessions JOIN users")) {
          const [token_hash, now] = args;
          const session = db.sessions.get(token_hash);
          if (!session || session.expires_at <= now) return null;
          const user = db.users.get(session.user_id);
          return user ? { id: user.id, username: user.username } : null;
        }
        throw Error("Unsupported SQL first: " + sql);
      },
      async all() {
        if (sql.startsWith("SELECT lesson_key,progress_json,updated_at FROM progress WHERE user_id=")) {
          return { results: [...db.progress.values()]
            .filter(row => row.user_id === args[0])
            .map(({ lesson_key, progress_json, updated_at }) => ({ lesson_key, progress_json, updated_at })) };
        }
        throw Error("Unsupported SQL all: " + sql);
      }
    };
  }
}

function request(path, { method = "GET", body, cookie, origin = "https://lesson.example" } = {}) {
  const headers = new Headers({ origin });
  if (body !== undefined) headers.set("content-type", "application/json");
  if (cookie) headers.set("cookie", cookie);
  return new Request("https://lesson.example" + path, {
    method, headers, body: body === undefined ? undefined : JSON.stringify(body)
  });
}
function sessionCookie(response) {
  const value = response.headers.get("set-cookie");
  assert.ok(value, "authentication response must set a session cookie");
  return value.split(";")[0];
}
async function call(db, path, options) {
  return worker.fetch(request(path, options), { DB: db });
}

test("registration creates a host-only secure session and /api/me returns the account", async () => {
  const db = new MemoryD1();
  const response = await call(db, "/api/register", {
    method: "POST", body: { username: "Student_01", password: "strong-password-1" }
  });
  assert.equal(response.status, 201);
  const setCookie = response.headers.get("set-cookie");
  assert.match(setCookie, /^__Host-session=[A-Za-z0-9_-]+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=604800; Secure$/);
  assert.doesNotMatch(setCookie, /Domain=/i);
  assert.equal(db.sessions.size, 1);

  const cookie = sessionCookie(response);
  const me = await call(db, "/api/me", { cookie });
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), { user: { username: "student_01" } });
});

test("login rejects a wrong password and issues a new session for valid credentials", async () => {
  const db = new MemoryD1();
  await call(db, "/api/register", {
    method: "POST", body: { username: "learner", password: "strong-password-2" }
  });
  const wrong = await call(db, "/api/login", {
    method: "POST", body: { username: "learner", password: "incorrect-password" }
  });
  assert.equal(wrong.status, 401);

  const login = await call(db, "/api/login", {
    method: "POST", body: { username: "LEARNER", password: "strong-password-2" }
  });
  assert.equal(login.status, 200);
  const me = await call(db, "/api/me", { cookie: sessionCookie(login) });
  assert.equal(me.status, 200);
  assert.deepEqual(await me.json(), { user: { username: "learner" } });
});

test("logout revokes the current session and expires its cookie", async () => {
  const db = new MemoryD1();
  const register = await call(db, "/api/register", {
    method: "POST", body: { username: "logout_user", password: "strong-password-3" }
  });
  const cookie = sessionCookie(register);
  const logout = await call(db, "/api/logout", { method: "POST", cookie });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /^__Host-session=; Path=\/; HttpOnly; SameSite=Lax; Max-Age=0; Secure$/);
  assert.equal(db.sessions.size, 0);

  const me = await call(db, "/api/me", { cookie });
  assert.equal(me.status, 401);
});

test("expired sessions cannot authenticate", async () => {
  const db = new MemoryD1();
  const register = await call(db, "/api/register", {
    method: "POST", body: { username: "expired_user", password: "strong-password-4" }
  });
  const cookie = sessionCookie(register);
  const [name, token] = cookie.split("=");
  const { createHash } = await import("node:crypto");
  const tokenHash = Buffer.from(createHash("sha256").update(token).digest())
    .toString("base64url");
  const stored = db.sessions.get(tokenHash);
  assert.ok(stored);
  stored.expires_at = Math.floor(Date.now() / 1000) - 1;

  const me = await call(db, "/api/me", { cookie });
  assert.equal(me.status, 401);
});

test("progress reads are isolated to the authenticated account", async () => {
  const db = new MemoryD1();
  const first = await call(db, "/api/register", {
    method: "POST", body: { username: "student_one", password: "strong-password-5" }
  });
  const second = await call(db, "/api/register", {
    method: "POST", body: { username: "student_two", password: "strong-password-6" }
  });
  const firstCookie = sessionCookie(first);
  const secondCookie = sessionCookie(second);
  const firstId = [...db.users.values()].find(row => row.username === "student_one").id;
  const secondId = [...db.users.values()].find(row => row.username === "student_two").id;
  db.progress.set(firstId + ":lesson-a", {
    user_id: firstId, lesson_key: "lesson-a", progress_json: '{"score":4}', updated_at: 1
  });
  db.progress.set(secondId + ":lesson-b", {
    user_id: secondId, lesson_key: "lesson-b", progress_json: '{"score":9}', updated_at: 2
  });

  const firstProgress = await call(db, "/api/progress", { cookie: firstCookie });
  const secondProgress = await call(db, "/api/progress", { cookie: secondCookie });
  assert.deepEqual((await firstProgress.json()).progress.map(row => row.lesson_key), ["lesson-a"]);
  assert.deepEqual((await secondProgress.json()).progress.map(row => row.lesson_key), ["lesson-b"]);
});
