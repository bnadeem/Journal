'use client';

import { useState, useEffect } from 'react';
import { Habit } from '@/types/journal';
import { HabitCompletion } from './UnifiedCalendarDay';

interface DayHabit extends HabitCompletion {
  streak: number;
  category: string;
}

interface DayDetailModalProps {
  date: Date;
  dateString: string;
  habits: Habit[];
  initialDayHabits: DayHabit[];
  onClose: () => void;
  onToggleHabit: (habitId: string, date: Date) => Promise<void>;
}

export default function DayDetailModal({ 
  date, 
  dateString,
  habits,
  initialDayHabits,
  onClose, 
  onToggleHabit 
}: DayDetailModalProps) {
  const [dayHabits, setDayHabits] = useState<DayHabit[]>(initialDayHabits);
  const [isLoading, setIsLoading] = useState(false);
  const [updatingHabits, setUpdatingHabits] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDayHabits(initialDayHabits);
  }, [initialDayHabits]);

  const handleToggleHabit = async (habitId: string) => {
    if (updatingHabits.has(habitId)) return;
    
    setUpdatingHabits(prev => new Set(prev).add(habitId));
    
    try {
      // Optimistic update
      setDayHabits(prev => prev.map(habit => 
        habit.habitId === habitId 
          ? { 
              ...habit, 
              completed: !habit.completed,
              // Optimistically update streak
              streak: !habit.completed ? habit.streak + 1 : Math.max(0, habit.streak - 1)
            }
          : habit
      ));
      
      await onToggleHabit(habitId, date);
    } catch (error) {
      console.error('Error toggling habit:', error);
      // Revert optimistic update
      setDayHabits(initialDayHabits);
    } finally {
      setUpdatingHabits(prev => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
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
          {isLoading ? (
            <div className="modal-loading">
              <div className="loading-spinner"></div>
              <span>Loading habits...</span>
            </div>
          ) : (
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
                        className={`toggle-button ${habit.completed ? 'completed' : 'incomplete'} ${
                          updatingHabits.has(habit.habitId) ? 'updating' : ''
                        }`}
                        onClick={() => handleToggleHabit(habit.habitId)}
                        disabled={updatingHabits.has(habit.habitId)}
                      >
                        {updatingHabits.has(habit.habitId) ? (
                          <div className="updating-spinner"></div>
                        ) : habit.completed ? (
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
          )}
        </div>
      </div>
    </div>
  );
}