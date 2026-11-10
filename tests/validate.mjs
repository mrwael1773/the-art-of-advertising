import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const read = path => readFile(new URL(path, import.meta.url), "utf8");
const [worker, config, app, lesson, page, store, headers] = await Promise.all([
  read("../src/worker.js"), read("../wrangler.toml"), read("../public/app.js"),
  read("../public/lesson.js"), read("../public/index.html"),
  read("../public/progress-store.js"), read("../public/_headers")
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
  assert.match(page, /progress-store\.js/);
  assert.match(page, /حفظ على جهازك/);
  assert.doesNotMatch(app, /fetch\(|\/api\/|password|username|login|register/i);
  assert.doesNotMatch(lesson, /fetch\(|\/api\/|account-ready/);
});

test("quiz result persistence validates the record and uses local browser storage", () => {
  assert.match(store, /localStorage\.getItem/);
  assert.match(store, /localStorage\.setItem/);
  assert.match(store, /Number\.isInteger\(record\.score\)/);
  assert.match(store, /record\.completed !== true/);
  assert.match(lesson, /StudentProgressStore\.save/);
  assert.match(lesson, /StudentProgressStore\?\.get/);
  assert.match(lesson, /const answerKey = \[0, 0, 1, 0, 0, 0, 2, 0, 1, 1, 0, 0, 1, 0, 1\]/);
});

test("local progress survives a page reload and rejects malformed or impossible scores", async () => {
  const data = new Map();
  const localStorage = {
    getItem: key => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, String(value)),
    removeItem: key => data.delete(key)
  };
  const makeStore = () => {
    const window = { localStorage };
    vm.runInNewContext(store, { window, Number, JSON, Object, TypeError, Date });
    return window.StudentProgressStore;
  };
  const firstPage = makeStore();
  const saved = firstPage.save("world-of-plastic-reading", {
    completed: true, score: 12, total: 15, answers: Array(15).fill(0)
  });
  assert.equal(saved.score, 12);
  assert.equal(firstPage.get("world-of-plastic-reading").total, 15);

  const afterReload = makeStore();
  assert.equal(afterReload.get("world-of-plastic-reading").score, 12);
  assert.equal(afterReload.get("missing-lesson"), null);
  assert.throws(() => afterReload.save("bad", { completed: true, score: 16, total: 15 }), /غير صالحة/);
  assert.throws(() => afterReload.save("bad", { completed: false, score: 1, total: 15 }), /غير صالحة/);

  data.set("art-of-advertising:student-progress:v1", "{broken-json");
  assert.equal(makeStore().get("world-of-plastic-reading"), null);
  afterReload.clear("world-of-plastic-reading");
  assert.equal(data.has("art-of-advertising:student-progress:v1"), false);
});

test("unavailable browser storage does not crash progress restoration", () => {
  const window = { localStorage: {
    getItem() { throw new DOMException("Storage is disabled", "SecurityError"); },
    setItem() { throw new DOMException("Storage is disabled", "SecurityError"); },
    removeItem() { throw new DOMException("Storage is disabled", "SecurityError"); }
  }};
  vm.runInNewContext(store, { window, Number, JSON, Object, TypeError, Date, DOMException });
  assert.equal(window.StudentProgressStore.get("world-of-plastic-reading"), null);
  assert.throws(() => window.StudentProgressStore.save("world-of-plastic-reading", {
    completed: true, score: 1, total: 15
  }), error => error.name === "SecurityError");
});

test("the same browser origin stores no identity fields or account credentials", () => {
  assert.doesNotMatch(store, /username|password|email|studentName/i);
  assert.match(store, /art-of-advertising:student-progress:v1/);
});
