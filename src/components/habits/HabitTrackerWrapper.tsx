'use client';

import { useState, useEffect } from 'react';
import HabitTracker from './HabitTracker';
import { Habit, DailyHabits } from '@/types/journal';

interface HabitTrackerWrapperProps {
  year: string;
  month: string;
  day: string;
}

export default function HabitTrackerWrapper({ year, month, day }: HabitTrackerWrapperProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [dailyHabits, setDailyHabits] = useState<DailyHabits>({ 
    date: `${year}-${month}-${day}`, 
    habits: [] 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [year, month, day]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all habits and daily habits in parallel
      const [habitsResponse, dailyHabitsResponse] = await Promise.all([
        fetch('/api/habits'),
        fetch(`/api/habits/daily/${year}/${month}/${day}`)
      ]);

      if (habitsResponse.ok) {
        const habitsData = await habitsResponse.json();
        const activeHabits = habitsData.filter((habit: Habit) => habit.isActive);
        setHabits(activeHabits);
      }

      if (dailyHabitsResponse.ok) {
        const dailyHabitsData = await dailyHabitsResponse.json();
        setDailyHabits(dailyHabitsData);
      }
    } catch (error) {
      console.error('Error fetching habit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    try {
      const response = await fetch(`/api/habits/daily/${year}/${month}/${day}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habitId }),
      });

      if (response.ok) {
        const updatedDailyHabits = await response.json();
        setDailyHabits(updatedDailyHabits);
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
    }
  };

  if (isLoading) {
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
      habits={habits}
      dailyHabits={dailyHabits}
      onToggleHabit={handleToggleHabit}
    />
  );
}