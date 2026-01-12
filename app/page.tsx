'use client';

import { useState } from 'react';
import TaskList from './components/TaskList';
import NotesList from './components/NotesList';
import Calendar from './components/Calendar';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'calendar'>('tasks');

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),_transparent_45%),radial-gradient(circle_at_80%_20%,_rgba(148,163,184,0.14),_transparent_40%),linear-gradient(180deg,_#0b0f14,_#0b1018)]">
      <div className="container mx-auto px-5 py-10 max-w-6xl">
        {/* Header */}
        <header className="mb-10 animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
            Workspace
          </span>
          <h1 className="mt-4 text-4xl md:text-5xl font-semibold tracking-tight text-white">
            Productivity Hub
          </h1>
          <p className="mt-3 text-slate-400 max-w-2xl">
            Manage your tasks, notes, and schedule with a calm, focused dashboard.
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-8 animate-fade-up" style={{ animationDelay: '120ms' }}>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'tasks'
                ? 'bg-white/10 text-white shadow-[0_12px_30px_rgba(15,23,42,0.45)] border border-white/20'
                : 'bg-white/5 text-slate-300 border border-transparent hover:border-white/10 hover:text-white'
            }`}
          >
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'notes'
                ? 'bg-white/10 text-white shadow-[0_12px_30px_rgba(15,23,42,0.45)] border border-white/20'
                : 'bg-white/5 text-slate-300 border border-transparent hover:border-white/10 hover:text-white'
            }`}
          >
            Notes
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              activeTab === 'calendar'
                ? 'bg-white/10 text-white shadow-[0_12px_30px_rgba(15,23,42,0.45)] border border-white/20'
                : 'bg-white/5 text-slate-300 border border-transparent hover:border-white/10 hover:text-white'
            }`}
          >
            Calendar
          </button>
        </div>

        {/* Content Area */}
        <div className="glass-panel rounded-2xl p-6 md:p-8 animate-fade-up" style={{ animationDelay: '200ms' }}>
          {activeTab === 'tasks' && <TaskList />}
          {activeTab === 'notes' && <NotesList />}
          {activeTab === 'calendar' && <Calendar />}
        </div>
      </div>
    </div>
  );
}
