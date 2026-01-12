-- Tasks Table
-- This table stores all task information including recurring patterns and durations

CREATE TABLE tasks (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  priority ENUM('low', 'medium', 'high') NOT NULL DEFAULT 'medium',
  due_date DATE,
  duration INT, -- Duration in minutes
  is_recurring BOOLEAN DEFAULT FALSE,
  recurring_day INT, -- Day of the month (1-31) for legacy day-based recurring
  recurring_weekday INT, -- Day of week (0-6, Sunday-Saturday) for weekday-based recurring
  recurring_week_of_month INT, -- Which occurrence (1-4, or 5 for last) for weekday-based recurring
  deliverables JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_due_date (due_date),
  INDEX idx_completed (completed),
  INDEX idx_priority (priority),
  INDEX idx_is_recurring (is_recurring)
);

-- Optional: User table if you want multi-user support
CREATE TABLE users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tasks table with user relationship (if using multi-user)
-- If you want multi-user support, add this column to the tasks table:
-- ALTER TABLE tasks ADD COLUMN user_id BIGINT NOT NULL;
-- ALTER TABLE tasks ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE tasks ADD INDEX idx_user_id (user_id);

-- Notes Table (for the Notes feature if you want to persist them)
CREATE TABLE notes (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
);

-- Optional: Add user_id to notes if using multi-user
-- ALTER TABLE notes ADD COLUMN user_id BIGINT NOT NULL;
-- ALTER TABLE notes ADD FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE notes ADD INDEX idx_user_id (user_id);

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
