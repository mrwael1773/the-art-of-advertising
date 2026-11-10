const SESSION_TTL = 604800;
const ITERATIONS = 310000;
const enc = new TextEncoder();
const USERNAME = /^[a-z0-9_]{3,24}$/;

function secureResponse(response) {
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("referrer-policy", "no-referrer");
  headers.set("cross-origin-resource-policy", "same-origin");
  headers.set("content-security-policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}
function reply(data, status, headers) {
  return secureResponse(new Response(JSON.stringify(data), { status: status || 200, headers: Object.assign({
    "content-type": "application/json; charset=utf-8", "cache-control": "no-store"
  }, headers || {}) }));
}
function b64(bytes) {
  let s = ""; for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function unb64(s) {
  s = s.replace(/-/g, "+").replace(/_/g, "/");
  s += "=".repeat((4 - s.length % 4) % 4);
  return Uint8Array.from(atob(s), c => c.charCodeAt(0));
}
function random(n) { return crypto.getRandomValues(new Uint8Array(n)); }
async function digest(v) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", typeof v === "string" ? enc.encode(v) : v));
}
async function derive(password, salt) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, 256));
}
function equal(a, b) {
  if (a.length !== b.length) return false;
  let d = 0; for (let i = 0; i < a.length; i++) d |= a[i] ^ b[i];
  return d === 0;
}
function cookieName(url) { return url.protocol === "https:" ? "__Host-session" : "session"; }
function getCookie(req, name) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const p = part.trim(); const i = p.indexOf("=");
    if (i > 0 && p.slice(0, i) === name) return p.slice(i + 1);
  }
  return null;
}
function setCookie(url, token, age) {
  const secure = url.protocol === "https:" ? "; Secure" : "";
  return cookieName(url) + "=" + token + "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + age + secure;
}
async function body(req) {
  if ((req.headers.get("content-type") || "").split(";", 1)[0].trim().toLowerCase() !== "application/json") throw Error("JSON_REQUIRED");
  if (Number(req.headers.get("content-length") || 0) > 8192) throw Error("TOO_LARGE");
  const reader = req.body && req.body.getReader();
  if (!reader) throw Error("BAD_JSON");
  const chunks = [];
  let size = 0;
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.byteLength;
    if (size > 8192) {
      try { await reader.cancel(); } catch (_) {}
      throw Error("TOO_LARGE");
    }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const raw = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw Error();
    return v;
  } catch (_) { throw Error("BAD_JSON"); }
}
function originOK(req, url) {
  const origin = req.headers.get("origin");
  const method = req.method.toUpperCase();
  const changesState = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  if (req.headers.get("sec-fetch-site") === "cross-site") return false;
  if (changesState && origin !== url.origin) return false;
  return !origin || origin === url.origin;
}
async function cleanupExpired(db, now) {
  await db.prepare("DELETE FROM sessions WHERE expires_at<=?").bind(now).run();
  await db.prepare("DELETE FROM rate_limits WHERE window_started<=?").bind(now - 86400).run();
}
async function limit(db, key, max, seconds) {
  const now = Math.floor(Date.now() / 1000), hash = b64(await digest(key));
  await db.prepare("INSERT INTO rate_limits(key_hash,window_started,attempts) VALUES(?,?,1) ON CONFLICT(key_hash) DO UPDATE SET attempts=CASE WHEN window_started<=? THEN 1 ELSE attempts+1 END, window_started=CASE WHEN window_started<=? THEN excluded.window_started ELSE window_started END")
    .bind(hash, now, now - seconds, now - seconds).run();
  const row = await db.prepare("SELECT attempts FROM rate_limits WHERE key_hash=?").bind(hash).first();
  return !!row && row.attempts <= max;
}
async function sessionUser(req, env) {
  const url = new URL(req.url), token = getCookie(req, cookieName(url));
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const row = await env.DB.prepare("SELECT users.id,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.token_hash=? AND sessions.expires_at>?")
    .bind(b64(await digest(token)), Math.floor(Date.now() / 1000)).first();
  return row || null;
}
async function issueSession(env, url, user, status) {
  const token = b64(random(32)), now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,expires_at,created_at) VALUES(?,?,?,?)")
    .bind(b64(await digest(token)), user.id, now + SESSION_TTL, now).run();
  return reply({ user: { username: user.username } }, status, { "set-cookie": setCookie(url, token, SESSION_TTL) });
}
async function auth(req, env, url, registering) {
  const data = await body(req);
  const username = typeof data.username === "string" ? data.username.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";
  if (!USERNAME.test(username)) return reply({ error: "اسم المستخدم يجب أن يكون من 3 إلى 24 حرفًا: أحرف إنجليزية أو أرقام أو _." }, 400);
  if (registering && (password.length < 10 || password.length > 128)) return reply({ error: "كلمة المرور يجب أن تكون بين 10 و128 خانة." }, 400);
  if (!registering && password.length > 128) return reply({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." }, 401);
  const ip = req.headers.get("CF-Connecting-IP") || "unknown";
  if (registering) {
    if (!await limit(env.DB, ip + ":register", 5, 3600)) {
      return reply({ error: "محاولات كثيرة. حاول لاحقًا." }, 429);
    }
  } else {
    // Apply both an IP-wide ceiling and a per-username ceiling to slow password spraying.
    if (!await limit(env.DB, ip + ":login", 30, 900) ||
        !await limit(env.DB, ip + ":login:" + username, 8, 900)) {
      return reply({ error: "محاولات كثيرة. حاول لاحقًا." }, 429);
    }
  }
  await cleanupExpired(env.DB, Math.floor(Date.now() / 1000));
  if (registering) {
    const salt = random(16), hash = await derive(password, salt);
    const user = { id: crypto.randomUUID(), username: username };
    try {
      await env.DB.prepare("INSERT INTO users(id,username,password_salt,password_hash,created_at) VALUES(?,?,?,?,?)")
        .bind(user.id, username, b64(salt), b64(hash), Math.floor(Date.now() / 1000)).run();
    } catch (e) {
      if (String(e).includes("UNIQUE")) return reply({ error: "اسم المستخدم مستخدم بالفعل." }, 409);
      throw e;
    }
    return issueSession(env, url, user, 201);
  }
  const user = await env.DB.prepare("SELECT id,username,password_salt,password_hash FROM users WHERE username=?").bind(username).first();
  const salt = user ? unb64(user.password_salt) : new Uint8Array(16);
  const expected = user ? unb64(user.password_hash) : new Uint8Array(32);
  const actual = await derive(password, salt);
  if (!user || !equal(actual, expected)) return reply({ error: "اسم المستخدم أو كلمة المرور غير صحيحة." }, 401);
  return issueSession(env, url, user, 200);
}
async function handleProgress(req, env, user) {
  if (req.method === "GET") {
    const result = await env.DB.prepare("SELECT lesson_key,progress_json,updated_at FROM progress WHERE user_id=? ORDER BY updated_at DESC").bind(user.id).all();
    return reply({ progress: result.results || [] });
  }
  if (req.method !== "PUT") return reply({ error: "Method not allowed" }, 405, { allow: "GET, PUT" });
  const data = await body(req), key = typeof data.lessonKey === "string" ? data.lessonKey : "";
  const submitted = data.answers;
  const answerKey = [0, 0, 1, 0, 0, 0, 2, 0, 1, 1, 0, 0, 1, 0, 1];
  if (key !== "world-of-plastic-reading" || !Array.isArray(submitted) ||
      submitted.length !== answerKey.length ||
      !submitted.every(value => Number.isInteger(value) && value >= 0 && value <= 2)) {
    return reply({ error: "إجابات الاختبار غير صالحة." }, 400);
  }
  const score = submitted.reduce((sum, answer, index) => sum + (answer === answerKey[index] ? 1 : 0), 0);
  const progress = { completed: true, score, total: answerKey.length };
  const serialized = JSON.stringify(progress);
  if (enc.encode(serialized).length > 4000) return reply({ error: "بيانات التقدم كبيرة جدًا." }, 413);
  const now = Math.floor(Date.now() / 1000);
  await env.DB.prepare("INSERT INTO progress(user_id,lesson_key,progress_json,updated_at) VALUES(?,?,?,?) ON CONFLICT(user_id,lesson_key) DO UPDATE SET progress_json=excluded.progress_json,updated_at=excluded.updated_at")
    .bind(user.id, key, serialized, now).run();
  return reply({ saved: true, score, total: answerKey.length, completed: true, updatedAt: now });
}
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    try {
      if (!env.DB) return reply({ error: "الخدمة غير مهيأة." }, 503);
      if (!originOK(req, url)) return reply({ error: "Origin not allowed" }, 403);
      if (url.pathname === "/api/register" && req.method === "POST") return await auth(req, env, url, true);
      if (url.pathname === "/api/login" && req.method === "POST") return await auth(req, env, url, false);
      if (url.pathname === "/api/logout" && req.method === "POST") {
        const token = getCookie(req, cookieName(url));
        if (token) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(b64(await digest(token))).run();
        return reply({ loggedOut: true }, 200, { "set-cookie": setCookie(url, "", 0) });
      }
      if (url.pathname === "/api/me" && req.method === "GET") {
        const user = await sessionUser(req, env);
        return user ? reply({ user: { username: user.username } }) : reply({ user: null }, 401);
      }
      if (url.pathname === "/api/progress") {
        const user = await sessionUser(req, env);
        if (!user) return reply({ error: "يلزم تسجيل الدخول." }, 401);
        return await handleProgress(req, env, user);
      }
      if (env.ASSETS) return secureResponse(await env.ASSETS.fetch(req));
      return reply({ error: "Not found" }, 404);
    } catch (e) {
      const m = String(e && e.message || "");
      if (m === "JSON_REQUIRED") return reply({ error: "يجب إرسال JSON." }, 415);
      if (m === "TOO_LARGE") return reply({ error: "حجم الطلب أكبر من المسموح." }, 413);
      if (m === "BAD_JSON") return reply({ error: "صيغة البيانات غير صحيحة." }, 400);
      return reply({ error: "حدث خطأ داخلي." }, 500);
    }
  }
};
