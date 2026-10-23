# Architecture

## Data flow

Browser → same-origin validated API → authorization → transactional learning service → deterministic modules → Prisma JS adapter → PostgreSQL.

The UI displays returned decisions and feedback. It never supplies the correct answer, a mastery score, XP, a review date or a next question ID. The server sends only the current approved question's public fields; correct answers/explanations are returned after submission. The public curriculum endpoint contains skill labels and a question count, not answer keys.

Student knowledge, errors, behavior and motivational events are separate data. React has view/form/session presentation state; educational rules are under learning-engine. The DB skill graph is loaded at selection time, so approved questions and skills can be extended without recompiling the engine. Parent/child links are explicit foreign keys. Question/skill mappings are relational; MVP uses the first mapped skill as the primary measurement and reserves mapping weights for future multi-skill scoring.

## Transaction boundaries

Start and answer transactions lock the student row. An answer records scoring, probable errors, mastery/confidence, review queue and purposeful behavior event together. A compound unique answer key prevents retries from counting twice. Session completion locks the same student, creates one XP event per session, updates a local-date streak and upserts rewards. Duplicate completion returns existing results. Heartbeats lock the session, cap elapsed credit, and create disjoint active segments. A new session abandons an older active session; leaving a lesson sends an explicit abandonment request, with pagehide beacon as best effort.

Questions are assigned by server and timed from questionStartedAt. Feedback time is not question response time. A generated or rejected DB question never enters the approved question pool. Content-policy checks belong upstream of this approval boundary.

## Identity and access

A parent email and password hash are stored; the child uses nickname, age, broad grade and daily goal. No child email or full legal name is collected. Parent cookies carry parent scope. Entering a child profile replaces the session cookie with a linked student scope. Student requests must match that cookie's student ID and a current parent link. Parent-only reports require parent scope and linkage. Switching back from child mode requires the parent password. Every DB-bearing API request performs the applicable ownership checks before reading or writing.

JWT verification pins algorithm, issuer, audience and expiry. Cookies use HttpOnly, SameSite=Lax and Secure in production. Mutation origins are validated and cross-site Fetch Metadata is rejected. Credentials use bcrypt cost 12. Shared DB-backed per-email throttling is present. This is not a complete anti-abuse service; distributed IP/account creation controls, verified email, password reset, device session records and revocation are future work. The prototype admin enum is not an exposed admin backdoor.

## Persistence

Thirty-eight models and two initial migrations cover the requested domain plus authentication throttling. Review queue and mastery share composite student/skill keys. Questions and options are distinct. Historical student answers reference immutable question IDs: production editorial tooling should version rather than rewrite previously used questions. Seed currently upserts for development convenience; do not rerun edited seed as a production content-versioning strategy.

Weekly metrics are calculated from persisted sessions/answers on demand; weekly_student_metrics and student_learning_patterns are storage foundations, not a scheduled aggregation worker. Date buckets use Monday midnight in Africa/Cairo. Streaks use the profile's configured local calendar date. No parent-facing metric compares children.

## External boundaries

AIProvider is optional and disabled. Fresh generation is quarantined and cannot become a live question. PostgreSQL is required for learning persistence; there is no silent in-memory or localStorage replacement. Offline DB failures produce a visible recoverable UI error. Original SVG assets and fonts are served locally.

Deploy Next.js on Vercel or another Node host, PostgreSQL on a compatible provider, and configure exact APP_ORIGIN behind proxies. Hosting/production credentials have not been supplied. The private Sites/Worker deployment path was not used because it would change the requested runtime.
