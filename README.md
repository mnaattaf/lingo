# نبتة — Nabta English

Arabic-first adaptive English learning for children. This repository contains a working modular monolith, not a screen-only demo: approved curriculum, authenticated parent/child scopes, PostgreSQL answer persistence, deterministic learning decisions, spaced reviews, behavior metrics and parent reports.

## Quick start

Node.js **22.12+** (tested on 24), npm and PostgreSQL 17+ recommended. No AI key is needed. From the repository root:

```bash
npm ci
cp .env.example .env
# Edit AUTH_SECRET in .env: use at least 32 random characters.
# You can generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
npm run db:generate
```

Use an existing PostgreSQL database by editing DATABASE_URL, or run the optional development-only database in a separate terminal:

```bash
npm run db:local
```

This starts the bundled native PostgreSQL distribution on loopback, port 5432, creates database `bloom`, and stores development data in ignored `work/postgres`. The helper uses development-only `bloom:bloom` credentials. Run as a regular user; PostgreSQL refuses root. Alternatively, `docker compose up -d db` starts PostgreSQL when Docker is available. Do not run both on the same port.

Then:

```bash
npm run db:apply
npm run db:seed
npm run dev
```

Open **http://localhost:3000**. Choose **ابدأ رحلتك**, register a parent with a password of at least ten characters, create a child nickname/profile, and complete the eight-question initial assessment. Then complete a six-question lesson. No default passwords or pre-created child accounts exist.

To view parent reports from child mode, select **مساحة وليّ الأمر** and sign in again with the parent credentials. A parent can create up to five child profiles and choose a profile. Child mode cannot read parent-only endpoints or switch children.

## Stack and structure

- Next.js 15 App Router, React 19, strict TypeScript, Tailwind 4 and an original CSS visual system.
- PostgreSQL, Prisma 6.19 **JS query compiler** and `@prisma/adapter-pg`.
- Signed eight-hour HttpOnly, SameSite cookies using JOSE, bcrypt password hashes, Zod server validation. This is a minimal credentials equivalent to Auth.js, with explicit scope switching; see limitations below.
- Vitest unit/database tests and Playwright browser tests.
- Locally served Arabic font, original panda SVG and original educational SVG assets. No third-party application branding or proprietary curriculum.

```text
src/app/                  web shell and validated API boundary
src/components/           Arabic student and parent experience
src/learning-engine/      independent deterministic subsystems
src/content-policy/       category/rule review gate
src/ai/                   disabled provider and quarantine pipeline
src/db/                   Prisma client and original seed curriculum
src/lib/                  authentication, authorization, transactional orchestration
src/tests/                unit and real PostgreSQL integration tests
e2e/                      complete browser journeys
prisma/                   relational schema, SQL migrations, idempotent seed
docs/                     architecture, algorithms, policy, decisions, report
```

## Environment

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string. Add provider-specific TLS requirements for Neon/Supabase. Never expose to the browser. |
| `AUTH_SECRET` | At least 32 random characters for signed session cookies. Rotate to invalidate all sessions. |
| `APP_ORIGIN` | Optional locally; set to the exact HTTPS application origin in production to validate mutations behind a proxy. |
| `CHROMIUM_PATH` | Browser-test executable; defaults to `/usr/bin/chromium` in this environment. |

No API secrets are used in client code. `.env`, database files, generated clients and test artifacts are excluded from Git. The example password is only for a loopback development database, never production.

## Database and migrations

`prisma/schema.prisma` defines 38 related models including parents/students, hierarchical skills and errors, question metadata, curriculum, mastery/confidence, review queue, sessions/answers, active activity segments, focus, interventions/results, weekly metrics/patterns, self-reports, goals and rewards, visual assets and policy audits. The SQL migrations include foreign keys, compound uniqueness, indexes and checks on ages, counters, probability ranges and timing.

