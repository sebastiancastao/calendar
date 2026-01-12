import { supabase } from '../supabase';

export interface Deliverable {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  duration?: number; // Duration in hours (e.g., 1.5)
  isRecurring: boolean;
  recurringDay?: number;
  recurringWeekday?: number;
  recurringWeekOfMonth?: number;
  deliverables?: Deliverable[];
}

export type TaskUpdates = Omit<
  Partial<Task>,
  'dueDate' | 'duration' | 'recurringDay' | 'recurringWeekday' | 'recurringWeekOfMonth' | 'deliverables'
> & {
  dueDate?: string | null;
  duration?: number | null;
  recurringDay?: number | null;
  recurringWeekday?: number | null;
  recurringWeekOfMonth?: number | null;
  deliverables?: Deliverable[] | null;
};

const normalizeDeliverables = (value: any): Deliverable[] | undefined => {
  if (!value) return undefined;
  if (Array.isArray(value)) return value as Deliverable[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as Deliverable[]) : undefined;
    } catch {
      return undefined;
    }
  }
  return undefined;
};

// Convert database row to Task interface
const dbToTask = (row: any): Task => ({
  id: row.id,
  title: row.title,
  completed: row.completed,
  priority: row.priority,
  dueDate: row.due_date || undefined,
  duration: row.duration ?? undefined,
  isRecurring: row.is_recurring,
  recurringDay: row.recurring_day ?? undefined,
  recurringWeekday: row.recurring_weekday ?? undefined,
  recurringWeekOfMonth: row.recurring_week_of_month ?? undefined,
  deliverables: normalizeDeliverables(row.deliverables),
});

// Convert Task interface to database row
const taskToDbInsert = (task: Omit<Task, 'id'>) => ({
  title: task.title,
  completed: task.completed,
  priority: task.priority,
  due_date: task.dueDate || null,
  duration: task.duration ?? null,
  is_recurring: task.isRecurring,
  recurring_day: task.recurringDay ?? null,
  recurring_weekday: task.recurringWeekday ?? null,
  recurring_week_of_month: task.recurringWeekOfMonth ?? null,
  deliverables: task.deliverables || null,
});

const taskToDbUpdate = (task: TaskUpdates) => {
  const updates: Record<string, unknown> = {};

  if (task.title !== undefined) updates.title = task.title;
  if (task.completed !== undefined) updates.completed = task.completed;
  if (task.priority !== undefined) updates.priority = task.priority;
  if (task.dueDate !== undefined) updates.due_date = task.dueDate || null;
  if (task.duration !== undefined) updates.duration = task.duration ?? null;
  if (task.isRecurring !== undefined) updates.is_recurring = task.isRecurring;
  if (task.recurringDay !== undefined) updates.recurring_day = task.recurringDay ?? null;
  if (task.recurringWeekday !== undefined) updates.recurring_weekday = task.recurringWeekday ?? null;
  if (task.recurringWeekOfMonth !== undefined) updates.recurring_week_of_month = task.recurringWeekOfMonth ?? null;
  if (task.deliverables !== undefined) updates.deliverables = task.deliverables || null;

  return updates;
};

// Get all tasks
export async function getTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching tasks:', error);
    throw error;
  }

  return data.map(dbToTask);
}

// Create a new task
export async function createTask(task: Omit<Task, 'id'>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([taskToDbInsert(task)])
    .select()
    .single();

  if (error) {
    console.error('Error creating task:', error);
    throw error;
  }

  return dbToTask(data);
}

// Update a task
export async function updateTask(id: number, updates: TaskUpdates): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(taskToDbUpdate(updates))
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating task:', error);
    throw error;
  }

  return dbToTask(data);
}

// Delete a task
export async function deleteTask(id: number): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// Toggle task completion
export async function toggleTask(id: number, completed: boolean): Promise<Task> {
  return updateTask(id, { completed });
}
