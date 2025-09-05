'use client';

import { useState, useEffect } from 'react';
import { Habit, DailyHabits } from '@/types/journal';

interface HabitTrackerProps {
  year: string;
  month: string;
  day: string;
  habits: Habit[];
  dailyHabits: DailyHabits;
  onToggleHabit: (habitId: string) => Promise<void>;
}

export default function HabitTracker({ 
  year, 
  month, 
  day, 
  habits, 
  dailyHabits, 
  onToggleHabit 
}: HabitTrackerProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const handleToggle = async (habitId: string) => {
    setIsUpdating(habitId);
    try {
      await onToggleHabit(habitId);
    } finally {
      setIsUpdating(null);
    }
  };

  const getHabitStatus = (habitId: string) => {
    const habitLog = dailyHabits.habits.find(h => h.habitId === habitId);
    return habitLog?.completed || false;
  };

  const getHabitCompletedTime = (habitId: string) => {
    const habitLog = dailyHabits.habits.find(h => h.habitId === habitId);
    return habitLog?.completedAt;
  };

  const getHabitColor = (habit: Habit) => {
    const colors = {
      blue: 'bg-blue-100 border-blue-300 text-blue-800',
      green: 'bg-green-100 border-green-300 text-green-800',
      purple: 'bg-purple-100 border-purple-300 text-purple-800',
      orange: 'bg-orange-100 border-orange-300 text-orange-800',
      pink: 'bg-pink-100 border-pink-300 text-pink-800',
      indigo: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    };
    return colors[habit.color as keyof typeof colors] || colors.blue;
  };

  if (habits.length === 0) {
    return (
      <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl border border-gray-200 p-8">
        <div className="text-center text-gray-500">
          <div className="w-16 h-16 mx-auto mb-4 opacity-50">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-lg mb-2">No habits to track yet</p>
          <p className="text-sm">Create some habits to start tracking your progress!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl border border-gray-200">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Daily Habits
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Track your progress for {month} {day}, {year}
        </p>
      </div>

      <div className="p-6">
        <div className="grid gap-3">
          {habits.map((habit) => {
            const isCompleted = getHabitStatus(habit.id);
            const completedTime = getHabitCompletedTime(habit.id);
            const isLoading = isUpdating === habit.id;

            return (
              <div
                key={habit.id}
                className={`
                  flex items-center justify-between p-4 rounded-lg border-2 transition-all duration-200
                  ${isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }
                  ${isLoading ? 'opacity-50' : ''}
                `}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <button
                    onClick={() => handleToggle(habit.id)}
                    disabled={isLoading}
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200
                      ${isCompleted
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400 bg-white'
                      }
                      ${isLoading ? 'animate-pulse' : ''}
                    `}
                  >
                    {isCompleted && (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className={`font-medium ${isCompleted ? 'text-green-800' : 'text-gray-900'}`}>
                        {habit.name}
                      </h4>
                      {habit.category && (
                        <span className={`
                          px-2 py-1 rounded-full text-xs font-medium border
                          ${getHabitColor(habit)}
                        `}>
                          {habit.category}
                        </span>
                      )}
                    </div>
                    
                    {habit.description && (
                      <p className={`text-sm mt-1 ${isCompleted ? 'text-green-600' : 'text-gray-600'}`}>
                        {habit.description}
                      </p>
                    )}

                    {isCompleted && completedTime && (
                      <p className="text-xs text-green-600 mt-2 flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Completed at {new Date(completedTime).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {habit.targetFrequency && (
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {habit.targetFrequency}
                    </span>
                  )}
                  
                  {isCompleted && (
                    <div className="text-green-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Daily Progress</span>
            <span className="font-medium text-gray-900">
              {dailyHabits.habits.filter(h => h.completed).length} / {habits.length} completed
            </span>
          </div>
          
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${habits.length > 0 
                  ? (dailyHabits.habits.filter(h => h.completed).length / habits.length) * 100 
                  : 0}%`
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}