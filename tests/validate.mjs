import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const worker = await readFile(new URL("../src/worker.js", import.meta.url), "utf8");
const schema = await readFile(new URL("../migrations/0001_initial.sql", import.meta.url), "utf8");
const config = await readFile(new URL("../wrangler.toml", import.meta.url), "utf8");
const frontend = await readFile(new URL("../public/app.js", import.meta.url), "utf8");
const lesson = await readFile(new URL("../public/lesson.js", import.meta.url), "utf8");
const page = await readFile(new URL("../public/index.html", import.meta.url), "utf8");
const styles = await readFile(new URL("../public/styles.css", import.meta.url), "utf8");

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

test("state-changing requests require the exact same-origin Origin header", () => {
  assert.match(worker, /const changesState = \["POST", "PUT", "PATCH", "DELETE"\]\.includes\(method\)/);
  assert.match(worker, /if \(changesState && origin !== url\.origin\) return false/);
  assert.match(worker, /sec-fetch-site/);
});

test("expired sessions and stale rate-limit records are cleaned during authentication", () => {
  assert.match(worker, /DELETE FROM sessions WHERE expires_at<=\?/);
  assert.match(worker, /DELETE FROM rate_limits WHERE window_started<=\?/);
  assert.match(schema, /idx_rate_limits_window ON rate_limits\(window_started\)/);
});

test("authentication throttles requests before running expired-record cleanup", () => {
  const authStart = worker.indexOf("async function auth(");
  const authEnd = worker.indexOf("\nasync function handleProgress", authStart);
  const authBody = worker.slice(authStart, authEnd);
  const throttle = authBody.indexOf("await limit(env.DB");
  const cleanup = authBody.indexOf("await cleanupExpired(env.DB");
  assert.ok(throttle !== -1 && cleanup !== -1 && throttle < cleanup);
});

test("progress writes accept only the expected bounded quiz record", () => {
  assert.match(worker, /const answerKey = \[0, 0, 1, 0, 0, 0, 2, 0, 1, 1, 0, 0, 1, 0, 1\]/);
  const questionStart = lesson.indexOf("const questions = [");
  const questionEnd = lesson.indexOf("];", questionStart);
  assert.doesNotMatch(lesson.slice(questionStart, questionEnd), /,c:\\d/);
  assert.match(worker, /submitted\.length !== answerKey\.length/);
  assert.match(worker, /submitted\.every\(value => Number\.isInteger\(value\) && value >= 0 && value <= 2\)/);
  assert.match(worker, /submitted\.reduce\(/);
  assert.match(worker, /key !== "world-of-plastic-reading"/);
});


test("authentication enforces username and password bounds before account operations", () => {
  assert.match(worker, /const USERNAME =/);
  assert.match(worker, /USERNAME\.test\(username\)/);
  assert.match(worker, /password\.length < 10 \|\| password\.length > 128/);
  assert.match(worker, /password\.length > 128/);
  assert.match(worker, /INSERT INTO users\(id,username,password_salt,password_hash,created_at\)/);
});

test("login throttling limits both one IP and repeated attempts against one username", () => {
  assert.match(worker, /ip \+ ":login", 30, 900/);
  assert.match(worker, /ip \+ ":login:" \+ username, 8, 900/);
  assert.match(worker, /ip \+ ":register", 5, 3600/);
});

test("session lookup requires an unexpired hashed bearer cookie and logout revokes it", () => {
  assert.match(worker, /sessions\.token_hash=\? AND sessions\.expires_at>\?/);
  assert.match(worker, /b64\(await digest\(token\)\)/);
  assert.match(worker, /DELETE FROM sessions WHERE token_hash=\?/);
  assert.match(worker, /"set-cookie": setCookie\(url, "", 0\)/);
  assert.match(worker, /HttpOnly; SameSite=Lax; Max-Age=/);
});

test("progress API only accesses records for the authenticated session user", () => {
  assert.match(worker, /const user = await sessionUser\(req, env\);[\s\S]*?return await handleProgress\(req, env, user\)/);
  assert.match(worker, /SELECT lesson_key,progress_json,updated_at FROM progress WHERE user_id=\?/);
  assert.match(worker, /bind\(user\.id\)/);
});

test("Cloudflare binding is explicit and database ID is not fabricated", () => {
  assert.match(config, /binding = "DB"/);
  assert.match(config, /REPLACE_WITH_D1_DATABASE_ID/);
});

test("account UI renders user-controlled values as text and uses same-origin API calls", () => {
  assert.match(frontend, /accountName\.textContent/);
  assert.match(frontend, /credentials:\s*"same-origin"/);
  assert.match(frontend, /account-ready/);
  assert.match(lesson, /addEventListener\("account-ready", restoreProgress\)/);
  assert.doesNotMatch(frontend, /innerHTML/);
  assert.doesNotMatch(frontend, /localStorage|sessionStorage/);
});

test("reading lesson contains six paraphrased reading paragraphs and forty-three vocabulary entries", () => {
  assert.match(lesson, /const paragraphs = \[/);
  assert.match(lesson, /const words = \[/);
  assert.equal((lesson.match(/en: \[/g) || []).length, 6);
  assert.equal((lesson.match(/\["[^"]+","[^"]+"\]/g) || []).length, 43);
  assert.equal((lesson.match(/type:"reading"|type:"vocabulary"/g) || []).length, 15);
});

test("quiz completion is kept distinct from the student's score", () => {
  assert.match(lesson, /نتيجة الاختبار السابقة:/);
  assert.match(lesson, /نتيجة الاختبار: /);
  assert.match(lesson, /Math\.round\(\(record\.score \/ record\.total\) \* 100\)/);
  assert.match(lesson, /Math\.round\(\(result\.score \/ result\.total\) \* 100\)/);
  assert.doesNotMatch(lesson, /progress-fill\)\.style\.width = "100%"/);
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
  assert.match(lesson, /fetch\("\/api\/progress"/);
  assert.match(lesson, /world-of-plastic-reading/);
});

test("logout failures are announced in the visible account area", () => {
  const start = frontend.indexOf('document.querySelector("#logout-button")');
  const handler = frontend.slice(start);
  assert.notEqual(start, -1);
  assert.ok(handler.includes('document.querySelector("#lesson-message")'));
  assert.ok(handler.includes('catch(error){status.textContent=error.message}'));
});

test("lesson text is inserted as text, not HTML", () => {
  assert.match(lesson, /textContent/);
  assert.doesNotMatch(lesson, /innerHTML/);
  assert.match(styles, /@media\(max-width:420px\)/);
});

test("JSON request bodies are streamed and capped before full buffering", () => {
  const start = worker.indexOf("async function body(req)");
  const end = worker.indexOf("\nfunction originOK", start);
  const bodyReader = worker.slice(start, end);
  assert.notEqual(start, -1);
  assert.match(bodyReader, /req\.body && req\.body\.getReader\(\)/);
  assert.match(bodyReader, /size \+= part\.value\.byteLength/);
  assert.match(bodyReader, /if \(size > 8192\)/);
  assert.match(bodyReader, /await reader\.cancel\(\)/);
  assert.doesNotMatch(bodyReader, /req\.text\(\)/);
  assert.match(bodyReader, /new TextDecoder\("utf-8", \{ fatal: true \}\)/);
});
