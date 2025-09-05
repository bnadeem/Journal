'use client';

import { useState } from 'react';
import HabitSummary from './HabitSummary';
import { HabitScore } from '@/lib/habit-scoring';

export interface HabitCompletion {
  habitId: string;
  habitName: string;
  habitColor: string;
  completed: boolean;
}

export interface UnifiedCalendarDayData {
  date: Date;
  habits: HabitCompletion[];
  totalHabits: number;
  completionRate: number;
  isToday: boolean;
}

interface UnifiedCalendarDayProps {
  dayData: UnifiedCalendarDayData;
  visibleHabits: string[];
  habitScores?: Record<string, HabitScore>;
  onDayClick: (date: Date, habits: HabitCompletion[]) => void;
}

export default function UnifiedCalendarDay({ 
  dayData, 
  visibleHabits, 
  habitScores = {},
  onDayClick 
}: UnifiedCalendarDayProps) {
  const [isHovered, setIsHovered] = useState(false);
  
  const { date, habits, isToday } = dayData;
  
  // Filter habits based on visibility settings
  const visibleCompletedHabits = habits.filter(
    habit => habit.completed && visibleHabits.includes(habit.habitId)
  );
  
  const maxVisibleDots = 4;
  const visibleDots = visibleCompletedHabits.slice(0, maxVisibleDots);
  const overflowCount = Math.max(0, visibleCompletedHabits.length - maxVisibleDots);
  
  const handleClick = () => {
    onDayClick(date, habits);
  };
  
  const completionRatio = habits.length > 0 ? `${visibleCompletedHabits.length}/${habits.filter(h => visibleHabits.includes(h.habitId)).length}` : '0/0';
  const completionPercentage = habits.length > 0 ? Math.round((visibleCompletedHabits.length / habits.filter(h => visibleHabits.includes(h.habitId)).length) * 100) : 0;
  
  return (
    <button 
      className={`
        unified-calendar-day
        ${isToday ? 'today' : ''}
        ${visibleCompletedHabits.length > 0 ? 'has-completions' : ''}
      `}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title={`${date.toLocaleDateString()} - ${completionRatio} habits completed (${completionPercentage}%)`}
    >
      <span className="day-number">{date.getDate()}</span>
      
      {visibleCompletedHabits.length > 0 && (
        <div className="completion-ratio">
          {completionRatio}
        </div>
      )}
      
      <div className="habit-indicators">
        {visibleDots.map((habit, index) => (
          <div 
            key={habit.habitId}
            className="habit-dot"
            style={{ 
              backgroundColor: habit.habitColor,
              zIndex: visibleDots.length - index 
            }}
            title={habit.habitName}
          />
        ))}
        {overflowCount > 0 && (
          <div className="overflow-indicator" title={`+${overflowCount} more habits`}>
            +{overflowCount}
          </div>
        )}
      </div>
      
      {isHovered && visibleCompletedHabits.length > 0 && (
        <div className="hover-preview">
          {visibleCompletedHabits.slice(0, 3).map(habit => (
            <span key={habit.habitId} className="habit-preview">
              {habit.habitName}
            </span>
          ))}
          {visibleCompletedHabits.length > 3 && (
            <span className="more-habits">
              +{visibleCompletedHabits.length - 3} more
            </span>
          )}
        </div>
      )}
    </button>
  );
}