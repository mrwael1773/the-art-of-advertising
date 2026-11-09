import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/worker.js", import.meta.url), "utf8");
const schema = await readFile(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");
const config = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");

test("passwords use PBKDF2 with a per-user salt", () => {
  assert.match(worker, /PBKDF2/);
  assert.match(worker, /iterations:\s*ITERATIONS/);
  assert.match(worker, /random\(16\)/);
  assert.match(worker, /const ITERATIONS = 310000/);
  assert.match(schema, /password_salt TEXT NOT NULL/);
  assert.match(schema, /password_hash TEXT NOT NULL/);
});

test("session cookies are HttpOnly and SameSite", () => {
  assert.match(worker, /HttpOnly; SameSite=Lax/);
  assert.match(worker, /__Host-session/);
  assert.match(worker, /; Secure/);
  assert.match(schema, /token_hash TEXT PRIMARY KEY/);
});

test("progress storage is keyed and queried by authenticated user", () => {
  assert.match(schema, /PRIMARY KEY \(user_id, lesson_key\)/);
  assert.match(schema, /REFERENCES users\(id\) ON DELETE CASCADE/);
  assert.match(worker, /WHERE user_id=\?/);
  assert.match(worker, /bind\(user\.id/);
  assert.doesNotMatch(worker, /data\.userId/);
});

test("rate limiting and bounded request bodies are present", () => {
  assert.match(worker, /rate_limits/);
  assert.match(worker, /8192/);
  assert.match(worker, /429/);
});

test("Cloudflare binding is explicit and database ID is not fabricated", () => {
  assert.match(config, /binding = "DB"/);
  assert.match(config, /REPLACE_WITH_D1_DATABASE_ID/);
});
