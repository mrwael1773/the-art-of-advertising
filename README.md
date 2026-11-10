# The Art of Advertising

An independent learning website for Unit 4 Reading.

## Project boundaries
- This repository is separate from English Hero and Cosmic Quest.
- Learning material must remain based only on the supplied course PDF.
- No student accounts, usernames, passwords, cloud progress database, paid services, ads, analytics, or third-party AI features.
- Student progress is stored locally in the browser on the student's device.

## Current implementation
- Responsive Arabic RTL learning page in `public/`.
- Reading lesson, sentence and paragraph speech, adjustable speed, Arabic translations, vocabulary, and quiz activities.
- Quiz results are stored in browser `localStorage` under a versioned application key.
- No progress API or student identity is sent to the Worker.
- Cloudflare Worker serves static assets and applies browser security headers.
- `wrangler.toml` has no D1 binding or database ID.

## Local progress and privacy
- Progress remains available on the same device, browser, and site origin.
- Different browsers or separate browser profiles keep separate local progress stores.
- Clearing site data, using private browsing, changing device/browser, or resetting the browser can remove or hide saved progress.
- A shared browser profile is not a secure boundary between students. For a shared school computer, each student must use a separate OS/browser profile; do not use one shared browser profile for multiple students.
- Because there is no account or cloud backup, progress does not synchronize between devices and cannot be recovered by a teacher or administrator.
- The app stores only lesson scores, completion state, and selected answers; it does not collect a student name, username, password, email, or other identity field.

## Verification
- Run `node --test tests/validate.mjs` for local storage behavior, reload persistence, invalid-record rejection, and static security/configuration checks.
- Run `node tests/browser-smoke.mjs` for local Worker, Chromium, responsive layout, accessibility, quiz save/reload, and browser-profile isolation checks.
- Browser tests require Node.js/npm, network access to download the pinned Wrangler/Playwright packages on first use, and Chromium.
- These automated checks do not replace testing on the actual student devices and browsers, iPhone speech testing, teacher review, or a supervised school pilot.

## Deployment
- The Worker serves static assets only. It does not require a D1 database, account system, or production database migration.
- Publishing still requires an explicitly approved deployment and verification of the live site.
- This branch is not merged or deployed. Do not describe the site as school-ready until the real-device, accessibility, speech, privacy, and teacher/pilot checks are complete.
