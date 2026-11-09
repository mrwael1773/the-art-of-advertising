# Authentication API (initial backend scaffold)

All routes are same-origin under `/api`. JSON request bodies are limited to 8 KiB.

## Routes
- `POST /api/register`: accepts `username` and `password`; creates an account and session.
- `POST /api/login`: verifies credentials and issues a session.
- `POST /api/logout`: revokes the current session and clears its cookie.
- `GET /api/me`: returns the signed-in username, or HTTP 401.
- `GET /api/progress`: returns only progress rows belonging to the signed-in account.
- `PUT /api/progress`: accepts `lessonKey` and a JSON `progress` object; ownership is taken from the session, never from the request body.

## Current validation
- Usernames: 3–24 lowercase English letters, digits, or underscores.
- Passwords at registration: 10–128 characters.
- Registration throttling: 5 attempts per IP per hour.
- Login throttling: 8 attempts per IP+username per 15 minutes.
- Password KDF: PBKDF2-HMAC-SHA-256, 310,000 iterations, unique 16-byte salt.
- Session: 256-bit random token; only SHA-256 token hash is stored; 7-day expiry.

## Before deployment
- Configure D1 and apply the migration.
- Add a scheduled cleanup for expired sessions and old rate-limit rows.
- Test against real Cloudflare D1 and at least two independent accounts.
- Review the exact frontend origin and API integration.
- Add account recovery only if a safe recovery channel is deliberately selected.

The API is a scaffold, not a claim of production readiness. Do not expose it to students until the outstanding tests are complete.