`npm run db:apply` is a small PostgreSQL migration runner for checked-in SQL: advisory lock, transactional application, SHA-256 checksums and Prisma-compatible migration history. It refuses changed applied migrations. This was used because this environment blocks Prisma's Rust engine download host. On an unrestricted machine, the normal `npm run db:migrate` (`prisma migrate deploy`) is also available. Normal Prisma migration CLI execution was **not** validated here.

`npm run db:generate` uses Prisma's pinned generator API and WASM schema parser without downloading unused native query engines. Restart the Next.js server after schema/client generation; hot reload does not reliably replace a cached Prisma instance. Production requires no runtime dependency on the generator.

`npm run db:seed` upserts 22 skills, 40 original approved starter questions, six lessons, taxonomy, characters, badges and category rules. Running it twice does not duplicate questions/options. Seed approvals are initial automated editorial checks, **not independent human curriculum certification**. Audit history describes this explicitly; obtain educator and policy review before production.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration  # .env and a migrated, seeded PostgreSQL database required
npm run test:e2e          # .env, PostgreSQL and Chromium required; starts/reuses dev server
npm run build
npm start
```

Integration and browser tests create their own test-family accounts and delete them afterward. Do not target a production database. For another OS, set CHROMIUM_PATH or edit Playwright launchOptions to use an installed Playwright Chromium browser. Unit tests need no database. Build does not query the database. `.next-dev` and `.next` are separate to prevent preview/build artifact races.

## Implemented experience

- Welcome/dashboard, parent registration/login, child onboarding, initial placement, visible path, original short lessons, five playable question renderers (multiple choice, image choice, blank, ordering and reading), feedback and completion.
- Server-side answer scoring and rule-based probable error labels, mastery/confidence evidence, review dates, configurable next best action, rescue explanations/examples and reset support.
- Review entry, skill map, weekly comparison, parent report, XP/streaks, earned badges/characters, personal best active-learning week, settings and optional distraction self-report.
- Active heartbeat/idle handling, abandonment, focus indicators with evidence thresholds, and intervention before/after records.
- Structured support for additional question modalities, goals, patterns, policy administration and AI providers. These structures are not advertised as implemented learning activities.

## Deployment

The application is **Vercel-compatible**, with a separate PostgreSQL service. It has not been published to a hosting account. Configure DATABASE_URL, AUTH_SECRET and APP_ORIGIN as server secrets. Run migrations and seed once using a controlled release job, then build with `npm run db:generate && npm run build`. The app has no dependency on a running development database helper in production. For a hosted pooler, follow that provider's Prisma transaction/pooling and TLS guidance. Back up and test restore before collecting real child data.

The Sites hosting runtime uses Cloudflare Workers and is not the requested native Next.js/PostgreSQL deployment. No alternate mock or client-local persistence was substituted to obtain a hosted link.

## Current limits / next milestone

This is an engineering MVP foundation, **not the complete production product**. Before real family use: independent educational/policy validation of seed and visuals, password recovery and verified parent email, session revocation/logout across devices, formal market-specific parental consent, data export/deletion/retention automation, security review and production hosting. No email is sent. The code does not implement a full consent or age-verification system.

Listening, dictation, matching, open-ended writing and speech are modeled but disabled. AI tutoring is disabled; fresh AI content stays in review. No psychological diagnoses, public leaderboards, surveillance or causal distraction claims exist. Focus and optimal-duration algorithms are preliminary, with minimum evidence rules. Age is collected but the initial curriculum is not yet age-stratified. The initial assessment is an eight-answer sample, not a validated CEFR placement test. Skills without evidence display no data, not inferred competence. The next recommended milestone is educator-calibrated curriculum expansion, stronger session/recovery behavior, and production identity/consent hardening.

See [architecture](docs/architecture.md), [learning engine](docs/learning-engine.md), [content policy](docs/content-policy.md), [decisions](docs/decisions.md) and [engineering report](docs/engineering-report.md).
