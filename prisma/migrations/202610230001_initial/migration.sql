-- Initial PostgreSQL migration. Generated from Prisma DMMF and reviewed against schema.prisma.

CREATE TYPE "Role" AS ENUM ('PARENT', 'STUDENT', 'ADMIN');

CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'FILL_BLANK', 'WORD_ORDER', 'MATCHING', 'IMAGE_SELECTION', 'TRANSLATION', 'ERROR_CORRECTION', 'LISTENING', 'DICTATION', 'READING', 'SPEAKING', 'WRITING');

CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'AI_GENERATED', 'REVIEW_NEEDED', 'HUMAN_REVIEWED', 'APPROVED', 'REJECTED');

CREATE TYPE "SessionKind" AS ENUM ('PLACEMENT', 'LESSON', 'REVIEW');

CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ABANDONED');

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'PARENT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

CREATE TABLE "StudentProfile" (
  "id" TEXT NOT NULL,
  "userId" TEXT,
  "nickname" TEXT NOT NULL,
  "age" INTEGER NOT NULL,
  "grade" TEXT NOT NULL,
  "goalMinutes" INTEGER NOT NULL DEFAULT 10,
  "timezone" TEXT NOT NULL DEFAULT 'Africa/Cairo',
  "placementCompleted" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile" ("userId");

CREATE TABLE "ParentStudentLink" (
  "parentId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ParentStudentLink_pkey" PRIMARY KEY ("parentId", "studentId")
);

CREATE TABLE "Course" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Unit" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "Unit_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Unit_courseId_position_key" ON "Unit" ("courseId", "position");

CREATE TABLE "Lesson" (
  "id" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "skillId" TEXT NOT NULL,
  CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Lesson_unitId_position_key" ON "Lesson" ("unitId", "position");

CREATE TABLE "Skill" (
  "id" TEXT NOT NULL,
  "parentId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "objectives" TEXT[] NOT NULL,
  "difficulty" INTEGER NOT NULL,
  "cefr" TEXT NOT NULL,
  "masteryThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.8,
  CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SkillPrerequisite" (
  "skillId" TEXT NOT NULL,
  "prerequisiteId" TEXT NOT NULL,
  CONSTRAINT "SkillPrerequisite_pkey" PRIMARY KEY ("skillId", "prerequisiteId")
);

CREATE TABLE "Question" (
  "id" TEXT NOT NULL,
  "type" "QuestionType" NOT NULL,
  "prompt" TEXT NOT NULL,
  "instruction" TEXT NOT NULL,
  "correctAnswer" TEXT NOT NULL,
  "explanation" TEXT NOT NULL,
  "example" TEXT NOT NULL,
  "difficulty" INTEGER NOT NULL,
  "cefr" TEXT NOT NULL,
  "vocabularyLevel" TEXT NOT NULL,
  "estimatedTime" INTEGER NOT NULL,
  "errorTags" TEXT[] NOT NULL,
  "prerequisites" TEXT[] NOT NULL,
  "subskillId" TEXT,
  "contentStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionOption" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "errorTypeId" TEXT,
  CONSTRAINT "QuestionOption_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuestionOption_questionId_position_key" ON "QuestionOption" ("questionId", "position");

CREATE TABLE "QuestionSkillMap" (
  "questionId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "weight" DOUBLE PRECISION NOT NULL DEFAULT 1,
  CONSTRAINT "QuestionSkillMap_pkey" PRIMARY KEY ("questionId", "skillId")
);

CREATE TABLE "LearningSession" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "lessonId" TEXT,
  "kind" "SessionKind" NOT NULL,
  "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "endedAt" TIMESTAMP(3),
  "activeMs" INTEGER NOT NULL DEFAULT 0,
  "lastHeartbeatAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentQuestionId" TEXT,
  "targetCount" INTEGER NOT NULL DEFAULT 6,
  "rescueStage" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentAnswer" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "correct" BOOLEAN NOT NULL,
  "responseMs" INTEGER NOT NULL,
  "hintsUsed" INTEGER NOT NULL DEFAULT 0,
  "skipped" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentAnswer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentAnswer_sessionId_questionId_key" ON "StudentAnswer" ("sessionId", "questionId");

CREATE TABLE "StudentSkillMastery" (
  "studentId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "masteryScore" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "correctAttempts" INTEGER NOT NULL DEFAULT 0,
  "incorrectAttempts" INTEGER NOT NULL DEFAULT 0,
  "averageResponseTime" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "lastAttemptAt" TIMESTAMP(3),
  "lastCorrectAt" TIMESTAMP(3),
  "retentionEstimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewDueAt" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentSkillMastery_pkey" PRIMARY KEY ("studentId", "skillId")
);

CREATE TABLE "ErrorType" (
  "id" TEXT NOT NULL,
  "parentId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  CONSTRAINT "ErrorType_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentError" (
  "id" TEXT NOT NULL,
  "answerId" TEXT NOT NULL,
  "errorTypeId" TEXT NOT NULL,
  "probability" DOUBLE PRECISION NOT NULL,
  "evidence" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentError_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewQueue" (
  "studentId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "stage" INTEGER NOT NULL DEFAULT 0,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "lastResult" BOOLEAN,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReviewQueue_pkey" PRIMARY KEY ("studentId", "skillId")
);

CREATE TABLE "LearningBehaviorEvent" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LearningBehaviorEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SessionActivity" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL,
  "endedAt" TIMESTAMP(3) NOT NULL,
  "activeMs" INTEGER NOT NULL,
  CONSTRAINT "SessionActivity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FocusMetric" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "score" DOUBLE PRECISION,
  "evidenceCount" INTEGER NOT NULL,
  "indicators" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FocusMetric_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeeklyStudentMetric" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "metrics" JSONB NOT NULL,
  CONSTRAINT "WeeklyStudentMetric_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeeklyStudentMetric_studentId_weekStart_key" ON "WeeklyStudentMetric" ("studentId", "weekStart");

CREATE TABLE "StudentLearningPattern" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "evidenceCount" INTEGER NOT NULL,
  "estimate" JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "StudentLearningPattern_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentLearningPattern_studentId_kind_key" ON "StudentLearningPattern" ("studentId", "kind");

CREATE TABLE "StudentDistraction" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'SELF_REPORTED',
  "weekStart" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentDistraction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentDistraction_studentId_weekStart_key" ON "StudentDistraction" ("studentId", "weekStart");

CREATE TABLE "Intervention" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "metricsBefore" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Intervention_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InterventionResult" (
  "id" TEXT NOT NULL,
  "interventionId" TEXT NOT NULL,
  "metricsAfter" JSONB NOT NULL,
  "result" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InterventionResult_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InterventionResult_interventionId_key" ON "InterventionResult" ("interventionId");

CREATE TABLE "WeeklyGoal" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "skillId" TEXT NOT NULL,
  "targetMastery" DOUBLE PRECISION NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "WeeklyGoal_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeeklyGoal_studentId_skillId_weekStart_key" ON "WeeklyGoal" ("studentId", "skillId", "weekStart");

CREATE TABLE "XpEvent" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "XpEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "XpEvent_sessionId_key" ON "XpEvent" ("sessionId");

CREATE TABLE "Streak" (
  "studentId" TEXT NOT NULL,
  "current" INTEGER NOT NULL DEFAULT 0,
  "longest" INTEGER NOT NULL DEFAULT 0,
  "lastLearningDate" TEXT,
  CONSTRAINT "Streak_pkey" PRIMARY KEY ("studentId")
);

CREATE TABLE "Achievement" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StudentAchievement" (
  "studentId" TEXT NOT NULL,
  "achievementId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentAchievement_pkey" PRIMARY KEY ("studentId", "achievementId")
);

CREATE TABLE "Character" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "function" TEXT NOT NULL,
  "assetId" TEXT,
  CONSTRAINT "Character_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VisualAsset" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT NOT NULL,
  "contentStatus" "ReviewStatus" NOT NULL DEFAULT 'DRAFT',
  CONSTRAINT "VisualAsset_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuestionVisualAsset" (
  "questionId" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  CONSTRAINT "QuestionVisualAsset_pkey" PRIMARY KEY ("questionId", "assetId")
);

CREATE TABLE "StudentCharacterProgress" (
  "studentId" TEXT NOT NULL,
  "characterId" TEXT NOT NULL,
  "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentCharacterProgress_pkey" PRIMARY KEY ("studentId", "characterId")
);

CREATE TABLE "StudentReward" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentReward_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StudentReward_studentId_key_key" ON "StudentReward" ("studentId", "key");

CREATE TABLE "ContentPolicyRule" (
  "id" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 1,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "ContentPolicyRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ContentReviewStatus" (
  "id" TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "status" "ReviewStatus" NOT NULL,
  "reviewer" TEXT NOT NULL,
  "rationale" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ContentReviewStatus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthThrottle" (
  "key" TEXT NOT NULL,
  "failures" INTEGER NOT NULL DEFAULT 0,
  "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "blockedUntil" TIMESTAMP(3),
  CONSTRAINT "AuthThrottle_pkey" PRIMARY KEY ("key")
);

ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ParentStudentLink" ADD CONSTRAINT "ParentStudentLink_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Unit" ADD CONSTRAINT "Unit_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Skill" ADD CONSTRAINT "Skill_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Skill" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionOption" ADD CONSTRAINT "QuestionOption_errorTypeId_fkey" FOREIGN KEY ("errorTypeId") REFERENCES "ErrorType" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuestionSkillMap" ADD CONSTRAINT "QuestionSkillMap_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionSkillMap" ADD CONSTRAINT "QuestionSkillMap_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentSkillMastery" ADD CONSTRAINT "StudentSkillMastery_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentSkillMastery" ADD CONSTRAINT "StudentSkillMastery_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ErrorType" ADD CONSTRAINT "ErrorType_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "ErrorType" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StudentError" ADD CONSTRAINT "StudentError_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "StudentAnswer" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentError" ADD CONSTRAINT "StudentError_errorTypeId_fkey" FOREIGN KEY ("errorTypeId") REFERENCES "ErrorType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LearningBehaviorEvent" ADD CONSTRAINT "LearningBehaviorEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SessionActivity" ADD CONSTRAINT "SessionActivity_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FocusMetric" ADD CONSTRAINT "FocusMetric_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WeeklyStudentMetric" ADD CONSTRAINT "WeeklyStudentMetric_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentLearningPattern" ADD CONSTRAINT "StudentLearningPattern_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentDistraction" ADD CONSTRAINT "StudentDistraction_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Intervention" ADD CONSTRAINT "Intervention_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "InterventionResult" ADD CONSTRAINT "InterventionResult_interventionId_fkey" FOREIGN KEY ("interventionId") REFERENCES "Intervention" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WeeklyGoal" ADD CONSTRAINT "WeeklyGoal_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "XpEvent" ADD CONSTRAINT "XpEvent_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "LearningSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Streak" ADD CONSTRAINT "Streak_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentAchievement" ADD CONSTRAINT "StudentAchievement_achievementId_fkey" FOREIGN KEY ("achievementId") REFERENCES "Achievement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Character" ADD CONSTRAINT "Character_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "VisualAsset" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuestionVisualAsset" ADD CONSTRAINT "QuestionVisualAsset_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuestionVisualAsset" ADD CONSTRAINT "QuestionVisualAsset_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "VisualAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentCharacterProgress" ADD CONSTRAINT "StudentCharacterProgress_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "StudentCharacterProgress" ADD CONSTRAINT "StudentCharacterProgress_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StudentReward" ADD CONSTRAINT "StudentReward_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ContentReviewStatus" ADD CONSTRAINT "ContentReviewStatus_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "ParentStudentLink_studentId_idx" ON "ParentStudentLink" ("studentId");

CREATE INDEX "Skill_parentId_idx" ON "Skill" ("parentId");

CREATE INDEX "Question_contentStatus_difficulty_type_idx" ON "Question" ("contentStatus", "difficulty", "type");

CREATE INDEX "QuestionSkillMap_skillId_idx" ON "QuestionSkillMap" ("skillId");

CREATE INDEX "LearningSession_studentId_startedAt_idx" ON "LearningSession" ("studentId", "startedAt");

CREATE INDEX "StudentAnswer_sessionId_createdAt_idx" ON "StudentAnswer" ("sessionId", "createdAt");

CREATE INDEX "StudentSkillMastery_studentId_reviewDueAt_idx" ON "StudentSkillMastery" ("studentId", "reviewDueAt");

CREATE INDEX "StudentError_errorTypeId_createdAt_idx" ON "StudentError" ("errorTypeId", "createdAt");

CREATE INDEX "ReviewQueue_studentId_dueAt_idx" ON "ReviewQueue" ("studentId", "dueAt");

CREATE INDEX "LearningBehaviorEvent_sessionId_createdAt_idx" ON "LearningBehaviorEvent" ("sessionId", "createdAt");

CREATE INDEX "SessionActivity_sessionId_startedAt_idx" ON "SessionActivity" ("sessionId", "startedAt");

CREATE INDEX "ContentReviewStatus_questionId_createdAt_idx" ON "ContentReviewStatus" ("questionId", "createdAt");

ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_values_check" CHECK (age BETWEEN 4 AND 17 AND "goalMinutes" BETWEEN 5 AND 25);

ALTER TABLE "StudentSkillMastery" ADD CONSTRAINT "StudentSkillMastery_values_check" CHECK ("masteryScore" BETWEEN 0 AND 1 AND "confidenceScore" BETWEEN 0 AND 1 AND "retentionEstimate" BETWEEN 0 AND 1 AND attempts >= 0 AND "correctAttempts" + "incorrectAttempts" = attempts);

ALTER TABLE "Skill" ADD CONSTRAINT "Skill_values_check" CHECK (difficulty BETWEEN 1 AND 5 AND "masteryThreshold" BETWEEN 0 AND 1);

ALTER TABLE "StudentAnswer" ADD CONSTRAINT "StudentAnswer_values_check" CHECK ("responseMs" >= 0 AND "hintsUsed" >= 0);

ALTER TABLE "SessionActivity" ADD CONSTRAINT "SessionActivity_values_check" CHECK ("activeMs" >= 0 AND "endedAt" >= "startedAt");

ALTER TABLE "ReviewQueue" ADD CONSTRAINT "ReviewQueue_values_check" CHECK (stage BETWEEN 0 AND 4);

ALTER TABLE "StudentError" ADD CONSTRAINT "StudentError_values_check" CHECK (probability BETWEEN 0 AND 1);

ALTER TABLE "SkillPrerequisite" ADD CONSTRAINT "SkillPrerequisite_values_check" CHECK ("skillId" <> "prerequisiteId");
