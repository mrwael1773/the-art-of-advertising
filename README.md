# The Art of Advertising

An independent learning website for Unit 4 Reading: **The World of Plastic**.

## Project boundaries
- This repository is separate from English Hero and Cosmic Quest.
- Learning material is based only on the supplied course PDF and paraphrased for learners.
- Self-registration is open to everyone; the intended school audience is first-year secondary students at Gulf Secondary School.
- Each account must only access its own progress.
- No paid services, ads, analytics, or third-party AI features.

## Current implementation
- Responsive Arabic account interface in `public/`.
- Reading lesson with six paraphrased sections, paragraph and sentence speech, adjustable speed, stop control, Arabic translations, 43 vocabulary entries, and 15 activities (7 comprehension + 8 vocabulary).
- Cloudflare Worker API in `src/worker.js`.
- D1 schema in `migrations/0001_initial.sql`.
- Passwords use salted PBKDF2-HMAC-SHA-256 hashes.
- Random session tokens are stored as hashes in D1 and sent in HttpOnly, SameSite cookies (Secure on HTTPS).
- JSON API request bodies are streamed and capped at 8 KiB before full buffering. State-changing API requests require an exact same-origin `Origin` header; cross-site Fetch Metadata requests are rejected. API and static asset responses also receive `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and `Cross-Origin-Resource-Policy: same-origin`.
- Login attempts are throttled per IP and per username; registration attempts are throttled per IP.
- Quiz answers are graded by the Worker against a server-side answer key that is not included in student-facing JavaScript. Results are stored against the authenticated account.

## Source limitation
The previously prepared ZIP is listed in the user's Library, but its raw bytes could not be accessed in the current environment. The current frontend was reconstructed from the supplied PDF and available requirements; it has not been verified as a byte-for-byte restoration of that ZIP.

## Automated local verification
- Run `node tests/d1-integration.mjs` to start the Worker with Wrangler and an isolated local D1 database.
- `wrangler.test.toml` is a test-only configuration with a placeholder local database ID; it does not change `wrangler.toml`.
- The integration test applies the checked-in migration to a fresh temporary local D1 store, then exercises registration, case-insensitive username uniqueness, login, same-origin enforcement, progress persistence, account isolation, invalid progress rejection, logout, expired-session rejection, and login throttling through real HTTP requests to the Worker. The expiry case updates only the disposable local test database; the throttling case confirms that eight failures are followed by HTTP 429 for the same IP+username.
- The test pins Wrangler **4.159.0** and explicitly passes `--local` for D1 migration and Worker execution. It requires Node.js/npm and network access to download Wrangler on first use, but does not require a Cloudflare login, API token, paid service, or production resource.
- GitHub Actions runs this local D1 integration test on every push to `feature/student-auth` and pull request targeting `main`.

## Production configuration still required
1. Only after explicit approval, create a free Cloudflare D1 database.
2. Replace the placeholder `database_id` in `wrangler.toml` with the real database ID.
3. Apply the migration to the approved database and configure the Worker for deployment.
4. After publication is explicitly approved, test real account flows, session expiry, rate limits, account isolation, browsers, and target devices.

No Cloudflare production resource has been created or deployed.

## Verification status
- GitHub Actions **#155** (push) and **#156** (pull request) passed on commit **`e28b04dd3a0c25e30ba19d2c7b9a29c4ec06d835`**.
- Both runs passed JavaScript syntax checks, all **23 Node structural tests**, the mocked Worker lifecycle tests, the real Worker + isolated local D1 HTTP integration test, and the SQLite schema/isolation checks.
- The local D1 integration test verified registration, case-insensitive username uniqueness, wrong-password rejection, valid login, same-origin enforcement, server-side progress scoring and persistence, cross-account progress isolation, invalid-answer rejection, logout revocation, expired-session rejection, and the per-IP+username login threshold (eight failed attempts followed by HTTP 429).
- The mocked Worker tests also cover session cookie properties; the SQLite checks exercise the schema, foreign-key cascades, and rate-limit SQL. The D1-backed Worker tests use a separate fresh temporary database and do not modify production data.
- Local D1 tests use Cloudflare's local simulator/runtime, not a live remote Cloudflare D1 database. They materially improve API/database coverage but do not replace production verification.
- Real browser/device and iPhone speech testing, live Cloudflare account flows, production session-expiry and rate-limit checks, security penetration testing, teacher review, and supervised pilot testing remain outstanding.
- Server-side grading prevents a student-facing client from simply submitting a claimed score, but it does not establish educational mastery or prove the quiz's pedagogical validity.
- This project is **not ready for school use or production**.

Keep pull request #1 as a draft. Do not merge or deploy until outstanding verification is completed and explicitly approved.
