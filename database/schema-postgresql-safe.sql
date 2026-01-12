-- PostgreSQL Schema (Safe version - only creates if not exists)
-- Tasks Table
-- This table stores all task information including recurring patterns and durations

-- Create priority type if it doesn't exist
DO $$ BEGIN
  CREATE TYPE priority_type AS ENUM ('low', 'medium', 'high');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create tasks table if it doesn't exist
CREATE TABLE IF NOT EXISTS tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority priority_type NOT NULL DEFAULT 'medium',
  due_date DATE,
  duration DECIMAL(5,2), -- Duration in hours (e.g., 1.5 for 1 hour 30 minutes)
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_day INTEGER, -- Day of the month (1-31) for legacy day-based recurring
  recurring_weekday INTEGER, -- Day of week (0-6, Sunday-Saturday) for weekday-based recurring
  recurring_week_of_month INTEGER, -- Which occurrence (1-4, or 5 for last) for weekday-based recurring
  deliverables JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_is_recurring ON tasks(is_recurring);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate trigger for tasks table
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Optional: User table if you want multi-user support
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Notes Table (for the Notes feature if you want to persist them)
CREATE TABLE IF NOT EXISTS notes (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at);

DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Only insert sample data if tasks table is empty
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM tasks LIMIT 1) THEN
    INSERT INTO tasks (title, completed, priority, due_date, is_recurring) VALUES
    ('Complete project proposal', FALSE, 'high', '2026-01-15', FALSE),
    ('Review code changes', FALSE, 'medium', '2026-01-13', FALSE),
    ('Update documentation', TRUE, 'low', NULL, FALSE),
    ('Monthly team sync', FALSE, 'medium', '2026-01-15', TRUE);

    -- Update the last task to have proper recurring pattern (second Monday)
    UPDATE tasks
    SET recurring_weekday = 1, recurring_week_of_month = 3
    WHERE title = 'Monthly team sync';
  END IF;
END $$;
