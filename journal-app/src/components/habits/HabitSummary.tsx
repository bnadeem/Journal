'use client';

import { useMemo } from 'react';
import { HabitCompletion } from './UnifiedCalendarDay';
import { HabitScore, groupHabitsByPriority } from '@/lib/habit-scoring';

interface HabitDotProps {
  habit: HabitCompletion;
  size: 'large' | 'medium' | 'small';
  className?: string;
  showIcon?: boolean;
}

const HabitDot = ({ habit, size, className = '', showIcon = false }: HabitDotProps) => {
  return (
    <div 
      className={`habit-dot size-${size} ${className}`}
      style={{ backgroundColor: habit.habitColor }}
      title={habit.habitName}
    >
      {showIcon && size === 'large' && (
        <span className="habit-icon">✓</span>
      )}
    </div>
  );
};

interface HabitSummaryProps {
  completedHabits: HabitCompletion[];
  habitScores: Record<string, HabitScore>;
  className?: string;
}

export default function HabitSummary({ 
  completedHabits, 
  habitScores, 
  className = '' 
}: HabitSummaryProps) {
  const { primary, secondary, tertiary } = useMemo(() => 
    groupHabitsByPriority(completedHabits, habitScores), 
    [completedHabits, habitScores]
  );

  const totalCount = completedHabits.length;

  if (totalCount === 0) {
    return null;
  }

  return (
    <div className={`habit-summary ${className}`}>
      {/* Primary Habit - Most Important */}
      {primary.length > 0 && (
        <div className="primary-habit-container">
          <HabitDot 
            habit={primary[0]} 
            size="large" 
            className="primary-habit"
            showIcon={true}
          />
        </div>
      )}
      
      {/* Secondary Habits */}
      {secondary.length > 0 && (
        <div className="secondary-habits-container">
          {secondary.map(habit => (
            <HabitDot 
              key={habit.habitId}
              habit={habit} 
              size="medium"
              className="secondary-habit"
            />
          ))}
        </div>
      )}
      
      {/* Tertiary Habits - Grouped */}
      {tertiary.length > 0 && (
        <div className="tertiary-habits-container">
          {tertiary.slice(0, 2).map(habit => (
            <HabitDot 
              key={habit.habitId}
              habit={habit} 
              size="small"
              className="tertiary-habit"
            />
          ))}
          
          {tertiary.length > 2 && (
            <div className="overflow-indicator large" title={`${tertiary.length - 2} more habits completed`}>
              +{tertiary.length - 2}
            </div>
          )}
        </div>
      )}
      
      {/* Quick Stats Overlay */}
      {totalCount >= 3 && (
        <div className="completion-badge">
          {totalCount}
        </div>
      )}
    </div>
  );
}

export { HabitDot };