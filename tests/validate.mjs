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

const frontend = await readFile(new URL("../public/app.js", import.meta.url), "utf8");

test("account UI renders user-controlled values as text and uses same-origin API calls", () => {
  assert.match(frontend, /accountName\.textContent/);
  assert.match(frontend, /credentials:\s*"same-origin"/);
  assert.match(frontend, /account-ready/);
  assert.match(lesson, /addEventListener\("account-ready", restoreProgress\)/);
  assert.doesNotMatch(frontend, /innerHTML/);
  assert.doesNotMatch(frontend, /localStorage|sessionStorage/);
});

const lesson = await readFile(new URL("../public/lesson.js", import.meta.url), "utf8");
const page = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

test("reading lesson contains six paraphrased reading paragraphs and forty-three vocabulary entries", () => {
  assert.match(lesson, /const paragraphs = \[/);
  assert.match(lesson, /const words = \[/);
  assert.equal((lesson.match(/en: \[/g) || []).length, 6);
  assert.equal((lesson.match(/\["[^"]+","[^"]+"\]/g) || []).length, 43);
  assert.equal((lesson.match(/type:"reading"|type:"vocabulary"/g) || []).length, 15);
});

test("lesson has speech speed, translation reveal, quiz, and server progress persistence", () => {
  assert.match(page, /id="speech-speed"/);
  assert.match(page, /id="reading-list"/);
  assert.match(page, /id="vocabulary-list"/);
  assert.match(page, /id="quiz-area"/);
  assert.match(lesson, /speechSynthesis/);
  assert.match(lesson, /إيقاف النطق/);
  assert.match(lesson, /utterance\.rate/);
  assert.match(lesson, /method:"PUT"/);
  assert.match(lesson, /fetch\\("\/api\/progress"/);
  assert.match(lesson, /world-of-plastic-reading/);
});

test("lesson text is inserted as text, not HTML", () => {
  assert.match(lesson, /textContent/);
  assert.doesNotMatch(lesson, /innerHTML/);
  assert.match(styles, /@media\(max-width:420px\)/);
});
