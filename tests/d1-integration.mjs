import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const wranglerVersion = "4.159.0";
const config = "wrangler.test.toml";
const database = "the-art-of-advertising-local-test";
const port = 8791;
const origin = `http://127.0.0.1:${port}`;
const stateDir = mkdtempSync(join(tmpdir(), "art-advertising-d1-"));
const env = { ...process.env, DO_NOT_TRACK: "1", NO_D1_WARNING: "true", CI: "1" };
let server;
let serverOutput = "";

function runWrangler(args) {
  const result = spawnSync("npx", ["--yes", `wrangler@${wranglerVersion}`, ...args], {
    cwd: process.cwd(),
    env,
    encoding: "utf8",
    stdio: "inherit",
    timeout: 180_000
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Wrangler exited with code ${result.status}`);
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error("Wrangler dev exited before becoming ready.\n" + serverOutput);
    }
    try {
      const response = await fetch(origin + "/api/me");
      if (response.status === 401) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error("Timed out waiting for local Worker.\n" + serverOutput);
}

function cookieFrom(response) {
  const values = response.headers.getSetCookie?.() || [];
  const raw = values[0] || response.headers.get("set-cookie");
  assert.ok(raw, "expected a Set-Cookie response header");
  return raw.split(";", 1)[0];
}

async function api(path, {
  method = "GET", body, rawBody, contentType = "application/json", cookie,
  ip = "198.51.100.10", requestOrigin = origin, extraHeaders = {}
} = {}) {
  const headers = { origin: requestOrigin, "CF-Connecting-IP": ip, ...extraHeaders };
  if (body !== undefined || rawBody !== undefined) headers["content-type"] = contentType;
  if (cookie) headers.cookie = cookie;
  return fetch(origin + path, {
    method,
    headers,
    body: rawBody !== undefined ? rawBody : body === undefined ? undefined : JSON.stringify(body)
  });
}

async function main() {
  // Both commands explicitly use Wrangler's local D1 store and a fresh temporary directory.
  runWrangler([
    "d1", "migrations", "apply", database,
    "--local", "--config", config, "--persist-to", stateDir
  ]);

  server = spawn("npx", [
    "--yes", `wrangler@${wranglerVersion}`, "dev",
    "--config", config, "--local", "--ip", "127.0.0.1",
    "--port", String(port), "--persist-to", stateDir
  ], { cwd: process.cwd(), env, stdio: ["ignore", "pipe", "pipe"], detached: process.platform !== "win32" });
  server.stdout.on("data", chunk => { serverOutput += chunk.toString(); });
  server.stderr.on("data", chunk => { serverOutput += chunk.toString(); });
  await waitForServer();

  const staticPage = await api("/");
  assert.equal(staticPage.status, 200, "the lesson page should be served");
  assert.equal(staticPage.headers.get("x-content-type-options"), "nosniff");
  assert.equal(staticPage.headers.get("x-frame-options"), "DENY");
  assert.equal(staticPage.headers.get("referrer-policy"), "no-referrer");
  assert.equal(staticPage.headers.get("cross-origin-resource-policy"), "same-origin");

  const wrongContentType = await api("/api/login", {
    method: "POST", rawBody: "{}", contentType: "text/plain"
  });
  assert.equal(wrongContentType.status, 415, "non-JSON API bodies must be rejected");

  const oversizedBody = await api("/api/login", {
    method: "POST",
    rawBody: JSON.stringify({ username: "oversized", password: "x".repeat(9000) })
  });
  assert.equal(oversizedBody.status, 413, "request bodies over 8 KiB must be rejected");

  const fetchMetadataCrossSite = await api("/api/logout", {
    method: "POST",
    extraHeaders: { "sec-fetch-site": "cross-site" }
  });
  assert.equal(fetchMetadataCrossSite.status, 403, "cross-site Fetch Metadata must be rejected");

  const registration = await api("/api/register", {
    method: "POST",
    body: { username: "student_alpha", password: "secure-test-password-1" }
  });
  assert.equal(registration.status, 201, "first student registration should succeed");
  const alphaCookie = cookieFrom(registration);
  assert.match(registration.headers.get("set-cookie"), /^session=[A-Za-z0-9_-]+; Path=\/; HttpOnly; SameSite=Lax; Max-Age=604800$/);

  const duplicate = await api("/api/register", {
    method: "POST",
    body: { username: "STUDENT_ALPHA", password: "secure-test-password-2" }
  });
  assert.equal(duplicate.status, 409, "username uniqueness must be case-insensitive");

  const wrongPassword = await api("/api/login", {
    method: "POST",
    body: { username: "student_alpha", password: "incorrect-test-password" }
  });
  assert.equal(wrongPassword.status, 401, "wrong password must not authenticate");

  const login = await api("/api/login", {
    method: "POST",
    body: { username: "STUDENT_ALPHA", password: "secure-test-password-1" }
  });
  assert.equal(login.status, 200, "valid login should succeed against D1");
  const alphaLoginCookie = cookieFrom(login);
  const me = await api("/api/me", { cookie: alphaLoginCookie });
  assert.deepEqual(await me.json(), { user: { username: "student_alpha" } });

  const betaRegistration = await api("/api/register", {
    method: "POST",
    body: { username: "student_beta", password: "secure-test-password-3" }
  });
  assert.equal(betaRegistration.status, 201, "second student registration should succeed");
  const betaCookie = cookieFrom(betaRegistration);

  const crossOrigin = await api("/api/progress", {
    method: "PUT",
    cookie: alphaLoginCookie,
    requestOrigin: "https://attacker.invalid",
    body: { lessonKey: "world-of-plastic-reading", answers: Array(15).fill(0) }
  });
  assert.equal(crossOrigin.status, 403, "cross-origin state changes must be rejected");

  const correctAnswers = [0, 0, 1, 0, 0, 0, 2, 0, 1, 1, 0, 0, 1, 0, 1];
  const saved = await api("/api/progress", {
    method: "PUT",
    cookie: alphaLoginCookie,
    body: { lessonKey: "world-of-plastic-reading", answers: correctAnswers }
  });
  assert.equal(saved.status, 200, "valid progress should persist in local D1");
  const savedResult = await saved.json();
  assert.equal(savedResult.saved, true);
  assert.equal(savedResult.score, 15);
  assert.equal(savedResult.total, 15);
  assert.equal(savedResult.completed, true);
  assert.ok(Number.isInteger(savedResult.updatedAt));

  const alphaProgressResponse = await api("/api/progress", { cookie: alphaLoginCookie });
  const alphaProgress = await alphaProgressResponse.json();
  assert.equal(alphaProgress.progress.length, 1);
  assert.equal(alphaProgress.progress[0].lesson_key, "world-of-plastic-reading");
  assert.deepEqual(JSON.parse(alphaProgress.progress[0].progress_json), {
    completed: true, score: 15, total: 15
  });

  const betaProgressResponse = await api("/api/progress", { cookie: betaCookie });
  assert.deepEqual(await betaProgressResponse.json(), { progress: [] });

  const invalidProgress = await api("/api/progress", {
    method: "PUT",
    cookie: betaCookie,
    body: { lessonKey: "world-of-plastic-reading", answers: [9] }
  });
  assert.equal(invalidProgress.status, 400, "invalid answers must not be stored");

  const logout = await api("/api/logout", { method: "POST", cookie: alphaLoginCookie });
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get("set-cookie"), /^session=; Path=\/; HttpOnly; SameSite=Lax; Max-Age=0$/);
  const revoked = await api("/api/me", { cookie: alphaLoginCookie });
  assert.equal(revoked.status, 401, "logged-out session must be revoked");
  const betaStillValid = await api("/api/me", { cookie: betaCookie });
  assert.equal(betaStillValid.status, 200, "revoking one session must not affect another account");

  // Expire one real D1-backed session without exposing or logging its bearer token.
  const expiryRegistration = await api("/api/register", {
    method: "POST",
    body: { username: "expired_worker", password: "secure-test-password-4" },
    ip: "203.0.113.41"
  });
  assert.equal(expiryRegistration.status, 201);
  const expiryCookie = cookieFrom(expiryRegistration);
  runWrangler([
    "d1", "execute", database, "--local", "--config", config,
    "--persist-to", stateDir, "--command",
    "UPDATE sessions SET expires_at = 1 WHERE user_id = (SELECT id FROM users WHERE username = 'expired_worker')"
  ]);
  const expiredMe = await api("/api/me", { cookie: expiryCookie, ip: "203.0.113.41" });
  assert.equal(expiredMe.status, 401, "an expired D1 session must not authenticate");

  // Exercise the actual D1-backed per-IP+username login ceiling: eight failures, then 429.
  const limitedIp = "203.0.113.77";
  for (let attempt = 1; attempt <= 8; attempt++) {
    const rejected = await api("/api/login", {
      method: "POST",
      ip: limitedIp,
      body: { username: "limit_target", password: "incorrect-test-password" }
    });
    assert.equal(rejected.status, 401, `login attempt ${attempt} should be counted and rejected as bad credentials`);
  }
  const throttled = await api("/api/login", {
    method: "POST",
    ip: limitedIp,
    body: { username: "limit_target", password: "incorrect-test-password" }
  });
  assert.equal(throttled.status, 429, "the ninth attempt for the same IP and username must be throttled");

  // Verify the separate registration ceiling: five attempts per IP per hour.
  const registrationLimitIp = "203.0.113.88";
  for (let attempt = 1; attempt <= 5; attempt++) {
    const allowed = await api("/api/register", {
      method: "POST",
      ip: registrationLimitIp,
      body: { username: "reg_limit_" + attempt, password: "secure-test-password-" + attempt }
    });
    assert.equal(allowed.status, 201, `registration attempt ${attempt} should be allowed`);
  }
  const blockedRegistration = await api("/api/register", {
    method: "POST",
    ip: registrationLimitIp,
    body: { username: "reg_limit_six", password: "secure-test-password-6" }
  });
  assert.equal(blockedRegistration.status, 429, "the sixth registration attempt from one IP must be throttled");

  // Verify the independent 30-attempt IP-wide login ceiling with distinct usernames.
  const globalLoginLimitIp = "203.0.113.99";
  for (let attempt = 1; attempt <= 30; attempt++) {
    const rejected = await api("/api/login", {
      method: "POST",
      ip: globalLoginLimitIp,
      body: { username: "global_limit_" + attempt, password: "incorrect-test-password" }
    });
    assert.equal(rejected.status, 401, `IP-wide login attempt ${attempt} should reach credential verification`);
  }
  const blockedGlobalLogin = await api("/api/login", {
    method: "POST",
    ip: globalLoginLimitIp,
    body: { username: "global_limit_31", password: "incorrect-test-password" }
  });
  assert.equal(blockedGlobalLogin.status, 429, "the 31st login attempt from one IP must be throttled");

  console.log("Local D1 integration passed: security headers, bounded JSON requests, same-origin and Fetch Metadata checks, registration and login throttling, account isolation, progress persistence, logout, and expired-session rejection.");
}

try {
  await main();
} finally {
  if (server && server.exitCode === null && server.signalCode === null) {
    const exited = new Promise(resolve => server.once("exit", resolve));
    try {
      if (process.platform === "win32") server.kill("SIGTERM");
      else process.kill(-server.pid, "SIGTERM");
    } catch {
      server.kill("SIGTERM");
    }
    await Promise.race([exited, new Promise(resolve => setTimeout(resolve, 5_000))]);
    if (server.exitCode === null && server.signalCode === null) {
      try {
        if (process.platform === "win32") server.kill("SIGKILL");
        else process.kill(-server.pid, "SIGKILL");
      } catch {
        server.kill("SIGKILL");
      }
    }
  }
  rmSync(stateDir, { recursive: true, force: true });
}
