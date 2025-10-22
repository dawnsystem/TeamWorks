-- Migration: Add task subscriptions and creator tracking
-- Description: This migration adds the task subscription system to allow users to follow tasks and receive notifications only for subscribed tasks.

-- Step 1: Add createdBy column to tasks table
-- This tracks who created the task for auto-subscription
ALTER TABLE "tasks" ADD COLUMN "createdBy" TEXT;

-- For existing tasks, set createdBy to the project owner
UPDATE "tasks" 
SET "createdBy" = (
  SELECT "userId" 
  FROM "projects" 
  WHERE "projects"."id" = "tasks"."projectId"
);

-- Make createdBy NOT NULL after populating existing records
ALTER TABLE "tasks" ALTER COLUMN "createdBy" SET NOT NULL;

-- Step 2: Create task_subscriptions table
CREATE TABLE "task_subscriptions" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_subscriptions_pkey" PRIMARY KEY ("id")
);

-- Step 3: Add unique constraint to prevent duplicate subscriptions
CREATE UNIQUE INDEX "task_subscriptions_taskId_userId_key" ON "task_subscriptions"("taskId", "userId");

-- Step 4: Add indexes for better query performance
CREATE INDEX "task_subscriptions_taskId_idx" ON "task_subscriptions"("taskId");
CREATE INDEX "task_subscriptions_userId_idx" ON "task_subscriptions"("userId");

-- Step 5: Add foreign key constraints
ALTER TABLE "task_subscriptions" ADD CONSTRAINT "task_subscriptions_taskId_fkey" 
    FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "task_subscriptions" ADD CONSTRAINT "task_subscriptions_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 6: Auto-subscribe creators to their existing tasks
INSERT INTO "task_subscriptions" ("id", "taskId", "userId", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    "id",
    "createdBy",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "tasks"
WHERE "createdBy" IS NOT NULL
ON CONFLICT ("taskId", "userId") DO NOTHING;

-- Migration completed successfully
-- Users will now only receive notifications for tasks they are subscribed to
-- Task creators are automatically subscribed to their tasks
