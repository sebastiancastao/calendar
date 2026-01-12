# Duration Update: Minutes to Hours

The duration field has been updated to use **hours** instead of minutes.

## Changes Made

### 1. Database Schema
- Updated `duration` column type from `INTEGER` to `DECIMAL(5,2)`
- Now stores hours as decimal numbers (e.g., 1.5 for 1 hour 30 minutes)
- File: `database/schema-postgresql-safe.sql`

### 2. TypeScript Types
- Updated all duration type comments to reflect hours
- Files updated:
  - `lib/supabase.ts`
  - `lib/api/tasks.ts`
  - `app/components/TaskList.tsx`

### 3. UI Updates
- Input placeholder changed from "Duration (min)" to "Duration (hrs)"
- Added `step="0.25"` for quarter-hour increments (15 minutes)
- Changed `min` from "1" to "0.25"
- Updated `parseFloat()` instead of `parseInt()` for decimal support

### 4. Duration Display Format
The `formatDuration()` function now:
- Accepts hours as decimal (e.g., 1.5, 2.75)
- Displays as "1h 30m" for 1.5 hours
- Displays as "2h" for whole hours
- Displays as "45m" for fractional hours less than 1

## Examples

| Input (hours) | Display |
|--------------|---------|
| 0.25         | 15m     |
| 0.5          | 30m     |
| 1            | 1h      |
| 1.5          | 1h 30m  |
| 2            | 2h      |
| 2.75         | 2h 45m  |

## Migration for Existing Data

If you have existing tasks with duration in minutes, run this migration:

```sql
-- File: database/migration-minutes-to-hours.sql
ALTER TABLE tasks ADD COLUMN duration_hours DECIMAL(5,2);
UPDATE tasks SET duration_hours = duration / 60.0 WHERE duration IS NOT NULL;
ALTER TABLE tasks DROP COLUMN duration;
ALTER TABLE tasks RENAME COLUMN duration_hours TO duration;
```

## Usage

When adding a task:
1. Enter duration in hours (e.g., "1.5" for 1 hour 30 minutes)
2. Use increments of 0.25 (15 minutes) for convenience
3. The display will automatically format it nicely

The changes are live at **http://localhost:3000** - refresh your browser to see them!
