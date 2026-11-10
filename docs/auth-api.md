# Authentication API

All API routes are same-origin under `/api`. Mutating JSON routes require the exact `application/json` media type (optional parameters such as `charset=utf-8` are accepted); JSONP and other lookalike media types are rejected. JSON request bodies are streamed and capped at 8 KiB. State-changing requests require an exact same-origin `Origin` header; requests marked as cross-site by Fetch Metadata are rejected.

## Routes

- `POST /api/register`: accepts `username` and `password`; creates an account and issues a session.
- `POST /api/login`: verifies credentials and issues a session. Unknown usernames and incorrect passwords receive the same login error.
- `POST /api/logout`: revokes the current session token, if present, and clears the cookie.
- `GET /api/me`: returns the signed-in username, or HTTP 401 when no valid session exists.
- `GET /api/progress`: returns only progress rows belonging to the authenticated account.
- `PUT /api/progress`: accepts `lessonKey` and an `answers` array for the fixed reading quiz. The Worker validates the lesson key and all 15 answer indices, grades against its private answer key, and stores the calculated result under the authenticated account. The client cannot submit a claimed score or user ID.

## Authentication and limits

- Usernames are trimmed, lowercased, and limited to 3–24 English letters, digits, or underscores.
- Registration passwords must be 10–128 characters; login rejects passwords longer than 128 characters.
- Registration throttling: 5 attempts per IP per hour.
- Login throttling: 30 attempts per IP per 15 minutes, plus 8 attempts per IP+username per 15 minutes.
- Password KDF: PBKDF2-HMAC-SHA-256, 310,000 iterations, unique 16-byte salt.
- Session: 256-bit random token; only its SHA-256 hash is stored; 7-day expiry.
- Session cookies are HttpOnly and SameSite=Lax; Secure is added on HTTPS.
- Private API responses use `Cache-Control: no-store`.

Expired sessions and old rate-limit records are cleaned during authentication requests, after the request passes its rate-limit check.

## Before deployment

- Configure a real D1 database and apply the migration.
- Test registration, login, logout, session expiry, rate limiting, malformed/oversized bodies, and two-account isolation against a running Worker and D1.
- Review the exact frontend origin and API integration.
- Add account recovery only if a safe recovery channel is deliberately selected.

This API is not production-ready until the outstanding live tests and security review are complete. Do not expose it to students before then.
