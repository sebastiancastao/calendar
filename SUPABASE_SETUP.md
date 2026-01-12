# Supabase Setup Guide

This guide will help you set up Supabase for your productivity app.

## Prerequisites

- Supabase account (https://supabase.com)
- Your Supabase project URL and anon key (already configured in `.env.local`)

## Step 1: Run the Database Schema

1. Log in to your Supabase dashboard at https://supabase.com/dashboard
2. Navigate to your project: https://mnpovhuuvaexevcbrirh.supabase.co
3. Go to the **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `database/schema-postgresql.sql`
6. Click **Run** to execute the schema

This will create:
- `tasks` table with all task fields
- `users` table (optional, for multi-user support)
- `notes` table (optional, for notes feature)
- Indexes for better performance
- Triggers for auto-updating timestamps
- Sample data for testing

## Step 2: Verify the Tables

1. Go to the **Table Editor** in the left sidebar
2. You should see the `tasks` table with sample data
3. Click on the table to view the columns and data

## Step 3: Install Dependencies

Run the following command to install the Supabase client:

```bash
npm install
```

## Step 4: Environment Variables

The environment variables are already configured in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://mnpovhuuvaexevcbrirh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_hHXlBZz4gNK0rYknBwsW-Q_9kg0zam8
```

**Note:** Never commit `.env.local` to version control!

## Step 5: Test the Connection

1. Start the development server:
```bash
npm run dev
```

2. Open http://localhost:3000 in your browser
3. Try adding a new task - it should be saved to Supabase
4. Refresh the page - tasks should persist

## Step 6: Verify in Supabase

1. Go back to the Supabase Table Editor
2. Click on the `tasks` table
3. You should see your newly created tasks

## API Endpoints

The app uses the following Supabase operations:

- **GET** `/tasks` - Fetch all tasks
- **POST** `/tasks` - Create a new task
- **PATCH** `/tasks/:id` - Update a task
- **DELETE** `/tasks/:id` - Delete a task

## Row Level Security (RLS) - Optional

By default, RLS is disabled for quick testing. To enable security:

1. Go to **Authentication > Policies** in Supabase
2. Enable RLS on the `tasks` table
3. Add policies for SELECT, INSERT, UPDATE, DELETE operations
4. Implement authentication in the app

Example policy (allow all operations for now):
```sql
CREATE POLICY "Enable all operations for all users" ON tasks
FOR ALL USING (true);
```

## Troubleshooting

### Connection Issues
- Verify your Supabase URL and anon key in `.env.local`
- Check the browser console for errors
- Ensure Supabase project is active

### Data Not Persisting
- Check if the schema was run successfully
- Verify tables exist in the Table Editor
- Look for errors in the browser console

### CORS Errors
- Supabase should handle CORS automatically
- If issues persist, check your Supabase project settings

## Next Steps

- Enable Row Level Security (RLS) for production
- Add user authentication
- Set up real-time subscriptions for live updates
- Add data validation rules
- Set up backup and recovery

## Useful Links

- Supabase Dashboard: https://supabase.com/dashboard
- Supabase Docs: https://supabase.com/docs
- API Reference: https://supabase.com/docs/reference/javascript
