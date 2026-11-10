import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(path, import.meta.url), "utf8");
const [worker, config, app, lesson, page, resultPage, resultScript, headers, styles] = await Promise.all([
  read("../src/worker.js"), read("../wrangler.toml"), read("../public/app.js"),
  read("../public/lesson.js"), read("../public/index.html"),
  read("../public/results.html"), read("../public/results.js"),
  read("../public/_headers"), read("../public/styles.css")
]);

test("Worker only serves static assets and retains security headers", () => {
  assert.match(worker, /headers\.set\("x-content-type-options", "nosniff"\)/);
  assert.match(worker, /headers\.set\("x-frame-options", "DENY"\)/);
  assert.match(worker, /headers\.set\("referrer-policy", "no-referrer"\)/);
  assert.match(worker, /headers\.set\("cross-origin-resource-policy", "same-origin"\)/);
  assert.match(worker, /content-security-policy/);
  assert.match(worker, /env\.ASSETS\.fetch\(request\)/);
  assert.doesNotMatch(worker, /env\.DB|D1|api/);
  assert.doesNotMatch(config, /d1_databases|database_id|binding = "DB"/);
});

test("static assets keep the browser security policy", () => {
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /X-Frame-Options: DENY/);
  assert.match(headers, /Referrer-Policy: no-referrer/);
  assert.match(headers, /Cross-Origin-Resource-Policy: same-origin/);
  assert.match(headers, /Content-Security-Policy:/);
});

test("student page has no registration, login, username, or password controls", () => {
  assert.doesNotMatch(page, /id="auth-form"|id="login-tab"|id="register-tab"|id="username"|id="password"|type="password"/);
  assert.match(page, /sentences\.html/);
  assert.match(page, /words\.html/);
  assert.match(page, /quiz\.html/);
  assert.doesNotMatch(page, /audio\.html|سرعة الصوت/);
  assert.match(styles, /color-scheme:dark/);
  assert.doesNotMatch(page, /حفظ محلي/);
  assert.doesNotMatch(app, /fetch\(|\/api\/|password|username|login|register/i);
  assert.doesNotMatch(lesson, /fetch\(|\/api\/|account-ready/);
  assert.match(lesson, /if\(readingList\)paragraphs\.forEach/);
  assert.match(lesson, /if\(vocabularyList\)words\.forEach/);
  assert.match(lesson, /if\(quizArea\)questions\.forEach/);
  assert.ok(lesson.includes('window.location.assign("./results.html")'));
  assert.ok(resultPage.includes("النتيجة النهائية"));
  assert.ok(resultPage.includes("results.js"));
  assert.ok(resultScript.includes("sessionStorage.removeItem(storageKey)"));
});

test("practice answers and results are not persisted between visits", () => {
  assert.doesNotMatch(lesson, /StudentProgressStore|localStorage\.getItem|localStorage\.setItem|restore\(/);
  assert.doesNotMatch(page, /progress-store|حفظ محلي/);
  assert.match(lesson, /localStorage\.removeItem/);
  assert.ok(lesson.includes('sessionStorage.setItem("art-of-advertising:attempt-result:v1"'));
  assert.ok(resultScript.includes("sessionStorage.removeItem(storageKey)"));
  assert.equal([...lesson.matchAll(/correct:\s*[0-2]/g)].length, 15);
});

test("practice answer positions are balanced and preserve original answer indexes", () => {
  assert.ok(lesson.includes("const correctPositions = [1,2,0,1,2,1,0,2,0,2,1,0,2,0,1]"));
  assert.ok(lesson.includes("q.displayOrder.splice(correctPositions[i],0,q.correct)"));
  assert.ok(lesson.includes("input.value=String(originalIndex)"));
  assert.ok(lesson.includes("window.location.assign"));
});

