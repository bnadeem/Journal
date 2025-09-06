'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Habit, HabitLog } from '@/types/journal';
import UnifiedCalendarDay, { HabitCompletion, UnifiedCalendarDayData } from './UnifiedCalendarDay';

interface UnifiedCalendarProps {
  habits: Habit[];
  visibleHabits: string[];
  onDayClick: (date: Date, dateString: string, habits: HabitCompletion[]) => void;
}

export default function UnifiedCalendar({ 
  habits, 
  visibleHabits, 
  onDayClick 
}: UnifiedCalendarProps) {
  const [calendarData, setCalendarData] = useState<UnifiedCalendarDayData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [focusedDayIndex, setFocusedDayIndex] = useState<number>(-1);
  const calendarRef = useRef<HTMLDivElement>(null);
  const dayRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    loadCalendarData();
  }, [habits]);

  const loadCalendarData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Date range for current month and last 2 months, plus a few days into future
      const today = new Date();
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(today.getMonth() - 2);
      twoMonthsAgo.setDate(1);
      
      const futureDate = new Date(today);
      futureDate.setDate(today.getDate() + 7); // Include next 7 days

      // Fetch habit logs for all habits
      const allHabitLogs = await Promise.all(
        habits.map(async (habit) => {
          const startDate = twoMonthsAgo.toISOString().split('T')[0];
          const endDate = futureDate.toISOString().split('T')[0];
          
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
            habitColor: habit.color || '#3b82f6',
            completed: dayLog?.completed || false
          };
        });

        const completedCount = dayHabits.filter(h => h.completed).length;
        
        calendar.push({
          date: new Date(currentDate),
          dateString: dateString, // Pass the same dateString used for data lookup
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
            habitColor: habit.color || '#3b82f6',
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

  const focusDay = useCallback((index: number) => {
    if (index >= 0 && index < calendarData.length && dayRefs.current[index]) {
      setFocusedDayIndex(index);
      dayRefs.current[index]?.focus();
    }
  }, [calendarData.length]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, dayIndex: number) => {
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        focusDay(Math.max(0, dayIndex - 7));
        break;
      case 'ArrowDown':
        e.preventDefault();
        focusDay(Math.min(calendarData.length - 1, dayIndex + 7));
        break;
      case 'ArrowLeft':
        e.preventDefault();
        focusDay(Math.max(0, dayIndex - 1));
        break;
      case 'ArrowRight':
        e.preventDefault();
        focusDay(Math.min(calendarData.length - 1, dayIndex + 1));
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        const day = calendarData[dayIndex];
        if (day) {
          onDayClick(day.date, day.dateString, day.habits);
        }
        break;
      case 'Home':
        e.preventDefault();
        focusDay(0);
        break;
      case 'End':
        e.preventDefault();
        focusDay(calendarData.length - 1);
        break;
    }
  }, [calendarData, focusDay, onDayClick]);

  // Initialize dayRefs array when calendar data changes
  useEffect(() => {
    dayRefs.current = dayRefs.current.slice(0, calendarData.length);
  }, [calendarData.length]);

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
    <div 
      className="unified-calendar"
      role="grid"
      aria-label="Habit tracking calendar showing last 3 months"
    >
      {/* Day headers */}
      <div 
        className="calendar-day-headers"
        role="row"
      >
        {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
          <div 
            key={dayIndex} 
            className="day-header"
            role="columnheader"
            aria-label={`${getDayAbbreviation(dayIndex)} column`}
          >
            {getDayAbbreviation(dayIndex)}
          </div>
        ))}
      </div>

      {/* Monthly calendar sections */}
      <div className="calendar-months">
        {Object.entries(groupDaysByMonth(calendarData))
          .sort(([a], [b]) => b.localeCompare(a))
          .slice(0, 3)
          .map(([monthKey, monthDays]) => {
            const gridDays = createCalendarGrid(monthDays);
            return (
              <div key={monthKey} className="calendar-month-section">
                <h3 className="month-header">
                  {getMonthName(monthDays[0].date)}
                </h3>
                
                <div className="calendar-month-grid">
                  {gridDays.map((day, gridIndex) => {
                    if (!day) {
                      return <div key={`empty-${gridIndex}`} className="empty-day-cell"></div>;
                    }
                    
                    const dayIndex = calendarData.findIndex(d => 
                      d.date.toDateString() === day.date.toDateString()
                    );
                    
                    return (
                      <div
                        key={`${day.date.toISOString()}-${gridIndex}`}
                        data-day-index={dayIndex}
                        onKeyDown={(e) => handleKeyDown(e, dayIndex)}
                        tabIndex={dayIndex === focusedDayIndex ? 0 : -1}
                        role="gridcell"
                        aria-label={`${day.date.toLocaleDateString()}, ${day.habits.filter((h: HabitCompletion) => h.completed && visibleHabits.includes(h.habitId)).length} of ${day.habits.filter((h: HabitCompletion) => visibleHabits.includes(h.habitId)).length} habits completed${day.isToday ? ', today' : ''}`}
                        aria-describedby={`day-${day.date.getDate()}-details`}
                      >
                        <UnifiedCalendarDay
                          dayData={day}
                          visibleHabits={visibleHabits}
                          onDayClick={onDayClick}
                        />
                      </div>
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