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
  habits: Habit[];
  onClose: () => void;
  onToggleHabit: (habitId: string, date: Date) => Promise<void>;
}

export default function DayDetailModal({ 
  date, 
  habits, 
  onClose, 
  onToggleHabit 
}: DayDetailModalProps) {
  const [dayHabits, setDayHabits] = useState<DayHabit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingHabits, setUpdatingHabits] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDayHabits();
  }, [date, habits]);

  const loadDayHabits = async () => {
    try {
      setIsLoading(true);
      const dateString = date.toISOString().split('T')[0];
      
      const habitPromises = habits.map(async (habit) => {
        // Fetch recent logs to calculate streak and current status
        const thirtyDaysAgo = new Date(date);
        thirtyDaysAgo.setDate(date.getDate() - 30);
        
        const startDate = thirtyDaysAgo.toISOString().split('T')[0];
        const endDate = dateString;
        
        const response = await fetch(
          `/api/habits/${habit.id}/logs?startDate=${startDate}&endDate=${endDate}`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch logs for habit ${habit.name}`);
        }
        
        const logs = await response.json();
        
        // Find completion status for this specific date
        const dayLog = logs.find((log: any) => log.date === dateString);
        const completed = dayLog?.completed || false;
        
        // Calculate streak up to this date
        const sortedLogs = logs
          .filter((log: any) => log.date <= dateString)
          .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        let streak = 0;
        for (const log of sortedLogs) {
          if (log.completed) {
            streak++;
          } else {
            break;
          }
        }
        
        return {
          habitId: habit.id,
          habitName: habit.name,
          habitColor: habit.color,
          completed,
          streak,
          category: habit.category
        };
      });
      
      const results = await Promise.all(habitPromises);
      setDayHabits(results);
    } catch (error) {
      console.error('Error loading day habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    if (updatingHabits.has(habitId)) return;
    
    setUpdatingHabits(prev => new Set(prev).add(habitId));
    
    try {
      // Optimistic update
      setDayHabits(prev => prev.map(habit => 
        habit.habitId === habitId 
          ? { ...habit, completed: !habit.completed }
          : habit
      ));
      
      await onToggleHabit(habitId, date);
      
      // Reload to get updated streak
      await loadDayHabits();
    } catch (error) {
      console.error('Error toggling habit:', error);
      // Revert optimistic update
      setDayHabits(prev => prev.map(habit => 
        habit.habitId === habitId 
          ? { ...habit, completed: !habit.completed }
          : habit
      ));
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