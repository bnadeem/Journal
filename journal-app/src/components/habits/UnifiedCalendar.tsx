'use client';

import { useState, useEffect } from 'react';
import { Habit, HabitLog } from '@/types/journal';
import UnifiedCalendarDay, { HabitCompletion, UnifiedCalendarDayData } from './UnifiedCalendarDay';

interface UnifiedCalendarProps {
  habits: Habit[];
  visibleHabits: string[];
  onDayClick: (date: Date, habits: HabitCompletion[]) => void;
}

export default function UnifiedCalendar({ 
  habits, 
  visibleHabits, 
  onDayClick 
}: UnifiedCalendarProps) {
  const [calendarData, setCalendarData] = useState<UnifiedCalendarDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCalendarData();
  }, [habits]);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Date range for current month and last 2 months
      const today = new Date();
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(today.getMonth() - 2);
      twoMonthsAgo.setDate(1);

      // Fetch habit logs for all habits
      const allHabitLogs = await Promise.all(
        habits.map(async (habit) => {
          const startDate = twoMonthsAgo.toISOString().split('T')[0];
          const endDate = today.toISOString().split('T')[0];
          
          const response = await fetch(
            `/api/habits/${habit.id}/logs?startDate=${startDate}&endDate=${endDate}`
          );
          
          if (!response.ok) {
            throw new Error(`Failed to fetch logs for habit ${habit.name}`);
          }
          
          const logs = await response.json();
          return { habit, logs };
        })
      );

      // Generate calendar data
      const calendar: UnifiedCalendarDayData[] = [];
      const currentDate = new Date(twoMonthsAgo);

      while (currentDate <= today) {
        const dateString = currentDate.toISOString().split('T')[0];
        
        // Get habit completions for this date
        const dayHabits: HabitCompletion[] = allHabitLogs.map(({ habit, logs }) => {
          const dayLog = logs.find((log: HabitLog) => log.date === dateString);
          return {
            habitId: habit.id,
            habitName: habit.name,
            habitColor: habit.color,
            completed: dayLog?.completed || false
          };
        });

        const completedCount = dayHabits.filter(h => h.completed).length;
        
        calendar.push({
          date: new Date(currentDate),
          habits: dayHabits,
          totalHabits: habits.length,
          completionRate: habits.length > 0 ? (completedCount / habits.length) * 100 : 0,
          isToday: currentDate.toDateString() === today.toDateString()
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }

      setCalendarData(calendar);
    } catch (err) {
      console.error('Error loading unified calendar:', err);
      setError('Failed to load calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  const groupDaysByMonth = (days: UnifiedCalendarDayData[]) => {
    const grouped: { [key: string]: UnifiedCalendarDayData[] } = {};
    days.forEach(day => {
      const monthKey = `${day.date.getFullYear()}-${day.date.getMonth()}`;
      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }
      grouped[monthKey].push(day);
    });
    return grouped;
  };

  const getMonthName = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  const createCalendarGrid = (monthDays: UnifiedCalendarDayData[]) => {
    if (monthDays.length === 0) return [];
    
    const sortedDays = [...monthDays].sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstDay = sortedDays[0];
    const lastDay = sortedDays[sortedDays.length - 1];
    
    const startOfMonth = new Date(firstDay.date.getFullYear(), firstDay.date.getMonth(), 1);
    const endOfMonth = new Date(lastDay.date.getFullYear(), lastDay.date.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay();
    
    const paddingDays = Array(startDay).fill(null);
    
    const allMonthDays = [];
    const currentDate = new Date(startOfMonth);
    
    while (currentDate <= endOfMonth) {
      const existingDay = sortedDays.find(d => 
        d.date.toDateString() === currentDate.toDateString()
      );
      
      if (existingDay) {
        allMonthDays.push(existingDay);
      } else {
        allMonthDays.push({
          date: new Date(currentDate),
          habits: habits.map(habit => ({
            habitId: habit.id,
            habitName: habit.name,
            habitColor: habit.color,
            completed: false
          })),
          totalHabits: habits.length,
          completionRate: 0,
          isToday: currentDate.toDateString() === new Date().toDateString()
        } as UnifiedCalendarDayData);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return [...paddingDays, ...allMonthDays];
  };

  const getDayAbbreviation = (dayIndex: number) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[dayIndex];
  };

  if (isLoading) {
    return (
      <div className="unified-calendar-loading">
        <div className="loading-spinner"></div>
        <span>Loading calendar...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="unified-calendar-error">
        <span>{error}</span>
        <button onClick={loadCalendarData}>Retry</button>
      </div>
    );
  }

  return (
    <div className="unified-calendar">
      {/* Day headers */}
      <div className="calendar-day-headers">
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
          <div key={dayIndex} className="day-header">
            {getDayAbbreviation(dayIndex)}
          </div>
        ))}
      </div>

      {/* Monthly calendar sections */}
      <div className="calendar-months">
        {Object.entries(groupDaysByMonth(calendarData))
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(-3)
          .map(([monthKey, monthDays]) => {
            const gridDays = createCalendarGrid(monthDays);
            return (
              <div key={monthKey} className="calendar-month-section">
                <h3 className="month-header">
                  {getMonthName(monthDays[0].date)}
                </h3>
                
                <div className="calendar-month-grid">
                  {gridDays.map((day, index) => {
                    if (!day) {
                      return <div key={`empty-${index}`} className="empty-day-cell"></div>;
                    }
                    
                    return (
                      <UnifiedCalendarDay
                        key={`${day.date.toISOString()}-${index}`}
                        dayData={day}
                        visibleHabits={visibleHabits}
                        onDayClick={onDayClick}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}