'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { MONTH_NAMES, MONTH_FULL_NAMES, MonthName } from '@/types/journal';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';

interface CalendarEntry {
  date: string;
  hasEntry: boolean;
}

interface CalendarViewProps {
  year?: string;
  month?: MonthName;
  entries?: CalendarEntry[];
  onMonthChange?: (year: string, month: MonthName) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView({ 
  year, 
  month, 
  entries = [], 
  onMonthChange 
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(() => {
    if (year && month) {
      const monthIndex = MONTH_NAMES.indexOf(month);
      return new Date(parseInt(year), monthIndex, 1);
    }
    return new Date();
  });

  // Update currentDate when props change
  useEffect(() => {
    if (year && month) {
      const monthIndex = MONTH_NAMES.indexOf(month);
      const newDate = new Date(parseInt(year), monthIndex, 1);
      setCurrentDate(newDate);
    }
  }, [year, month]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay());
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' 
      ? subMonths(currentDate, 1)
      : addMonths(currentDate, 1);
    
    setCurrentDate(newDate);
    
    const newYear = newDate.getFullYear().toString();
    const newMonth = MONTH_NAMES[newDate.getMonth()] as MonthName;
    
    if (onMonthChange) {
      onMonthChange(newYear, newMonth);
    }
  };

  const hasEntryForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return entries.some(entry => entry.date === dateString && entry.hasEntry);
  };

  const currentYear = currentDate.getFullYear().toString();
  const currentMonth = MONTH_NAMES[currentDate.getMonth()] as MonthName;

  return (
    <div className="bg-white/80 backdrop-blur rounded-lg shadow-lg border border-gray-200">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
        </button>
        
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {MONTH_FULL_NAMES[currentMonth]} {currentYear}
          </h2>
          <Link
            href={`/month/${currentYear}/${currentMonth}`}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            View Month
          </Link>
        </div>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRightIcon className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 mb-4">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="p-2 text-center text-sm font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date) => {
            const dayNumber = date.getDate();
            const isCurrentMonth = isSameMonth(date, currentDate);
            const isToday = isSameDay(date, new Date());
            const hasEntry = hasEntryForDate(date);
            const dateYear = date.getFullYear().toString();
            const dateMonth = MONTH_NAMES[date.getMonth()] as MonthName;
            const dateDay = dayNumber.toString();

            return (
              <div
                key={date.toISOString()}
                className={`
                  relative p-2 h-12 flex items-center justify-center text-sm
                  ${isCurrentMonth 
                    ? 'text-gray-900' 
                    : 'text-gray-400'
                  }
                  ${isToday 
                    ? 'bg-blue-100 text-blue-900 font-semibold' 
                    : ''
                  }
                  hover:bg-gray-100 transition-colors cursor-pointer
                `}
              >
                {hasEntry ? (
                  <Link
                    href={`/entry/${dateYear}/${dateMonth}/${dateDay}`}
                    className="w-full h-full flex items-center justify-center relative"
                  >
                    <span className="relative z-10">{dayNumber}</span>
                    <div className="absolute inset-0 bg-green-100 border-2 border-green-300 rounded-lg opacity-80"></div>
                  </Link>
                ) : isCurrentMonth ? (
                  <Link
                    href={`/edit?year=${dateYear}&month=${dateMonth}&day=${dateDay}`}
                    className="w-full h-full flex items-center justify-center hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    {dayNumber}
                  </Link>
                ) : (
                  <span>{dayNumber}</span>
                )}
                
                {/* Entry indicator dot */}
                {hasEntry && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
            <span>Has Entry</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
            <span>Entry Indicator</span>
          </div>
        </div>
      </div>
    </div>
  );
}