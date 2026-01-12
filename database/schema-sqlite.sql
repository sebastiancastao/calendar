-- SQLite Schema
-- Tasks Table
-- This table stores all task information including recurring patterns and durations

CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0, -- SQLite uses 0/1 for boolean
  priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
  due_date TEXT, -- SQLite stores dates as TEXT in ISO 8601 format (YYYY-MM-DD)
  duration INTEGER, -- Duration in minutes
  is_recurring INTEGER DEFAULT 0, -- SQLite uses 0/1 for boolean
  recurring_day INTEGER, -- Day of the month (1-31) for legacy day-based recurring
  recurring_weekday INTEGER, -- Day of week (0-6, Sunday-Saturday) for weekday-based recurring
  recurring_week_of_month INTEGER, -- Which occurrence (1-4, or 5 for last) for weekday-based recurring
  deliverables TEXT, -- JSON array of deliverables
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_tasks_completed ON tasks(completed);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_tasks_is_recurring ON tasks(is_recurring);

-- Trigger to auto-update updated_at timestamp
CREATE TRIGGER update_tasks_updated_at
AFTER UPDATE ON tasks
FOR EACH ROW
BEGIN
  UPDATE tasks SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Optional: User table if you want multi-user support
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Tasks table with user relationship (if using multi-user)
-- Uncomment these lines if you want multi-user support:
-- ALTER TABLE tasks ADD COLUMN user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;
-- CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Notes Table (for the Notes feature if you want to persist them)
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT,
  content TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notes_created_at ON notes(created_at);

CREATE TRIGGER update_notes_updated_at
AFTER UPDATE ON notes
FOR EACH ROW
BEGIN
  UPDATE notes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Optional: Add user_id to notes if using multi-user
-- ALTER TABLE notes ADD COLUMN user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE;
-- CREATE INDEX idx_notes_user_id ON notes(user_id);

-- Sample data for testing
INSERT INTO tasks (title, completed, priority, due_date, is_recurring) VALUES
('Complete project proposal', 0, 'high', '2026-01-15', 0),
('Review code changes', 0, 'medium', '2026-01-13', 0),
('Update documentation', 1, 'low', NULL, 0),
('Monthly team sync', 0, 'medium', '2026-01-15', 1);

-- Update the last task to have proper recurring pattern (second Monday)
UPDATE tasks
SET recurring_weekday = 1, recurring_week_of_month = 3
WHERE title = 'Monthly team sync';
