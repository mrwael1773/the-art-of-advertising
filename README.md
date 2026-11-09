# The Art of Advertising

An independent learning website for Unit 4 Reading: **The World of Plastic**.

## Project boundaries
- This repository is separate from English Hero and Cosmic Quest.
- Learning material is derived only from the supplied course PDF.
- Self-registration is open to everyone; the intended school audience is first-year secondary students at Gulf Secondary School.
- Each account must only access its own progress.
- No paid services, ads, analytics, or third-party AI features.

## Current implementation
- Responsive Arabic account interface in `public/`.
- Reading lesson with six paraphrased sections, paragraph and sentence speech, adjustable speed, stop control, linked Arabic translations, 43 vocabulary entries, and 15 activities (7 comprehension + 8 vocabulary).
- Cloudflare Worker API in `src/worker.js`.
- D1 schema in `migrations/0001_initial.sql`.
- Passwords use salted PBKDF2-HMAC-SHA-256 hashes.
- Session tokens are random, stored hashed in D1, and sent in HttpOnly, SameSite cookies (Secure on HTTPS).
- State-changing API requests require an exact same-origin `Origin` header; cross-site Fetch Metadata requests are rejected.
- Progress is scoped to the authenticated account and accepts only the expected bounded quiz record for this lesson.
- Expired sessions and stale rate-limit records are cleaned during authentication requests.

## Known source limitation
The earlier prepared ZIP is present in the user's Library, but the current environment does not authorize raw-byte extraction. The current frontend therefore reconstructs the required learning flow from the supplied PDF and the earlier requirements; it is not a byte-for-byte restoration of the ZIP.

## Local setup still required
1. Create a free Cloudflare D1 database.
2. Replace the placeholder `database_id` in `wrangler.toml`.
3. Apply the migration and run the Worker locally.
4. Test registration, login, logout, session expiry, rate limits, and cross-account isolation.
5. Test the interface and speech on the target browsers and iPhone devices.

No Cloudflare resource has been created or deployed.

## Verification status
- Twelve Node structural tests are present in `tests/validate.mjs`; the updated suite is awaiting a fresh GitHub Actions run.
- JavaScript syntax checks are configured in GitHub Actions; the prior run passed before the latest same-origin hardening change.
- SQLite schema and isolation test is present in `tests/check-schema.py`; the prior run passed before the latest same-origin hardening change.
- The latest changes require a fresh GitHub Actions run; earlier successful runs do not validate these commits.
- The quiz score is submitted by the browser and is not independently recalculated by the server; it must not be treated as verified mastery. Live D1, Cloudflare deployment, browser/device, and iPhone speech tests have not been run.
- This project is not ready for school use or production.
