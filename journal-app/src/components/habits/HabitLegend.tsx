'use client';

import { useState, useEffect } from 'react';
import { Habit } from '@/types/journal';

interface HabitStats {
  currentStreak: number;
  bestStreak: number;
  completionRate: number;
  completedToday: boolean;
}

interface HabitLegendProps {
  habits: Habit[];
  visibleHabits: string[];
  onToggleHabit: (habitId: string) => void;
  onEditHabit: (habitId: string) => void;
  onAddHabit: () => void;
}

export default function HabitLegend({ 
  habits, 
  visibleHabits, 
  onToggleHabit, 
  onEditHabit, 
  onAddHabit 
}: HabitLegendProps) {
  const [habitStats, setHabitStats] = useState<Record<string, HabitStats>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    calculateHabitStats();
  }, [habits]);

  const calculateHabitStats = async () => {
    try {
      setIsLoading(true);
      const statsPromises = habits.map(async (habit) => {
        const stats = await fetchHabitStats(habit);
        return { habitId: habit.id, stats };
      });
      
      const results = await Promise.all(statsPromises);
      const statsMap: Record<string, HabitStats> = {};
      
      results.forEach(({ habitId, stats }) => {
        statsMap[habitId] = stats;
      });
      
      setHabitStats(statsMap);
    } catch (error) {
      console.error('Error calculating habit stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHabitStats = async (habit: Habit): Promise<HabitStats> => {
    try {
      // Fetch last 30 days of data for stats calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const today = new Date();
      
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const response = await fetch(
        `/api/habits/${habit.id}/logs?startDate=${startDate}&endDate=${endDate}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch habit logs');
      }
      
      const logs = await response.json();
      
      // Calculate stats
      const completedDays = logs.filter((log: any) => log.completed);
      const totalDays = logs.length;
      const completionRate = totalDays > 0 ? (completedDays.length / totalDays) * 100 : 0;
      
      // Calculate current streak
      const sortedLogs = logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
      let currentStreak = 0;
      for (const log of sortedLogs) {
        if (log.completed) {
          currentStreak++;
        } else {
          break;
        }
      }
      
      // Calculate best streak (simplified)
      let bestStreak = 0;
      let tempStreak = 0;
      for (const log of logs.reverse()) {
        if (log.completed) {
          tempStreak++;
          bestStreak = Math.max(bestStreak, tempStreak);
        } else {
          tempStreak = 0;
        }
      }
      
      // Check if completed today
      const todayStr = today.toISOString().split('T')[0];
      const todayLog = logs.find((log: any) => log.date === todayStr);
      const completedToday = todayLog?.completed || false;
      
      return {
        currentStreak,
        bestStreak,
        completionRate: Math.round(completionRate),
        completedToday
      };
    } catch (error) {
      console.error(`Error fetching stats for habit ${habit.name}:`, error);
      return {
        currentStreak: 0,
        bestStreak: 0,
        completionRate: 0,
        completedToday: false
      };
    }
  };

  const toggleHabitVisibility = (habitId: string) => {
    onToggleHabit(habitId);
  };

  return (
    <div className="habit-legend">
      <div className="legend-header">
        <h4>Active Habits</h4>
        <button 
          className="add-habit-btn"
          onClick={onAddHabit}
        >
          + Add Habit
        </button>
      </div>
      
      {isLoading ? (
        <div className="legend-loading">
          <div className="loading-spinner"></div>
          <span>Loading habit statistics...</span>
        </div>
      ) : (
        <div className="legend-items">
          {habits.length === 0 ? (
            <div className="no-habits">
              <p>No habits yet. Create your first habit to get started!</p>
              <button 
                className="create-first-habit-btn"
                onClick={onAddHabit}
              >
                Create First Habit
              </button>
            </div>
          ) : (
            habits.map(habit => {
              const stats = habitStats[habit.id] || {
                currentStreak: 0,
                bestStreak: 0,
                completionRate: 0,
                completedToday: false
              };
              const isVisible = visibleHabits.includes(habit.id);
              
              return (
                <div 
                  key={habit.id}
                  className={`legend-item ${isVisible ? 'visible' : 'hidden'}`}
                >
                  <button
                    className="visibility-toggle"
                    onClick={() => toggleHabitVisibility(habit.id)}
                    title={isVisible ? 'Hide from calendar' : 'Show on calendar'}
                  >
                    <div 
                      className="legend-color"
                      style={{ backgroundColor: habit.color }}
                    />
                    <div className="habit-info">
                      <span className="legend-name">{habit.name}</span>
                      <span className="habit-category">{habit.category}</span>
                    </div>
                  </button>
                  
                  <div className="legend-stats">
                    <div className="stat-item">
                      <span className="stat-value">{stats.currentStreak}</span>
                      <span className="stat-label">streak</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-value">{stats.completionRate}%</span>
                      <span className="stat-label">rate</span>
                    </div>
                    <div className={`today-status ${stats.completedToday ? 'completed' : 'incomplete'}`}>
                      {stats.completedToday ? '✓' : '○'}
                    </div>
                  </div>
                  
                  <button 
                    className="edit-habit-btn"
                    onClick={() => onEditHabit(habit.id)}
                    title="Edit habit"
                  >
                    ⚙️
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}
      
      {habits.length > 0 && (
        <div className="legend-summary">
          <span className="visible-count">
            Showing {visibleHabits.length} of {habits.length} habits
          </span>
          {visibleHabits.length < habits.length && (
            <button
              className="show-all-btn"
              onClick={() => habits.forEach(h => onToggleHabit(h.id))}
            >
              Show All
            </button>
          )}
        </div>
      )}
    </div>
  );
}