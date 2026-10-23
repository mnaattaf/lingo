-- Measure time from question presentation, excluding prior feedback and support screens.
ALTER TABLE "LearningSession" ADD COLUMN "questionStartedAt" TIMESTAMP(3);
