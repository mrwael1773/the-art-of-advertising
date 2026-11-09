# The Art of Advertising

An independent learning website for the Unit 4 Reading passage **The World of Plastic**.

## Project boundaries
- This repository is separate from English Hero and Cosmic Quest.
- Learning content must come only from the supplied course PDF.
- Public self-registration is allowed; the intended school audience is first-year secondary students at Gulf Secondary School, but registration is not restricted to that school.
- Each account must only access its own progress.
- No paid services, advertising, analytics, or third-party AI features.

## Planned architecture
- Static frontend.
- Cloudflare Worker for authentication and progress APIs.
- Cloudflare D1 for account, session, and progress records.
- Passwords are stored only as salted password hashes; sessions use secure, HttpOnly cookies.
- The browser must never receive administrative secrets.

## Safety and deployment
- Do not deploy or configure production resources without explicit deployment approval.
- Do not put secrets in client-side files.
- Do not claim school readiness until authentication, authorization, data isolation, content, audio, and target-device tests have passed.

## Current status
Repository foundation only. Application files and Cloudflare resources have not yet been deployed.
