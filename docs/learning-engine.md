# Learning engine v1

## What does the child know?

Each student/skill stores a conservative mastery probability and a separate evidence-confidence estimate. Mastery uses a six-observation prior and accumulates fractional credit: unhinted plausible correct responses earn 1, hinted answers .55, extremely rapid correct answers .35, incorrect/skip 0. The posterior carries prior fractional credit forward. Correct/incorrect counters remain factual counts. Confidence grows independently with observation quality, to a cap below one. An evidence gate requires at least eight attempts, confidence .6 and the skill's mastery threshold before unlocking prerequisites. A single correct answer never implies mastery.

These numerical priors are initial engineering choices, not psychometrically validated estimates. Future calibration should use held-out retention observations and expert judgment.

## What does the child misunderstand?

Options may reference a probable hierarchical error, such as grammar → verb → present simple → third person → missing s. A mapped distractor provides stronger evidence than an inferred general tag. Error records store probability and evidence. Three related errors can add a probable repeated-pattern label. No rule labels a one-off answer as careless. Feedback includes correctness, answer, short Arabic explanation, possible cause and a distinct example. Blank/ordering scoring normalizes whitespace, case and simple punctuation. Nontrivial speech/writing evaluators are explicitly disabled.

## What next?

Selection is deterministic; ties break by question ID. Defaults in config.ts: weakness .35, review due .25, prerequisite importance .15, difficulty fit .15, variety .10. A weighted-deficit twenty-slot cadence targets 60/25/15 current/weakness/review, and interleaves all three purposes within short sessions, with fallback when eligible content is insufficient. Short lessons may not achieve the long-run mix exactly. Lesson skill is preferred for its initial current-level segment; prerequisites and answered IDs are always respected. Placement may sample prerequisites without unlocking them.

Supported actions: new, review, easier, harder, micro explanation, worked example, visual, type change, reset and end. These are action decisions rather than just question IDs. Due reviews use actual queue dates. Exhausted pools end safely. No answered item repeats within a session.

After two consecutive failures in the same skill: explanation → worked example → easier related question → successful attempt resets the rescue state. The finite seed pool can limit remedial variety; broadening this pool is a priority before production. Parents can select lessons but cannot bypass prerequisite gates. The initial eight-question assessment builds estimates only for sampled skills, not a global CEFR label.

## Retention

Initial intervals: 1, 3, 7, 14, 30 days. Only an actual due, successful review advances its interval; rehearsing early does not. A failure resets the review to one day. RetentionEstimate is separate from mastery and decreases after failure. This is a deterministic starting schedule, not a fitted forgetting curve.

## How is learning going in this session?

Session duration is wall time; active learning is sum of visible, recently interactive heartbeat segments. Client heartbeat every ten seconds, server credit at most fifteen seconds, input freshness thirty seconds. Hidden/idle segments receive zero. This is a conservative behavioral estimate, not attention surveillance. Timing starts on server assignment. Browser closure tracking is best effort, with next-session abandonment recovery.

Focus requires six answers. It considers active ratio, first-half versus later accuracy/time and unusually rapid answers. It reports performance indicators, not ADHD, anxiety, laziness or a psychological diagnosis. A deterioration decision can suggest a short reset. Intervention logs retain type, reason, recent accuracy/response-time evidence and the next observed response. Result labels describe the next attempt; they do not claim the intervention caused improvement. Visual activity support depends on available assets and does not create a permanent visual-learner label.

Optimal-duration analysis requires eight sessions and thirty answers, and at least three observations within a bucket before reporting that bucket. The pure algorithm is provided; automated longitudinal pattern materialization and parent session-duration recommendations are not yet enabled.

## Weekly progress and motivation

Monday-based Cairo-week buckets calculate active minutes, session count, completed lessons, questions, accuracy, completion and review success. Both absolute values and changes are provided; no-data ratios are null. Per-skill mastery changes are reconstructed from chronological answers at the start-of-week boundary, not guessed from present mastery. Focus is displayed only with eligible session evidence. XP rewards correct answers and an accuracy bonus, never time on screen. Streaks use local calendar days, are idempotent within a day, and reset after missed days. Earned badges/characters and best active week use actual records. Weekly missions UI currently represents completing appropriate learning; mastery-target WeeklyGoal persistence is a future foundation.
