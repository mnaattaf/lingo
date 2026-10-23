export const engineConfig = {
 weights:{weakness:.35,reviewDue:.25,prerequisite:.15,difficultyFit:.15,variety:.1},
 sessionMix:{current:.6,remediation:.25,review:.15}, reviewDays:[1,3,7,14,30],
 minimumMasteryEvidence:8, rescueAfter:2, idleLimitMs:30_000, heartbeatLimitMs:15_000,
 minimumFocusAnswers:6, minimumPatternSessions:8, minimumPatternAnswers:30,
 maxSessionMinutes:25,
} as const;
