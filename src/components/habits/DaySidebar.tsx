'use client';

import { useState, useEffect } from 'react';
import { Habit } from '@/types/journal';
import { HabitCompletion } from './UnifiedCalendarDay';
import Link from 'next/link';
import './day-sidebar.css';

interface DayHabit extends HabitCompletion {
  streak: number;
  category: string;
}

interface DaySidebarProps {
  date: Date | null;
  dateString: string;
  dayHabits: DayHabit[];
  habits: Habit[];
  onClose: () => void;
  onToggleHabit: (habitId: string, dateString: string) => void;
}

export default function DaySidebar({ 
  date, 
  dateString,
  dayHabits = [],
  habits, 
  onClose, 
  onToggleHabit 
}: DaySidebarProps) {
  const [updatingHabits, setUpdatingHabits] = useState<Set<string>>(new Set());
  const [journalEntry, setJournalEntry] = useState<{ exists: boolean, content?: string } | null>(null);
  const [loadingEntry, setLoadingEntry] = useState(true);

  useEffect(() => {
    if (!date) return;
    
    const checkJournalEntry = async () => {
      try {
        const [year, month, day] = [date.getFullYear().toString(), date.toLocaleString('default', { month: 'short' }), date.getDate().toString()];
        const response = await fetch(`/api/entries/${year}/${month}/${day}`);
        
        if (response.ok) {
          const data = await response.json();
          setJournalEntry({ 
            exists: true, 
            content: data.entry?.content || '' 
          });
        } else {
          setJournalEntry({ exists: false });
        }
      } catch (error) {
        console.error('Error checking journal entry:', error);
        setJournalEntry({ exists: false });
      } finally {
        setLoadingEntry(false);
      }
    };

    checkJournalEntry();
  }, [date]);

  const handleToggleHabit = (habitId: string) => {
    setUpdatingHabits(prev => new Set(prev).add(habitId));
    onToggleHabit(habitId, dateString);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!date) return null;

  const completedCount = dayHabits.filter(h => h.completed).length;
  const totalHabits = dayHabits.length;
  const isPerfectDay = completedCount === totalHabits && totalHabits > 0;

  return (
    <div className="day-sidebar">
      <div className="sidebar-header">
        <div className="date-info">
          <h3>{formatDate(date)}</h3>
          <div className="completion-summary">
            <span className={`completion-count ${isPerfectDay ? 'perfect' : ''}`}>
              {completedCount} of {totalHabits} habits completed
            </span>
            {isPerfectDay && (
              <span className="perfect-day-badge">🎉 Perfect Day!</span>
            )}
          </div>
        </div>
        <button 
          className="close-btn"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          ×
        </button>
      </div>
      
      <div className="sidebar-content">
        {/* Habits Section */}
        <div className="habits-section">
          <h4>Habits</h4>
          <div className="habits-list">
            {dayHabits.length === 0 ? (
              <div className="no-habits">
                <p>No habits configured yet.</p>
              </div>
            ) : (
              dayHabits.map(habit => (
                <div key={habit.habitId} className="habit-row">
                  <div className="habit-info">
                    <div 
                      className="habit-color"
                      style={{ backgroundColor: habit.habitColor }}
                    />
                    <div className="habit-details">
                      <span className="habit-name">{habit.habitName}</span>
                      <div className="habit-meta">
                        <span className="habit-category">{habit.category}</span>
                        {habit.streak > 0 && (
                          <span className="habit-streak">
                            {habit.streak} day streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <button
                    className={`toggle-button ${habit.completed ? 'completed' : 'incomplete'}`}
                    onClick={() => handleToggleHabit(habit.habitId)}
                  >
                    {habit.completed ? (
                      '✓ Done'
                    ) : (
                      '○ Mark Done'
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Journal Entry Section */}
        <div className="journal-section">
          <h4>Journal Entry</h4>
          {loadingEntry ? (
            <div className="journal-loading">
              <span className="loading-spinner">⏳</span> Checking for journal entry...
            </div>
          ) : journalEntry?.exists ? (
            <div className="journal-exists">
              <div className="journal-preview">
                <p className="journal-content">
                  {journalEntry.content && journalEntry.content.length > 100 
                    ? journalEntry.content.substring(0, 100) + '...'
                    : journalEntry.content || 'Journal entry exists'
                  }
                </p>
              </div>
              <div className="journal-actions">
                <Link 
                  href={`/entry/${date.getFullYear()}/${date.toLocaleString('default', { month: 'short' })}/${date.getDate()}`}
                  className="journal-button view-entry"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📖 View Entry
                </Link>
              </div>
            </div>
          ) : (
            <div className="journal-missing">
              <p className="no-entry-message">No journal entry for this day yet.</p>
              <div className="journal-actions">
                <Link 
                  href={`/entry/new?date=${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`}
                  className="journal-button create-entry"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ✍️ Create Entry
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Day Insights Section */}
        {completedCount > 0 && (
          <div className="day-insights">
            <h4>Day Insights</h4>
            {isPerfectDay ? (
              <p className="perfect-day-message">
                🎉 Amazing! You completed all your habits today. Keep up the fantastic work!
              </p>
            ) : completedCount >= totalHabits * 0.7 ? (
              <p className="good-day-message">
                👏 Great job! You completed {completedCount} habits today.
              </p>
            ) : (
              <p className="regular-day-message">
                💪 You completed {completedCount} habits today. Every step counts!
              </p>
            )}
            
            {dayHabits.some(h => h.completed && h.streak > 1) && (
              <div className="streak-highlights">
                <h5>Active Streaks:</h5>
                {dayHabits
                  .filter(h => h.completed && h.streak > 1)
                  .map(habit => (
                    <div key={habit.habitId} className="streak-item">
                      <span className="streak-habit">{habit.habitName}</span>
                      <span className="streak-count">{habit.streak} days</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}