# The Art of Advertising

An independent learning website for the Unit 4 Reading passage **The World of Plastic**.

## Project boundaries
- This repository is separate from English Hero and Cosmic Quest.
- Learning content must come only from the supplied course PDF.
- Public self-registration is allowed. The intended educational audience is first-year secondary students at Gulf Secondary School, but registration is open to everyone.
- Each account must only access its own progress.
- No paid services, advertising, analytics, or third-party AI features.

## Architecture
- A responsive Arabic registration/login shell in `public/`; the original lesson interface still needs to be restored from the prepared ZIP.
- Cloudflare Worker API in `src/worker.js`.
- Cloudflare D1 schema in `migrations/0001_initial.sql`.
- Passwords are stored as salted PBKDF2-HMAC-SHA-256 hashes.
- Session tokens are random, stored hashed in D1, and sent in HttpOnly, SameSite cookies (Secure on HTTPS).
- Progress queries are scoped to the authenticated session's user ID; clients cannot choose another user's ID.

## Local setup still required
1. Create a free Cloudflare D1 database.
2. Replace the placeholder `database_id` in `wrangler.toml`.
3. Apply migrations with Wrangler.
4. Run the Worker locally and test registration, login, logout, and cross-account isolation.
5. Restore and connect the frontend from the prepared project archive.

No Cloudflare resource has been created or deployed by this repository setup.

## Verification status
- Worker and account UI JavaScript syntax checks: passed locally.
- Six structural security checks are included in `tests/validate.mjs`.
- D1 migration schema creation: passed locally with SQLite.
- Browser, live D1, Cloudflare deployment, audio, and iPhone tests: not run.
- This project is not ready for school use or production.
