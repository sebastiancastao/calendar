import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: number;
          title: string;
          completed: boolean;
          priority: 'low' | 'medium' | 'high';
          due_date: string | null;
          duration: number | null; // Hours as decimal (e.g., 1.5)
          is_recurring: boolean;
          recurring_day: number | null;
          recurring_weekday: number | null;
          recurring_week_of_month: number | null;
          deliverables: { id: string; title: string; completed: boolean }[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          title: string;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          duration?: number | null;
          is_recurring?: boolean;
          recurring_day?: number | null;
          recurring_weekday?: number | null;
          recurring_week_of_month?: number | null;
          deliverables?: { id: string; title: string; completed: boolean }[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          title?: string;
          completed?: boolean;
          priority?: 'low' | 'medium' | 'high';
          due_date?: string | null;
          duration?: number | null;
          is_recurring?: boolean;
          recurring_day?: number | null;
          recurring_weekday?: number | null;
          recurring_week_of_month?: number | null;
          deliverables?: { id: string; title: string; completed: boolean }[] | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
