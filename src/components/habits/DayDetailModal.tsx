'use client';

import { useState } from 'react';
import { Habit } from '@/types/journal';
import { HabitCompletion } from './UnifiedCalendarDay';

interface DayHabit extends HabitCompletion {
  streak: number;
  category: string;
}

interface DayDetailModalProps {
  date: Date;
  dateString: string;
  dayHabits: DayHabit[];
  habits: Habit[];
  onClose: () => void;
  onToggleHabit: (habitId: string, dateString: string) => void;
}

export default function DayDetailModal({ 
  date, 
  dateString,
  dayHabits = [],
  habits, 
  onClose, 
  onToggleHabit 
}: DayDetailModalProps) {
  const [updatingHabits, setUpdatingHabits] = useState<Set<string>>(new Set());

  const handleToggleHabit = (habitId: string) => {
    setUpdatingHabits(prev => new Set(prev).add(habitId));
    onToggleHabit(habitId, dateString);
    // The parent component will handle the state update
    // and the loading state will be handled by the parent as well.
    // We can remove the updatingHabits state if the parent handles the loading state.
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const completedCount = dayHabits.filter(h => h.completed).length;
  const totalHabits = dayHabits.length;
  const isPerfectDay = completedCount === totalHabits && totalHabits > 0;
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div 
      className="modal-overlay"
      onClick={handleBackdropClick}
    >
      <div className="day-detail-modal">
        <div className="modal-header">
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
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="modal-content">
            <>
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
            </>
        </div>
      </div>
    </div>
  );
}