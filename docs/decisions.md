# Decisions

| Decision | Reason | Alternatives | Future implications |
| --- | --- | --- | --- |
| Keep the supplied `/workspace/lingo` repository | Inspection found only its README; no working code to replace | New unrelated project | This repository owns the runnable product |
| Next.js modular monolith with PostgreSQL/Prisma | Matches requested stack; transactions and explicit roles | Worker/D1, static browser-local demo | Native Vercel-compatible deployment; separate managed PostgreSQL |
| Implement locally rather than publish a different runtime | Sites runs Workers; no production PostgreSQL/hosting credentials supplied | Rewrite around D1 or static mocks | Hosted release is a separate deployment step |
| Prisma JS query compiler + pg adapter | Native Prisma engine downloads are blocked; NPM dependencies are reachable | Native query engine, a different ORM | Pinned Prisma versions; no runtime Rust engine required |
| Generator via pinned internal API; checked SQL runner | WASM parsing/generation works offline; PostgreSQL enforces actual schema | Pretend migrations succeeded, disable checks | Track internals API on upgrades; normal migrate deploy also available off this network |
| Optional native local PostgreSQL helper | Docker socket is unavailable; use real PostgreSQL without system changes | Docker, external DB, in-memory substitute | Development-only credentials/data; production uses DATABASE_URL |
| JOSE/bcrypt credentials foundation | Small explicit parent/child scope model, no mail provider | Auth.js/OIDC | Add verified email, reset/revocation and production abuse controls before real families |
| Child scope replaces parent cookie | Prevent accidental access to parent-only reports | UI-only parent toggle | Parent must re-enter password; tests check cross-account denial |
| Deterministic beta-style mastery and selection | Reproducible tests, conservative evidence | LLM decisions | Must calibrate with educators/data; provider-independent core |
| Live DB skill graph | Add skills without rebuilding selection algorithm | Hardcoded UI mastery tree | Root skill categories organize the live graph; extend editorial tooling |
| Five playable question modes, other evaluators disabled | Make a coherent functional learning core | Fake speech/listening scoring | Add dedicated scoring and consent for new modalities |
| Starter seed has automated review provenance | Do not fabricate human sign-off | Mark AI content human-reviewed | Independent review required before production |
| No live AI provider | Avoid unreviewed child-facing generated content and API keys | Client-side LLM requests | Approved corpus works without AI; future providers behind quarantine |
| Separate dev and production build directories | Concurrent dev/build initially clobbered Next's generated artifacts | Stop preview on every build | Prevents a tooling race without ignoring compiler errors |
| Cairo calendar for weeks and streaks | Matches client timezone | UTC week boundaries | Future per-profile timezone configuration needs consistent aggregation |
| Sparse-data metrics are null | Avoid unsupported conclusions | Invented percentages/sample activity | Parent sees evidence gaps; no causal or psychological labels |
