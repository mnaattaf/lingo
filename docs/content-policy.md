# Child content policy

## Scope

Apply category, age-safety, educational-validity and skill-alignment checks to curriculum, explanations, examples, questions, tutor replies and visuals. Exclude pork/pig imagery, alcohol, recreational drugs, gambling, sexual/pornographic material, age-inappropriate romantic scenarios, scenarios conflicting with the application's defined Islamic relationship policy, hate and graphic violence. Treat all people respectfully; filtering a curriculum topic never permits insults or hostility.

Preferred contexts: school, family, friends, nature, science, permitted foods, responsibility, honesty, cleanliness, helping others and cooperation. The current seed uses these contexts, original artwork and simple positive examples.

## Gate

Generate → age check → category/rule check → educational validity → skill alignment → approve, quarantine or reject. Categories are structured decisions, not a keyword blacklist. Explicit policy or validity failure rejects. Missing category/semantic evidence or missing review quarantines as REVIEW_NEEDED. Fresh AIProvider output always has unknown semantic validations and remains quarantined. No automatic regeneration loop or live LLM is enabled in the MVP. Independent human review is the default route to approve future generated practice.

The startup core has a narrowly scoped trustedCoreReview path used only by the checked-in seed. The original AI-authored 40 questions were checked during this build for age safety, categories, correct answers and skill linkage, and receive APPROVED with an **automated** reviewer/audit rationale. They are not marked HUMAN_REVIEWED. This is not a substitute for independent educator and Islamic-content review before launch with real children. The runtime exposes no API that lets a visitor set trustedCoreReview, review assertions or question status.

## Administration foundation

ContentPolicyRule stores category/action/version/enabled metadata; ReviewStatus supports DRAFT, AI_GENERATED, REVIEW_NEEDED, HUMAN_REVIEWED, APPROVED and REJECTED. ContentReviewStatus stores item, reviewer, rationale and timestamp. Assets have their own approval status and may be attached to questions. Only approved questions and approved assets are selected. The current pure policy evaluator uses version-controlled category rules; database-backed policy administration, semantic classifier providers, admin review screens and versioned policy rollout remain future work.

Never interpret humanReviewed as an untrusted client assertion. The application currently has no content-authoring API. Before adding one, authorize reviewer identities, compute checks server-side, preserve provenance and enforce an auditable review transition. New text/visuals must not inherit an older item's approval blindly.
