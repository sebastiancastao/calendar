'use client';

import { useState } from 'react';

interface Note {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  color: string;
}

export default function NotesList() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: 1,
      title: 'Meeting Notes',
      content: 'Discussed Q1 goals and project timeline. Need to follow up with team leads.',
      createdAt: '2026-01-12',
      color: 'bg-amber-500/10',
    },
    {
      id: 2,
      title: 'Ideas',
      content: 'New feature ideas for the mobile app: dark mode, offline support, push notifications.',
      createdAt: '2026-01-11',
      color: 'bg-sky-500/10',
    },
  ]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-amber-500/10');

  const colors = [
    'bg-amber-500/10',
    'bg-sky-500/10',
    'bg-emerald-500/10',
    'bg-rose-500/10',
    'bg-purple-500/10',
    'bg-orange-500/10',
  ];

  const addNote = () => {
    if (newTitle.trim() || newContent.trim()) {
      setNotes([
        {
          id: Date.now(),
          title: newTitle || 'Untitled Note',
          content: newContent,
          createdAt: new Date().toISOString().split('T')[0],
          color: selectedColor,
        },
        ...notes,
      ]);
      setNewTitle('');
      setNewContent('');
      setIsCreating(false);
    }
  };

  const deleteNote = (id: number) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold tracking-tight text-white">Notes</h2>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className={isCreating ? 'button-secondary' : 'button-primary'}
        >
          {isCreating ? 'Cancel' : '+ New Note'}
        </button>
      </div>

      {/* Create Note Form */}
      {isCreating && (
        <div className={`glass-card p-4 rounded-xl ${selectedColor} mb-4`}>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Note title..."
            className="input-field w-full mb-2"
          />
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Note content..."
            rows={4}
            className="input-field w-full mb-3 resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {colors.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-6 h-6 rounded-full ${color} border-2 ${
                    selectedColor === color ? 'border-white' : 'border-white/20'
                  }`}
                />
              ))}
            </div>
            <button
              onClick={addNote}
              className="button-primary"
            >
              Save Note
            </button>
          </div>
        </div>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400">
            No notes yet. Create your first note to get started!
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className={`glass-card p-4 rounded-xl ${note.color} transition-all hover:-translate-y-1`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-white text-lg">{note.title}</h3>
                <button
                  onClick={() => deleteNote(note.id)}
                  className="button-ghost text-slate-300 hover:text-rose-300"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
              <p className="text-slate-300 text-sm mb-3 whitespace-pre-wrap">{note.content}</p>
              <p className="text-xs text-slate-500">{note.createdAt}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
