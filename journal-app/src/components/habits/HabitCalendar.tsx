'use client';

import { useState, useEffect } from 'react';
import { Habit, HabitLog } from '@/types/journal';

interface HabitCalendarProps {
  habit: Habit;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isCompleted: boolean;
  habitLog?: HabitLog;
}

export default function HabitCalendar({ habit }: HabitCalendarProps) {
  const [calendarData, setCalendarData] = useState<CalendarDay[]>([]);
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateCalendarData();
  }, [habit.id, currentViewDate]);

  const generateCalendarData = async () => {
    setIsLoading(true);
    
    try {
      // Get habit completion data for the last 3 months
      const today = new Date();
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(today.getMonth() - 3);
      
      const startDate = threeMonthsAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const habitLogs = await fetchHabitLogs(startDate, endDate);
      
      const calendar: CalendarDay[] = [];
      
      // Generate all days for the last 3 months
      const currentDate = new Date(threeMonthsAgo);
      while (currentDate <= today) {
        const dateString = currentDate.toISOString().split('T')[0];
        const habitLog = habitLogs.find(log => log.date === dateString);
        
        calendar.push({
          date: new Date(currentDate),
          isCurrentMonth: true,
          isToday: currentDate.toDateString() === today.toDateString(),
          isCompleted: habitLog?.completed || false,
          habitLog
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      setCalendarData(calendar);
    } catch (error) {
      console.error('Error generating calendar data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHabitLogs = async (startDate?: string, endDate?: string): Promise<HabitLog[]> => {
    try {
      let url = `/api/habits/${habit.id}/logs`;
      const params = new URLSearchParams();
      
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching habit logs:', error);
    }
    return [];
  };

  const getMonthGroups = () => {
    const groups: { month: string; days: CalendarDay[] }[] = [];
    const today = new Date();
    
    for (let monthOffset = -2; monthOffset <= 0; monthOffset++) {
      const monthDate = new Date();
      monthDate.setMonth(today.getMonth() + monthOffset);
      
      const monthName = monthDate.toLocaleString('default', { month: 'long', year: 'numeric' });
      const monthDays = calendarData.filter(day => 
        day.date.getMonth() === monthDate.getMonth() && 
        day.date.getFullYear() === monthDate.getFullYear()
      );
      
      if (monthDays.length > 0) {
        groups.push({
          month: monthName,
          days: monthDays
        });
      }
    }
    
    return groups;
  };

  const getDayOfWeek = (dayIndex: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[dayIndex];
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        <h4 className="font-medium text-gray-900 mb-3">Activity Calendar</h4>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading calendar...</span>
        </div>
      </div>
    );
  }

  const monthGroups = getMonthGroups();

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-gray-900">Activity Calendar - Last 3 Months</h4>
        <div className="flex items-center text-xs text-gray-500 space-x-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded mr-1"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-200 rounded mr-1"></div>
            <span>Missed</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {monthGroups.map((group) => (
          <div key={group.month} className="space-y-2">
            <h5 className="text-sm font-medium text-gray-700">{group.month}</h5>
            
            {/* Simple grid of days */}
            <div className="flex flex-wrap gap-1">
              {group.days.map((day, index) => (
                <div
                  key={index}
                  className={`
                    w-6 h-6 rounded text-xs flex items-center justify-center font-medium transition-all
                    ${day.isToday ? 'ring-2 ring-blue-400' : ''}
                    ${day.isCompleted 
                      ? 'bg-green-400 text-white' 
                      : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }
                  `}
                  title={`${day.date.toLocaleDateString()} - ${day.isCompleted ? 'Completed ✓' : 'Not completed'}`}
                >
                  {day.date.getDate()}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Summary stats */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-600">
          <span>Last 3 months performance</span>
          <span className="font-medium">
            {calendarData.filter(day => day.isCompleted).length} / {calendarData.length} days
            {' '}
            ({((calendarData.filter(day => day.isCompleted).length / calendarData.length) * 100).toFixed(1)}%)
          </span>
        </div>
      </div>
    </div>
  );
}