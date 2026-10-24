# Lingo learning upgrade — 2026-10-24

## Audit before changes

The existing Next.js 15 / React 19 modular monolith uses a same-origin API, JOSE parent/child cookies, bcrypt, Prisma's JS compiler and PostgreSQL. The Prisma schema already includes User, ParentStudentLink, StudentProfile, Skill/SkillPrerequisite, Lesson, Question/QuestionOption, LearningSession/StudentAnswer, StudentError, StudentSkillMastery and ReviewQueue. There is no need to replace authentication or add a second progress system.

Production Neon was inspected read-only: 40 questions, 22 skills and two completed migrations. Previous Vercel inspection confirmed production deployment f8a6187c, DATABASE_URL/AUTH_SECRET presence and canonical APP_ORIGIN. No secrets were printed. A fresh production GET returned HTTP 200 using supported executor network permission while retaining the configured proxy.

Existing strengths: transactional answers and rewards, retry idempotency, prerequisite gating, conservative mastery/confidence, staged spaced review, remediation, parent/child authorization, content approval filtering and tests. Limitations: small catalog, deterministic repeated choices across sessions, whole-catalog loading when scoring, no success audio, and auth fields without stable IDs. Native Samsung Password Manager behavior cannot be proven from Chromium automation.

## Implemented

- Native uncontrolled auth inputs with stable IDs, separate keyed registration/login forms, POST form semantics, `username` autocomplete for the email account identifier, and `new-password`/`current-password` for passwords. Browser-managed values are read using FormData, including when no input event fires. No credential logging or analytics added.
- Optional short synthesized success sound, unlocked from a user gesture. Off initially, with a local device preference and controls on the dashboard and lesson. Audio failures never fail an answer. No audio downloads or microphone access.
- Lightweight original success animation, clear visual status, screen-reader announcement and reduced-motion support.
- Cross-session recent-question avoidance inside the existing educational selection bucket; due review stays available when all alternatives have been seen.
- Bounded candidate loading (up to 24 fresh candidates per skill, with a seen-question fallback and current-session history) rather than materializing the entire approved catalog. Answer submission fetches just its assigned question. Existing prerequisites, rescue and review rules are retained.
- Versioned deterministic reading template catalog: 1,920 unique question prompts, closed vocabulary, stable IDs, bounded export pages and JSONL output. All generated records are REVIEW_NEEDED. No auto-approval or production writes.

## Content workflow and limits

Run `node --import tsx scripts/export-variants.ts > work/reading-variants.jsonl` to prepare the editorial artifact. Review vocabulary, grammar, skill alignment, ages, distractors and the project's Islamic content requirements before importing approved items using immutable versioned IDs. Existing answered questions must not be overwritten. The current closed vocabulary concerns ordinary classroom objects and colours; this is not a claim of independent religious or educational certification.

This is a foundation for extensible templates, not 100,000 finished exercises. Only reading templates are added in this batch, and the live bank remains 40 until new content is reviewed and imported. Do not inflate counts by counting shuffled options as new exercises. Future expansion requires additional reviewed skill-specific templates, an editorial import/review UI, catalog pagination/index load testing, and incremental reporting aggregates. Dashboard history is still calculated from stored answers, and this work does not establish 100k-student capacity.

No schema migration, production reset, data deletion, auth replacement or Neon configuration change was needed. No production account was created for automated testing.

## Verification

- Unit tests: 43 passed, including all 1,920 variants, pagination, uniqueness, valid answers and review quarantine.
- Local PostgreSQL integration: 8 passed (transactions, review/mastery, constraints and retry idempotency).
- Chromium browser tests: 9 passed, including mobile native autofill simulation, sound preference persistence, complete registration/onboarding/placement/lesson/parent-report journey, mobile overflow and network recovery.
- Final TypeScript, ESLint, unit tests and PostgreSQL integration tests passed after the candidate-query change.
- Optimized production build passed; initial route JavaScript reported as 128 kB. This is not a measured Android performance benchmark.

Manual device acceptance: on Samsung/Android Chrome choose a suggested strong password, confirm the masked field fills, create a test parent, log out and sign in with the saved credential. Enable sound in a lesson and submit a correct answer. Confirm the short sound and visual feedback, then disable sound and repeat. With reduced-motion enabled, confirm no success animation. Chromium tests cannot select an actual Samsung password suggestion.
