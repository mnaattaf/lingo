# Runtime audit — 2026-10-23

The app and native local PostgreSQL were started and the existing UI was opened and exercised in Chromium. No CSS, layout, curriculum or product requirements were changed. No database migration was required.

## Reproduced faults and repairs

1. **Predictable correct-option position.** The seed puts the correct answer at index zero. The server now deterministically permutes presentation order per session and question, preserving all options, including repeated tokens, and stable order across retries. Scoring remains server-side and unchanged.
2. **Saved answer with lost HTTP response.** A retry previously returned 409 and left the learner unable to reach feedback. An identical replay now returns feedback and current progress without writing another answer, error, mastery update or review. A conflicting second answer still returns 409. A synchronous client request guard also prevents accidental overlapping actions.
3. **Completion save failure.** The end-of-session screen previously remained on a spinner after a failed request. Its error state now offers the existing primary-button style to retry saving. Both a failure before committing and a lost response after committing are browser-tested; XP remains a single event. Heartbeats stop once the end decision is reached, avoiding irrelevant inactive-session errors during a retry.
4. **Repeated word tokens.** Ordering previously used word strings as keys and hid all equal words when one was selected. Tokens now retain their individual option indices, so both occurrences can be selected and removed independently.
5. **Missing final active interval.** Sessions shorter than the first heartbeat, and the last partial heartbeat interval of longer sessions, could receive zero/incomplete active time. Completion and explicit abandonment now flush an eligible recent partial interval under the session lock. Long idle gaps are not filled in. Duplicate completion cannot add time twice.
6. **Missing browser favicon.** Added the existing sprout identity as a small local SVG favicon, eliminating the missing-resource request without changing screen design.

## Validation

- TypeScript: passed.
- ESLint: passed.
- Unit/authorization tests: 39 passed.
- Real PostgreSQL integration tests: 8 passed.
- Chromium end-to-end tests: 7 passed, covering normal journeys, privacy, mobile, error handling, lost answer responses, completion recovery on both sides of a commit, and repeated ordering tokens.
- Production build: passed.
- Guest navigation audit across all existing screens: no unhandled JavaScript errors. The only remaining error-status response is the expected 401 from `/api/me` before login; protected endpoints continue to enforce authentication.
- Existing responsive checks at 1440px and 390px pass without horizontal overflow.

The development server remains running on port 3000 with local PostgreSQL. This session exposes no tool for opening an embedded side-panel web preview or a forwarded public URL. Browser verification used local Chromium; no hosted-preview URL is claimed.
