'use client';

import { useState } from 'react';
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
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleExpanded = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Expanding calendar for habit:', habit.id);
        await loadCalendarData();
      } catch (err) {
        console.error('Error loading calendar:', err);
        setError('Failed to load calendar data');
      }
    } else {
      setIsExpanded(false);
    }
  };

  const loadCalendarData = async () => {
    try {
      // Date range for current month and last 2 months
      const today = new Date();
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(today.getMonth() - 2);
      twoMonthsAgo.setDate(1); // Start from first day of the month
      
      const startDate = twoMonthsAgo.toISOString().split('T')[0];
      const endDate = today.toISOString().split('T')[0];
      
      const url = `/api/habits/${habit.id}/logs?startDate=${startDate}&endDate=${endDate}`;
      console.log('Fetching from:', url);
      
      const response = await fetch(url);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const habitLogs = await response.json();
      console.log('Got habit logs:', habitLogs.length);
      
      // Generate simple calendar
      const calendar: CalendarDay[] = [];
      const currentDate = new Date(twoMonthsAgo);
      
      while (currentDate <= today) {
        const dateString = currentDate.toISOString().split('T')[0];
        const habitLog = habitLogs.find((log: HabitLog) => log.date === dateString);
        
        calendar.push({
          date: new Date(currentDate),
          isCurrentMonth: true,
          isToday: currentDate.toDateString() === today.toDateString(),
          isCompleted: habitLog?.completed || false,
          habitLog
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      console.log('Generated calendar with', calendar.length, 'days');
      setCalendarData(calendar);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayAbbreviation = (dayIndex: number) => {
    const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    return days[dayIndex];
  };

  const groupDaysByMonth = (days: CalendarDay[]) => {
    const grouped: { [key: string]: CalendarDay[] } = {};
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

  const createCalendarGrid = (monthDays: CalendarDay[]) => {
    if (monthDays.length === 0) return [];
    
    // Sort days by date to ensure proper order
    const sortedDays = [...monthDays].sort((a, b) => a.date.getTime() - b.date.getTime());
    const firstDay = sortedDays[0];
    const lastDay = sortedDays[sortedDays.length - 1];
    
    // Get the first day of the month and its day of week
    const startOfMonth = new Date(firstDay.date.getFullYear(), firstDay.date.getMonth(), 1);
    const endOfMonth = new Date(lastDay.date.getFullYear(), lastDay.date.getMonth() + 1, 0);
    const startDay = startOfMonth.getDay(); // 0 = Sunday
    
    // Create complete month grid with padding
    const paddingDays = Array(startDay).fill(null);
    
    // Fill in all days of the month, even if not in our data range
    const allMonthDays = [];
    const currentDate = new Date(startOfMonth);
    
    while (currentDate <= endOfMonth) {
      const existingDay = sortedDays.find(d => 
        d.date.toDateString() === currentDate.toDateString()
      );
      
      if (existingDay) {
        allMonthDays.push(existingDay);
      } else {
        // Create placeholder for days outside our data range
        allMonthDays.push({
          date: new Date(currentDate),
          isCurrentMonth: true,
          isToday: currentDate.toDateString() === new Date().toDateString(),
          isCompleted: false,
          habitLog: undefined
        } as CalendarDay);
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return [...paddingDays, ...allMonthDays];
  };

  const toggleDayCompletion = async (day: CalendarDay) => {
    const newCompletedStatus = !day.isCompleted;
    
    // Optimistic update
    setCalendarData(prevData => 
      prevData.map(d => 
        d.date.toDateString() === day.date.toDateString() 
          ? { ...d, isCompleted: newCompletedStatus }
          : d
      )
    );

    try {
      const response = await fetch(`/api/habits/${habit.id}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: day.date.toISOString().split('T')[0],
          completed: newCompletedStatus
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to update habit: ${response.status}`);
      }
    } catch (error) {
      console.error('Error toggling habit completion:', error);
      
      // Revert optimistic update on error
      setCalendarData(prevData => 
        prevData.map(d => 
          d.date.toDateString() === day.date.toDateString() 
            ? { ...d, isCompleted: day.isCompleted }
            : d
        )
      );
      
      setError('Failed to update habit completion');
    }
  };


  // Calculate date range for UI logic
  const today = new Date();
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(today.getMonth() - 2);
  twoMonthsAgo.setDate(1);

  const completedDays = calendarData.filter(day => day.isCompleted).length;
  const totalDays = calendarData.length;
  const completionPercentage = totalDays > 0 ? (completedDays / totalDays * 100).toFixed(1) : '0.0';

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Header - Always visible */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <h4 className="font-medium text-gray-900">Activity Calendar</h4>
          </div>
          
          {!isExpanded && totalDays > 0 && (
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-gray-600">{completedDays}</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-200 rounded-full"></div>
                <span className="text-gray-600">{totalDays - completedDays}</span>
              </div>
              <span className="font-medium text-green-600">{completionPercentage}%</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span className="text-gray-400">
            {isExpanded ? 'Click to collapse' : 'Click to expand'}
          </span>
        </div>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="border-t border-gray-100">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-sm text-gray-600">Loading calendar...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-600">
              <span>{error}</span>
            </div>
          ) : (
            <>
              <div className="p-4">
                {/* Day headers - shown once at the top */}
                <div className="grid grid-cols-7 gap-px mb-4 sticky top-0 bg-white border border-gray-200 rounded-md overflow-hidden">
                  {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => (
                    <div key={dayIndex} className="text-center text-xs font-semibold text-gray-600 py-3 bg-gray-50 border-r border-gray-200 last:border-r-0">
                      {getDayAbbreviation(dayIndex)}
                    </div>
                  ))}
                </div>
                
                {/* Monthly calendar sections */}
                <div className="space-y-6">
                  {Object.entries(groupDaysByMonth(calendarData))
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(-3) // Only show last 3 months
                    .map(([monthKey, monthDays]) => {
                      const gridDays = createCalendarGrid(monthDays);
                      return (
                        <div key={monthKey} className="space-y-2">
                          {/* Month header */}
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            {getMonthName(monthDays[0].date)}
                          </h5>
                          
                          {/* Calendar grid for this month */}
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="grid grid-cols-7 gap-px bg-gray-200">
                              {gridDays.map((day, index) => {
                                if (!day) {
                                  // Empty padding cell
                                  return <div key={`empty-${index}`} className="w-10 h-10 bg-white"></div>;
                                }
                                
                                const isInTrackingRange = day.date >= twoMonthsAgo && day.date <= today;
                                
                                return (
                                  <button
                                    key={`${day.date.toISOString()}-${index}`}
                                    onClick={() => isInTrackingRange ? toggleDayCompletion(day) : undefined}
                                    disabled={!isInTrackingRange}
                                    className={`
                                      w-10 h-10 text-xs flex items-center justify-center font-medium transition-all
                                      ${!isInTrackingRange 
                                        ? 'opacity-40 cursor-not-allowed text-gray-400 bg-white' 
                                        : day.isCompleted 
                                          ? 'bg-green-500 text-white hover:bg-green-600 cursor-pointer'
                                          : 'bg-white text-gray-700 hover:bg-gray-100 cursor-pointer'
                                      }
                                      ${day.isToday ? 'ring-2 ring-blue-400 ring-inset z-10' : ''}
                                      ${isInTrackingRange ? 'focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-inset focus:z-10' : ''}
                                    `}
                                    title={
                                      isInTrackingRange 
                                        ? `${day.date.toLocaleDateString()} - Click to ${day.isCompleted ? 'mark incomplete' : 'mark complete'}`
                                        : `${day.date.toLocaleDateString()} - Outside tracking range`
                                    }
                                  >
                                    {day.date.getDate()}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Summary stats */}
              {totalDays > 0 && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600">Last 3 months</span>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-700">
                        {completedDays} / {totalDays} days
                      </span>
                      <span className="font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full text-xs">
                        {completionPercentage}%
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}