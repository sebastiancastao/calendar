'use client';

import { useEffect, useMemo, useState } from 'react';
import * as tasksApi from '@/lib/api/tasks';
import type { Task } from '@/lib/api/tasks';

interface CalendarItem {
  task: Task;
  date: string;
  isGenerated?: boolean;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        const fetchedTasks = await tasksApi.getTasks();
        setTasks(fetchedTasks);
      } catch (error) {
        console.error('Failed to load tasks for calendar:', error);
        setLoadError('Failed to load tasks.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const formatDateParts = (year: number, monthIndex: number, day: number) => {
    const month = String(monthIndex + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const formatDate = (day: number) => {
    return formatDateParts(currentDate.getFullYear(), currentDate.getMonth(), day);
  };

  const getMonthIndexValue = (year: number, monthIndex: number) => (year * 12) + monthIndex;

  const getMonthIndexFromDate = (dateStr: string) => {
    const [yearPart, monthPart] = dateStr.split('-');
    const year = Number(yearPart);
    const monthIndex = Number(monthPart) - 1;
    if (Number.isNaN(year) || Number.isNaN(monthIndex)) return null;
    return getMonthIndexValue(year, monthIndex);
  };

  const getNthWeekdayOfMonth = (year: number, monthIndex: number, weekday: number, occurrence: number) => {
    if (occurrence === 5) {
      const lastDay = new Date(year, monthIndex + 1, 0);
      const lastWeekday = lastDay.getDay();
      const diff = (lastWeekday - weekday + 7) % 7;
      return lastDay.getDate() - diff;
    }

    const firstDay = new Date(year, monthIndex, 1);
    const firstWeekday = firstDay.getDay();
    const diff = (weekday - firstWeekday + 7) % 7;
    return 1 + diff + (occurrence - 1) * 7;
  };

  const getRecurringDateForMonth = (task: Task, year: number, monthIndex: number) => {
    if (task.recurringWeekday !== undefined && task.recurringWeekOfMonth !== undefined) {
      const day = getNthWeekdayOfMonth(year, monthIndex, task.recurringWeekday, task.recurringWeekOfMonth);
      return formatDateParts(year, monthIndex, day);
    }

    if (task.recurringDay !== undefined && task.recurringDay !== null) {
      const daysInTargetMonth = new Date(year, monthIndex + 1, 0).getDate();
      const day = Math.max(1, Math.min(task.recurringDay, daysInTargetMonth));
      return formatDateParts(year, monthIndex, day);
    }

    return null;
  };

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, CalendarItem[]> = {};
    const year = currentDate.getFullYear();
    const monthIndex = currentDate.getMonth();
    const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;
    const viewMonthValue = getMonthIndexValue(year, monthIndex);

    const addItem = (date: string, item: CalendarItem) => {
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(item);
    };

    tasks.forEach((task) => {
      if (!task.dueDate) return;
      if (!task.dueDate.startsWith(`${monthKey}-`)) return;
      addItem(task.dueDate, { task, date: task.dueDate });
    });

    const recurringGroups = new Map<string, Task[]>();
    tasks.forEach((task) => {
      if (!task.isRecurring) return;
      if (task.recurringWeekday === undefined && task.recurringWeekOfMonth === undefined && task.recurringDay === undefined) {
        return;
      }

      const key = [
        task.title,
        task.priority,
        task.recurringWeekday ?? '',
        task.recurringWeekOfMonth ?? '',
        task.recurringDay ?? '',
      ].join('|');

      const group = recurringGroups.get(key);
      if (group) {
        group.push(task);
      } else {
        recurringGroups.set(key, [task]);
      }
    });

    recurringGroups.forEach((group) => {
      const dueDates = group
        .map(task => task.dueDate)
        .filter((date): date is string => Boolean(date));

      if (dueDates.length > 0) {
        const earliestMonthValue = Math.min(...dueDates.map(date => getMonthIndexFromDate(date) ?? viewMonthValue));
        if (viewMonthValue < earliestMonthValue) {
          return;
        }
      }

      const sourceTask = group.reduce((latest, task) => {
        if (!latest) return task;
        if (task.dueDate && (!latest.dueDate || task.dueDate > latest.dueDate)) return task;
        return latest;
      }, group[0]);

      const recurringDate = getRecurringDateForMonth(sourceTask, year, monthIndex);
      if (!recurringDate) return;

      const hasExplicit = group.some(task => task.dueDate === recurringDate);
      if (hasExplicit) return;

      const generatedTask: Task = {
        ...sourceTask,
        dueDate: recurringDate,
        completed: false,
      };

      addItem(recurringDate, { task: generatedTask, date: recurringDate, isGenerated: true });
    });

    return grouped;
  }, [tasks, currentDate]);

  const getTasksForDate = (date: string) => {
    return tasksByDate[date] || [];
  };

  const getPriorityClasses = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/10 text-red-200 border-red-500/40';
      case 'medium':
        return 'bg-amber-500/10 text-amber-200 border-amber-500/40';
      case 'low':
        return 'bg-emerald-500/10 text-emerald-200 border-emerald-500/40';
      default:
        return 'bg-white/5 text-slate-200 border-white/10';
    }
  };

  const todayKey = formatDateParts(
    new Date().getFullYear(),
    new Date().getMonth(),
    new Date().getDate()
  );

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-20 border border-white/10 bg-slate-900/70"></div>);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(day);
    const dayTasks = getTasksForDate(dateStr);
    const isToday = dateStr === todayKey;
    const isSelected = dateStr === selectedDate;

    days.push(
      <div
        key={day}
        onClick={() => setSelectedDate(dateStr)}
        className={`h-20 border border-white/10 p-2 cursor-pointer transition-colors ${
          isSelected ? 'bg-sky-500/10 border-sky-400/40' : 'hover:bg-white/5'
        } ${isToday ? 'bg-sky-500/10' : 'bg-slate-900/50'}`}
      >
        <div className={`text-sm font-semibold ${isToday ? 'text-sky-300' : 'text-slate-300'}`}>
          {day}
        </div>
        {dayTasks.length > 0 && (
          <div className="mt-1 space-y-1">
            {dayTasks.slice(0, 2).map(({ task }) => (
              <div
                key={task.id}
                className={`text-xs px-1 py-0.5 rounded truncate border ${
                  task.completed
                    ? 'bg-emerald-500/10 text-emerald-200 border-emerald-500/40 line-through'
                    : getPriorityClasses(task.priority)
                }`}
              >
                {task.title}
              </div>
            ))}
            {dayTasks.length > 2 && (
              <div className="text-xs text-slate-400">+{dayTasks.length - 2} more</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold tracking-tight text-white mb-4">Calendar</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={previousMonth}
              className="button-secondary"
            >
              Previous
            </button>
            <h3 className="text-xl font-semibold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <button
              onClick={nextMonth}
              className="button-secondary"
            >
              Next
            </button>
          </div>

          {/* Calendar */}
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="grid grid-cols-7 bg-slate-900/70">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-semibold text-slate-300 text-sm border border-white/10">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">{days}</div>
          </div>
        </div>

        {/* Tasks Sidebar */}
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">
              {selectedDate ? `Tasks for ${selectedDate}` : 'Select a date'}
            </h3>
          </div>

          {/* Tasks List */}
          <div className="space-y-2">
            {isLoading && (
              <p className="text-slate-400 text-sm text-center py-4">Loading tasks...</p>
            )}
            {!isLoading && loadError && (
              <p className="text-rose-300 text-sm text-center py-4">{loadError}</p>
            )}
            {!isLoading && !loadError && selectedDate ? (
              getTasksForDate(selectedDate).length > 0 ? (
                getTasksForDate(selectedDate).map(({ task, isGenerated }) => (
                  <div key={task.id} className="glass-card rounded-xl p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className={`font-semibold ${task.completed ? 'line-through text-emerald-300' : 'text-white'}`}>
                          {task.title}
                        </h4>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                          <span className={`px-2 py-0.5 rounded-full border ${getPriorityClasses(task.priority)}`}>
                            {task.priority}
                          </span>
                          {task.completed ? <span className="text-green-400">Completed</span> : <span>Pending</span>}
                          {task.duration && <span>Duration: {task.duration}h</span>}
                          {isGenerated && <span className="text-sky-300">Recurring</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-400 text-sm text-center py-4">No tasks for this date</p>
              )
            ) : !isLoading && !loadError ? (
              <p className="text-slate-400 text-sm text-center py-4">Select a date to view tasks</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
