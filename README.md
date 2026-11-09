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

## Local setup still required
1. Create a free Cloudflare D1 database.
2. Replace the placeholder `database_id` in `wrangler.toml`.
3. Apply the migration and run the Worker locally.
4. Test registration, login, logout, session expiry, rate limits, and cross-account isolation against a running Worker/D1 instance.
5. Test the interface and speech on the target browsers and iPhone devices.

No Cloudflare resource has been created or deployed.

## Verification status
- GitHub Actions runs **#110** (push) and **#111** (pull request) passed on commit `0ee4d25dabec6e07358e9ab3dc3d5e211bae0927`.
- At that verification point, the workflow passed JavaScript syntax checks, all **21 Node structural tests**, and the SQLite schema, account-isolation, and rate-limit SQL tests.
- The quiz answer-key alignment regression test was added and passed in GitHub Actions runs **#116** (push) and **#117** (pull request) on commit `73ec5d0b1040b5c6592eb91348f0c50f8a9b2d84`; the suite then contained **22 Node structural tests**.
- Browser security-header coverage was added and passed in GitHub Actions pull-request run **#122** on commit `0bbfbcd7b76bb3003ff9ccfc414ae30c39ed6310`; the suite now contains **23 Node structural tests**.
- These automated checks do not exercise the Worker against a live Cloudflare D1 database.
- Live registration, login, logout, session expiry, rate-limit behavior, and two-account isolation remain unverified.
- Real browser/device and iPhone speech testing, security penetration testing, teacher review, and supervised pilot testing remain outstanding.
- Server-side grading prevents a student-facing client from simply submitting a claimed score, but it does not establish educational mastery or prove the quiz's pedagogical validity.
- This project is **not ready for school use or production**.

Keep pull request #1 as a draft. Do not merge or deploy until outstanding verification is completed and explicitly approved.
