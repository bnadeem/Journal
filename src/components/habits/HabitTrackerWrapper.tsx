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
      
      // Fetch habits first
      const habitsResponse = await fetch('/api/habits');
      if (!habitsResponse.ok) {
        throw new Error('Failed to fetch habits');
      }
      
      const habitsData = await habitsResponse.json();
      const activeHabits = habitsData.filter((habit: Habit) => habit.isActive);
      setHabits(activeHabits);

      // Convert date format to match the database format
      const monthNumber = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
      const dateString = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Fetch habit logs for this specific date using the same API as calendar
      const habitLogs = await Promise.all(
        activeHabits.map(async (habit: Habit) => {
          const response = await fetch(
            `/api/habits/${habit.id}/logs?startDate=${dateString}&endDate=${dateString}`
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch logs for habit ${habit.name}`);
          }
          const logs = await response.json();
          const dayLog = logs.find((log: any) => log.date === dateString);
          
          return {
            habitId: habit.id,
            date: dateString,
            completed: dayLog?.completed || false
          };
        })
      );

      setDailyHabits({
        date: dateString,
        habits: habitLogs
      });
    } catch (error) {
      console.error('Error fetching habit data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleHabit = async (habitId: string) => {
    try {
      // Convert date format to match the database format
      const monthNumber = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(month) + 1;
      const dateString = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // First get current status using the same API as calendar
      const statusResponse = await fetch(`/api/habits/${habitId}/logs?startDate=${dateString}&endDate=${dateString}`);
      if (!statusResponse.ok) throw new Error('Failed to fetch current status');
      
      const logs = await statusResponse.json();
      const currentLog = logs.find((log: any) => log.date === dateString);
      const currentStatus = currentLog?.completed || false;

      // Toggle the status using the same API as calendar
      const toggleResponse = await fetch(`/api/habits/${habitId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          date: dateString, 
          completed: !currentStatus 
        }),
      });

      if (toggleResponse.ok) {
        // Refresh the data using the same method
        await fetchData();
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