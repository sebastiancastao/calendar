-- PostgreSQL Schema
-- Tasks Table
-- This table stores all task information including recurring patterns and durations

CREATE TYPE priority_type AS ENUM ('low', 'medium', 'high');

CREATE TABLE tasks (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority priority_type NOT NULL DEFAULT 'medium',
  due_date DATE,
  duration INTEGER, -- Duration in minutes
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_day INTEGER, -- Day of the month (1-31) for legacy day-based recurring
  recurring_weekday INTEGER, -- Day of week (0-6, Sunday-Saturday) for weekday-based recurring
  recurring_week_of_month INTEGER, -- Which occurrence (1-4, or 5 for last) for weekday-based recurring
  deliverables JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_is_recurring ON tasks(is_recurring);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Optional: User table if you want multi-user support
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tasks table with user relationship (if using multi-user)
-- Uncomment these lines if you want multi-user support:
-- ALTER TABLE tasks ADD COLUMN user_id BIGINT NOT NULL;
-- ALTER TABLE tasks ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Notes Table (for the Notes feature if you want to persist them)
CREATE TABLE notes (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_created_at ON notes(created_at);

CREATE TRIGGER update_notes_updated_at
BEFORE UPDATE ON notes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add user_id to notes if using multi-user
-- ALTER TABLE notes ADD COLUMN user_id BIGINT NOT NULL;
-- ALTER TABLE notes ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- CREATE INDEX idx_notes_user_id ON notes(user_id);

-- Sample data for testing
INSERT INTO tasks (title, completed, priority, due_date, is_recurring) VALUES
('Complete project proposal', FALSE, 'high', '2026-01-15', FALSE),
('Review code changes', FALSE, 'medium', '2026-01-13', FALSE),
('Update documentation', TRUE, 'low', NULL, FALSE),
('Monthly team sync', FALSE, 'medium', '2026-01-15', TRUE);

-- Update the last task to have proper recurring pattern (second Monday)
UPDATE tasks
SET recurring_weekday = 1, recurring_week_of_month = 3
WHERE title = 'Monthly team sync';
