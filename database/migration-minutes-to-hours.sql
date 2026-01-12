-- Migration: Convert duration from minutes to hours
-- This script updates the duration column to use hours instead of minutes

-- Step 1: Add a temporary column to store hours
ALTER TABLE tasks ADD COLUMN duration_hours DECIMAL(5,2);

-- Step 2: Convert existing minutes to hours (divide by 60)
UPDATE tasks SET duration_hours = duration / 60.0 WHERE duration IS NOT NULL;

-- Step 3: Drop the old duration column
ALTER TABLE tasks DROP COLUMN duration;

-- Step 4: Rename the new column to duration
ALTER TABLE tasks RENAME COLUMN duration_hours TO duration;

-- Verify the migration
SELECT id, title, duration FROM tasks WHERE duration IS NOT NULL;
