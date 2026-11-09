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
- Quiz answers are graded by the Worker against a server-side answer key that is not included in the student-facing JavaScript; saved results are scoped to the authenticated account.
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
- Fifteen Node structural tests are present in `tests/validate.mjs`. The previous 12-test suite passed in GitHub Actions run #49; the three newly added authentication lifecycle checks are awaiting their own CI result.
- JavaScript syntax checks are configured in GitHub Actions; run #49 passed before the three latest test additions.
- SQLite schema and isolation test is present in `tests/check-schema.py`; run #49 passed.
- The latest authentication lifecycle test additions require a fresh GitHub Actions run; earlier successful runs do not validate these new tests.
- Server-side grading protects the score from client-side score forgery, but the quiz's pedagogical validity and the student's actual understanding still require teacher review and pilot testing. Live D1, Cloudflare deployment, browser/device, and iPhone speech tests have not been run.
- This project is not ready for school use or production.
