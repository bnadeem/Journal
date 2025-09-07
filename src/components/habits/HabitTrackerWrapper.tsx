'use client';

import { useMemo, useTransition } from 'react';
import HabitTracker from './HabitTracker';
import { DailyHabits, Habit, HabitLog } from '@/types/journal';
import { toggleHabitAction } from '@/app/actions';

interface HabitTrackerWrapperProps {
  year: string;
  month: string;
  day: string;
  initialHabits: Habit[];
  initialHabitLogs: Record<string, HabitLog[]>;
}

export default function HabitTrackerWrapper({ 
  year, 
  month, 
  day, 
  initialHabits, 
  initialHabitLogs 
}: HabitTrackerWrapperProps) {
  const [isPending, startTransition] = useTransition();

  const dateString = useMemo(() => {
    const monthNumber = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
    return `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }, [year, month, day]);

  const dailyHabits = useMemo<DailyHabits>(() => {
    const activeHabits = initialHabits.filter(habit => habit.isActive);
    
    const dailyHabitCompletions = activeHabits.map(habit => {
      const logs = initialHabitLogs[habit.id] || [];
      const dayLog = logs.find(log => log.date === dateString);
      return {
        habitId: habit.id,
        date: dateString,
        completed: dayLog?.completed || false,
      };
    });

    return {
      date: dateString,
      habits: dailyHabitCompletions,
    };
  }, [initialHabits, initialHabitLogs, dateString]);

  const handleToggleHabit = async (habitId: string) => {
    const monthNumber = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
    const dateString = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    startTransition(() => {
      toggleHabitAction(habitId, dateString, { year, month, day });
    });
  };

  if (isPending) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-3 text-gray-600">Loading habits...</span>
        </div>
      </div>
    );
  }

  return (
    <HabitTracker
      year={year}
      month={month}
      day={day}
      habits={initialHabits.filter(h => h.isActive)}
      dailyHabits={dailyHabits}
      onToggleHabit={handleToggleHabit}
    />
  );
}