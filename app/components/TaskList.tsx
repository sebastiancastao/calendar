'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import * as tasksApi from '@/lib/api/tasks';
import type { Task, Deliverable, TaskUpdates } from '@/lib/api/tasks';

export default function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [newDeliverable, setNewDeliverable] = useState('');
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editPriority, setEditPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editDueDate, setEditDueDate] = useState('');
  const [editDuration, setEditDuration] = useState('');
  const [editIsRecurring, setEditIsRecurring] = useState(false);
  const taskListRef = useRef<HTMLDivElement | null>(null);
  const lastScrollTarget = useRef<number | null>(null);

  const selectedTask = tasks.find(task => task.id === selectedTaskId) || null;

  const parseDueDate = (dueDate?: string) => {
    if (!dueDate) return null;
    const [datePart] = dueDate.split('T');
    const [yearStr, monthStr, dayStr] = datePart.split('-');
    const year = Number(yearStr);
    const monthIndex = Number(monthStr) - 1;
    const day = Number(dayStr);
    if (!year || Number.isNaN(monthIndex) || Number.isNaN(day)) return null;
    const date = new Date(year, monthIndex, day);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const orderedTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    const past: { task: Task; dueTime: number }[] = [];
    const upcoming: { task: Task; dueTime: number }[] = [];
    const undated: Task[] = [];

    tasks.forEach((task) => {
      const due = parseDueDate(task.dueDate);
      if (!due) {
        undated.push(task);
        return;
      }
      const dueTime = due.getTime();
      if (dueTime < todayTime) {
        past.push({ task, dueTime });
      } else {
        upcoming.push({ task, dueTime });
      }
    });

    past.sort((a, b) => a.dueTime - b.dueTime);
    upcoming.sort((a, b) => a.dueTime - b.dueTime);
    undated.sort((a, b) => b.id - a.id);

    return [...past.map(item => item.task), ...upcoming.map(item => item.task), ...undated];
  }, [tasks]);

  const nextTaskId = useMemo<number | null>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();

    let nextId: number | null = null;
    let nextTime = Number.POSITIVE_INFINITY;
    tasks.forEach((task) => {
      if (!task.dueDate || task.completed) return;
      const due = parseDueDate(task.dueDate);
      if (!due) return;
      const dueTime = due.getTime();
      if (dueTime >= todayTime && dueTime < nextTime) {
        nextTime = dueTime;
        nextId = task.id;
      }
    });

    return nextId;
  }, [tasks]);

  useEffect(() => {
    if (!nextTaskId || !taskListRef.current) return;
    if (lastScrollTarget.current === nextTaskId) return;

    const target = taskListRef.current.querySelector<HTMLElement>(`[data-task-id="${nextTaskId}"]`);
    if (!target) return;

    target.scrollIntoView({ block: 'start' });
    lastScrollTarget.current = nextTaskId;
  }, [nextTaskId, orderedTasks]);

  // Fetch tasks on component mount
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setIsLoading(true);
      const fetchedTasks = await tasksApi.getTasks();
      setTasks(fetchedTasks);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get which occurrence of a weekday in a month (1st, 2nd, 3rd, 4th, or last)
  const getWeekOfMonth = (date: Date): number => {
    const dayOfMonth = date.getDate();
    const weekOfMonth = Math.ceil(dayOfMonth / 7);

    // Check if it's the last occurrence
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const daysUntilEndOfMonth = lastDayOfMonth - dayOfMonth;
    if (daysUntilEndOfMonth < 7) {
      return 5; // Last occurrence
    }

    return weekOfMonth;
  };

  // Calculate next occurrence of a specific weekday pattern (e.g., "2nd Monday")
  const calculateNextWeekdayOccurrence = (weekday: number, weekOfMonth: number, fromDate?: Date) => {
    const today = fromDate || new Date();
    const currentYear = today.getFullYear();
    let currentMonth = today.getMonth();

    // Try current month first
    let targetDate = getNthWeekdayOfMonth(currentYear, currentMonth, weekday, weekOfMonth);

    // If the date has passed, move to next month
    if (targetDate <= today) {
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
      }
      targetDate = getNthWeekdayOfMonth(currentYear, currentMonth, weekday, weekOfMonth);
    }

    return formatDateKey(targetDate);
  };

  // Get the nth occurrence of a weekday in a specific month
  const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, occurrence: number): Date => {
    if (occurrence === 5) {
      // Last occurrence
      const lastDay = new Date(year, month + 1, 0);
      const lastWeekday = lastDay.getDay();
      const diff = (lastWeekday - weekday + 7) % 7;
      return new Date(year, month, lastDay.getDate() - diff);
    } else {
      // 1st, 2nd, 3rd, 4th occurrence
      const firstDay = new Date(year, month, 1);
      const firstWeekday = firstDay.getDay();
      const diff = (weekday - firstWeekday + 7) % 7;
      const targetDate = 1 + diff + (occurrence - 1) * 7;
      return new Date(year, month, targetDate);
    }
  };

  const calculateNextDueDate = (day: number) => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    // Create date for the specified day of current month
    let dueDate = new Date(currentYear, currentMonth, day);

    // If the date has already passed this month, set it for next month
    if (dueDate < today) {
      dueDate = new Date(currentYear, currentMonth + 1, day);
    }

    return formatDateKey(dueDate);
  };

  const addTask = async () => {
    if (newTask.trim()) {
      const newTaskData: Omit<Task, 'id'> = {
        title: newTask,
        completed: false,
        priority: newPriority,
        isRecurring,
      };

      if (isRecurring && newDueDate) {
        // Parse the selected date to determine weekday pattern
        const selectedDate = new Date(newDueDate + 'T00:00:00');
        const weekday = selectedDate.getDay();
        const weekOfMonth = getWeekOfMonth(selectedDate);

        newTaskData.recurringWeekday = weekday;
        newTaskData.recurringWeekOfMonth = weekOfMonth;
        newTaskData.dueDate = newDueDate;
      } else if (newDueDate) {
        newTaskData.dueDate = newDueDate;
      }

      if (newDuration) {
        newTaskData.duration = parseFloat(newDuration);
      }

      try {
        const createdTask = await tasksApi.createTask(newTaskData);
        setTasks([createdTask, ...tasks]);
        setNewTask('');
        setNewDueDate('');
        setNewDuration('');
        setIsRecurring(false);
      } catch (error) {
        console.error('Failed to create task:', error);
        alert('Failed to create task. Please try again.');
      }
    }
  };

  const toggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;

    try {
      // Update the task in the database
      await tasksApi.updateTask(id, { completed: newCompleted });

      // Update local state
      setTasks(tasks.map(t => t.id === id ? { ...t, completed: newCompleted } : t));

      // If marking a recurring task as complete, create a new instance for next month
      if (newCompleted && task.isRecurring) {
        let nextDueDate: string;

        if (task.recurringWeekday !== undefined && task.recurringWeekOfMonth !== undefined) {
          // Weekday-based recurring (e.g., "2nd Monday")
          const currentDueDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00') : new Date();
          nextDueDate = calculateNextWeekdayOccurrence(
            task.recurringWeekday,
            task.recurringWeekOfMonth,
            currentDueDate
          );
        } else if (task.recurringDay) {
          // Day-based recurring (legacy support)
          const today = new Date();
          const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, task.recurringDay);
          nextDueDate = formatDateKey(nextMonth);
        } else {
          return;
        }

        const newRecurringTask: Omit<Task, 'id'> = {
          title: task.title,
          completed: false,
          priority: task.priority,
          isRecurring: true,
          recurringDay: task.recurringDay,
          recurringWeekday: task.recurringWeekday,
          recurringWeekOfMonth: task.recurringWeekOfMonth,
          dueDate: nextDueDate,
          duration: task.duration,
        };

        // Create the new recurring task in the database
        const createdTask = await tasksApi.createTask(newRecurringTask);
        setTasks(prevTasks => [createdTask, ...prevTasks]);
      }
    } catch (error) {
      console.error('Failed to toggle task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const deleteTask = async (id: number) => {
    try {
      await tasksApi.deleteTask(id);
      setTasks(tasks.filter(task => task.id !== id));
      if (selectedTaskId === id) {
        setSelectedTaskId(null);
        setIsEditingTask(false);
        setNewDeliverable('');
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Failed to delete task. Please try again.');
    }
  };

  const hydrateEditFields = (task: Task) => {
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || '');
    setEditDuration(task.duration !== undefined ? String(task.duration) : '');
    setEditIsRecurring(task.isRecurring);
  };

  const openTask = (id: number) => {
    const task = tasks.find(item => item.id === id);
    if (!task) return;
    setSelectedTaskId(id);
    setNewDeliverable('');
    setIsEditingTask(false);
    hydrateEditFields(task);
  };

  const closeTaskView = () => {
    setSelectedTaskId(null);
    setIsEditingTask(false);
    setNewDeliverable('');
  };

  const startEditingTask = () => {
    if (!selectedTask) return;
    hydrateEditFields(selectedTask);
    setIsEditingTask(true);
  };

  const cancelTaskEdits = () => {
    if (!selectedTask) return;
    hydrateEditFields(selectedTask);
    setIsEditingTask(false);
  };

  const createDeliverableId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  const updateDeliverables = async (taskId: number, deliverables: Deliverable[]) => {
    setTasks(prevTasks => prevTasks.map(task => (
      task.id === taskId ? { ...task, deliverables } : task
    )));

    try {
      await tasksApi.updateTask(taskId, { deliverables });
    } catch (error) {
      console.error('Failed to update deliverables:', error);
      alert('Failed to update deliverables. Please try again.');
      loadTasks();
    }
  };

  const addDeliverable = async () => {
    if (!selectedTask || !newDeliverable.trim()) return;

    const nextDeliverables = [
      ...(selectedTask.deliverables || []),
      {
        id: createDeliverableId(),
        title: newDeliverable.trim(),
        completed: false,
      },
    ];

    setNewDeliverable('');
    await updateDeliverables(selectedTask.id, nextDeliverables);
  };

  const toggleDeliverable = async (deliverableId: string) => {
    if (!selectedTask) return;

    const nextDeliverables = (selectedTask.deliverables || []).map(deliverable => (
      deliverable.id === deliverableId
        ? { ...deliverable, completed: !deliverable.completed }
        : deliverable
    ));

    await updateDeliverables(selectedTask.id, nextDeliverables);
  };

  const removeDeliverable = async (deliverableId: string) => {
    if (!selectedTask) return;

    const nextDeliverables = (selectedTask.deliverables || []).filter(deliverable => (
      deliverable.id !== deliverableId
    ));

    await updateDeliverables(selectedTask.id, nextDeliverables);
  };

  const saveTaskEdits = async () => {
    if (!selectedTask) return;

    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      alert('Task title is required.');
      return;
    }

    const normalizedDueDate = editDueDate.trim();
    const turningOnRecurring = editIsRecurring && !selectedTask.isRecurring;
    if (turningOnRecurring && !normalizedDueDate) {
      alert('Select a date to set the recurring pattern.');
      return;
    }

    const parsedDuration = editDuration.trim() ? parseFloat(editDuration) : null;
    if (parsedDuration !== null && Number.isNaN(parsedDuration)) {
      alert('Duration must be a number.');
      return;
    }

    const updates: TaskUpdates = {};

    if (trimmedTitle !== selectedTask.title) updates.title = trimmedTitle;
    if (editPriority !== selectedTask.priority) updates.priority = editPriority;

    const currentDueDate = selectedTask.dueDate || '';
    if (currentDueDate !== normalizedDueDate) {
      updates.dueDate = normalizedDueDate || null;
    }

    const currentDuration = selectedTask.duration ?? null;
    if (parsedDuration !== currentDuration) {
      updates.duration = parsedDuration;
    }

    
    if (editIsRecurring !== selectedTask.isRecurring) {
      updates.isRecurring = editIsRecurring;
    }

    if (editIsRecurring && normalizedDueDate) {
      const selectedDate = new Date(normalizedDueDate + 'T00:00:00');
      const weekday = selectedDate.getDay();
      const weekOfMonth = getWeekOfMonth(selectedDate);

      if (selectedTask.recurringWeekday !== weekday) updates.recurringWeekday = weekday;
      if (selectedTask.recurringWeekOfMonth !== weekOfMonth) updates.recurringWeekOfMonth = weekOfMonth;
    }

    if (Object.keys(updates).length === 0) {
      setIsEditingTask(false);
      return;
    }

    try {
      const updatedTask = await tasksApi.updateTask(selectedTask.id, updates);
      setTasks(prevTasks => prevTasks.map(task => task.id === selectedTask.id ? updatedTask : task));
      hydrateEditFields(updatedTask);
      setIsEditingTask(false);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Failed to update task. Please try again.');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-200 border-red-500/40';
      case 'medium': return 'bg-amber-500/10 text-amber-200 border-amber-500/40';
      case 'low': return 'bg-emerald-500/10 text-emerald-200 border-emerald-500/40';
      default: return 'bg-white/5 text-slate-200 border-white/10';
    }
  };

  const getRecurringPattern = (task: Task): string => {
    if (!task.isRecurring) return '';

    if (task.recurringWeekday !== undefined && task.recurringWeekOfMonth !== undefined) {
      const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const occurrences = ['', 'First', 'Second', 'Third', 'Fourth', 'Last'];
      return `${occurrences[task.recurringWeekOfMonth]} ${weekdays[task.recurringWeekday]}`;
    } else if (task.recurringDay) {
      return `Day ${task.recurringDay}`;
    }
    return 'Monthly';
  };

  const formatDuration = (hours?: number): string => {
    if (!hours) return '';

    // If it's a whole number, just show hours
    if (hours % 1 === 0) return `${hours}h`;

    // Otherwise show hours and minutes
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);

    if (wholeHours === 0) return `${minutes}m`;
    return `${wholeHours}h ${minutes}m`;
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-white mb-4">Tasks</h2>

      {/* Add Task Form */}
      <div className="space-y-3 mb-6 glass-card p-4 rounded-xl">
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            placeholder="Add a new task..."
            className="flex-1 input-field min-w-[240px]"
          />
          <input
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
            placeholder={isRecurring ? "Select first occurrence" : "Select due date"}
            className="input-field"
          />
          <input
            type="number"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
            placeholder="Duration (hrs)"
            min="0.25"
            step="0.25"
            className="w-32 input-field"
          />
          <select
            value={newPriority}
            onChange={(e) => setNewPriority(e.target.value as 'low' | 'medium' | 'high')}
            className="input-field"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            onClick={addTask}
            className="button-primary px-6"
          >
            Add
          </button>
        </div>

        {/* Recurring Task Options */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 text-blue-500 bg-slate-900 border-white/20 rounded focus:ring-2 focus:ring-blue-500/40"
            />
            <span className="text-sm text-slate-300">Recurring monthly</span>
          </label>

          {isRecurring && newDueDate && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-400">
                {(() => {
                  const selectedDate = new Date(newDueDate + 'T00:00:00');
                  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                  const weekOfMonth = getWeekOfMonth(selectedDate);
                  const occurrences = ['', 'first', 'second', 'third', 'fourth', 'last'];
                  return `Repeats on the ${occurrences[weekOfMonth]} ${weekdays[selectedDate.getDay()]} of each month`;
                })()}
              </span>
            </div>
          )}
          {isRecurring && !newDueDate && (
            <span className="text-sm text-amber-300">Select a date to set the recurring pattern</span>
          )}
        </div>
      </div>

      {/* Task List */}
      <div ref={taskListRef} className="space-y-2 max-h-[65vh] overflow-y-auto pr-1">
        {isLoading ? (
          <p className="text-slate-400 text-center py-8">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No tasks yet. Add one to get started!</p>
        ) : (
          orderedTasks.map((task) => {
            const isSelected = selectedTaskId === task.id;
            const detailTask = isSelected ? (selectedTask ?? task) : null;
            const detailDeliverables = detailTask?.deliverables || [];
            const completedDeliverables = detailDeliverables.filter(deliverable => deliverable.completed).length;

            return (
              <div key={task.id} data-task-id={task.id} className="space-y-2">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openTask(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      openTask(task.id);
                    }
                  }}
                  className={`flex items-center gap-3 p-4 rounded-xl border transition-all cursor-pointer ${
                    task.completed
                      ? 'bg-slate-900/60 border-white/10'
                      : 'bg-slate-900/40 border-white/10 hover:bg-slate-900/70'
                  } ${isSelected ? 'ring-2 ring-sky-500/40' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 text-blue-500 bg-slate-900 border-white/20 rounded focus:ring-2 focus:ring-blue-500/40"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${task.completed ? 'line-through text-emerald-300' : 'text-white'}`}>
                        {task.title}
                      </p>
                      {nextTaskId === task.id && (
                        <span className="chip border-sky-400/40 bg-sky-500/10 text-sky-200">
                          Next
                        </span>
                      )}
                      {task.isRecurring && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-indigo-500/10 text-indigo-200 border border-indigo-500/40 rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Monthly
                        </span>
                      )}
                      {task.duration && (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-sky-500/10 text-sky-200 border border-sky-500/40 rounded-full">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDuration(task.duration)}
                        </span>
                      )}
                    </div>
                    {task.dueDate && (
                      <p className="text-sm text-slate-400 mt-1">
                        Due: {task.dueDate}
                        {task.isRecurring && ` (${getRecurringPattern(task)})`}
                      </p>
                    )}
                    {task.deliverables && task.deliverables.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        Deliverables: {task.deliverables.filter(deliverable => deliverable.completed).length}/{task.deliverables.length}
                      </p>
                    )}
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full border ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTask(task.id);
                    }}
                    className="button-ghost text-rose-300 hover:bg-rose-500/10 hover:text-rose-200"
                  >
                    Delete
                  </button>
                </div>

                {isSelected && detailTask && (
                  <div className="mt-2 rounded-2xl glass-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1">
                        {isEditingTask ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              placeholder="Task title..."
                              className="w-full input-field"
                            />
                            <div className="flex flex-wrap gap-2">
                              <input
                                type="date"
                                value={editDueDate}
                                onChange={(e) => setEditDueDate(e.target.value)}
                                className="input-field"
                              />
                              <input
                                type="number"
                                value={editDuration}
                                onChange={(e) => setEditDuration(e.target.value)}
                                placeholder="Duration (hrs)"
                                min="0.25"
                                step="0.25"
                                className="w-32 input-field"
                              />
                              <select
                                value={editPriority}
                                onChange={(e) => setEditPriority(e.target.value as 'low' | 'medium' | 'high')}
                                className="input-field"
                              >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                              </select>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={editIsRecurring}
                                  onChange={(e) => setEditIsRecurring(e.target.checked)}
                                  className="w-4 h-4 text-blue-500 bg-slate-900 border-white/20 rounded focus:ring-2 focus:ring-blue-500/40"
                                />
                                <span className="text-sm text-slate-300">Recurring monthly</span>
                              </label>
                              {editIsRecurring && editDueDate && (
                                <span className="text-sm text-slate-400">
                                  {(() => {
                                    const selectedDate = new Date(editDueDate + 'T00:00:00');
                                    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
                                    const weekOfMonth = getWeekOfMonth(selectedDate);
                                    const occurrences = ['', 'first', 'second', 'third', 'fourth', 'last'];
                                    return `Repeats on the ${occurrences[weekOfMonth]} ${weekdays[selectedDate.getDay()]} of each month`;
                                  })()}
                                </span>
                              )}
                              {editIsRecurring && !editDueDate && (
                                <span className="text-sm text-amber-300">Select a date to set the recurring pattern</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className={`text-xl font-semibold ${detailTask.completed ? 'line-through text-emerald-300' : 'text-white'}`}>
                              {detailTask.title}
                            </h3>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                              {nextTaskId === detailTask.id && (
                                <span className="chip border-sky-400/40 bg-sky-500/10 text-sky-200">
                                  Next
                                </span>
                              )}
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getPriorityColor(detailTask.priority)}`}>
                                {detailTask.priority}
                              </span>
                              {detailTask.dueDate && (
                                <span>Due: {detailTask.dueDate}</span>
                              )}
                              {detailTask.duration && (
                                <span>Duration: {formatDuration(detailTask.duration)}</span>
                              )}
                              {detailTask.isRecurring && (
                                <span>Repeats: {getRecurringPattern(detailTask)}</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditingTask ? (
                          <>
                            <button
                              onClick={saveTaskEdits}
                              className="button-primary px-4 py-1 text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelTaskEdits}
                              className="button-secondary px-4 py-1 text-sm"
                            >
                              Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={startEditingTask}
                            className="button-secondary px-4 py-1 text-sm"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={closeTaskView}
                          className="button-ghost text-sm"
                        >
                          Close
                        </button>
                      </div>
                    </div>

                    <div className="mt-5">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Deliverables</h4>
                        <span className="text-xs text-slate-500">
                          {detailDeliverables.length > 0
                            ? `${completedDeliverables}/${detailDeliverables.length} complete`
                            : 'No deliverables yet'}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          type="text"
                          value={newDeliverable}
                          onChange={(e) => setNewDeliverable(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addDeliverable()}
                          placeholder="Add a deliverable..."
                          className="flex-1 min-w-[240px] input-field"
                        />
                        <button
                          onClick={addDeliverable}
                          className="button-primary"
                        >
                          Add deliverable
                        </button>
                      </div>

                      {detailDeliverables.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500">No deliverables yet. Add the first one above.</p>
                      ) : (
                        <div className="mt-3 space-y-2">
                          {detailDeliverables.map((deliverable) => (
                            <div
                              key={deliverable.id}
                              className="flex items-center gap-3 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2"
                            >
                              <input
                                type="checkbox"
                                checked={deliverable.completed}
                                onChange={() => toggleDeliverable(deliverable.id)}
                                className="w-4 h-4 text-blue-500 bg-slate-900 border-white/20 rounded focus:ring-2 focus:ring-blue-500/40"
                              />
                              <span className={`flex-1 text-sm ${deliverable.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                {deliverable.title}
                              </span>
                              <button
                                onClick={() => removeDeliverable(deliverable.id)}
                                className="text-xs text-slate-400 hover:text-rose-300 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Stats */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex gap-6 text-sm">
          <span className="text-slate-400">
            Total: <span className="font-semibold text-white">{tasks.length}</span>
          </span>
          <span className="text-slate-400">
            Completed: <span className="font-semibold text-green-400">{tasks.filter(t => t.completed).length}</span>
          </span>
          <span className="text-slate-400">
            Pending: <span className="font-semibold text-blue-400">{tasks.filter(t => !t.completed).length}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
