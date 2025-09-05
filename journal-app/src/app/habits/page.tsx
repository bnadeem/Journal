'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Habit, HabitStats } from '@/types/journal';
import UnifiedCalendar from '@/components/habits/UnifiedCalendar';
import HabitLegend from '@/components/habits/HabitLegend';
import DayDetailModal from '@/components/habits/DayDetailModal';
import { HabitCompletion } from '@/components/habits/UnifiedCalendarDay';
import '@/components/habits/unified-calendar.css';
import '@/components/habits/habit-legend.css';
import '@/components/habits/day-detail-modal.css';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitStats, setHabitStats] = useState<Record<string, HabitStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [visibleHabits, setVisibleHabits] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: '',
    color: '#3b82f6',
    targetFrequency: 'daily' as 'daily' | 'weekly' | 'monthly',
  });

  useEffect(() => {
    fetchHabits();
  }, []);

  const fetchHabits = async () => {
    try {
      const response = await fetch('/api/habits');
      if (response.ok) {
        const habitsData = await response.json();
        setHabits(habitsData);
        
        // Set all habits as visible by default
        setVisibleHabits(habitsData.map((h: Habit) => h.id));
        
        // Fetch stats for each habit
        const statsPromises = habitsData.map(async (habit: Habit) => {
          try {
            const statsResponse = await fetch(`/api/habits/stats?habitId=${habit.id}`);
            if (statsResponse.ok) {
              const stats = await statsResponse.json();
              return { habitId: habit.id, stats };
            }
          } catch (error) {
            console.error(`Error fetching stats for habit ${habit.id}:`, error);
          }
          return { habitId: habit.id, stats: null };
        });
        
        const statsResults = await Promise.all(statsPromises);
        const statsMap: Record<string, HabitStats> = {};
        statsResults.forEach(({ habitId, stats }) => {
          if (stats) {
            statsMap[habitId] = stats;
          }
        });
        setHabitStats(statsMap);
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createHabit = async () => {
    try {
      const response = await fetch('/api/habits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newHabit),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setNewHabit({
          name: '',
          description: '',
          category: '',
          color: '#3b82f6',
          targetFrequency: 'daily',
        });
        fetchHabits();
      }
    } catch (error) {
      console.error('Error creating habit:', error);
    }
  };

  const toggleHabitVisibility = (habitId: string) => {
    setVisibleHabits(prev => 
      prev.includes(habitId) 
        ? prev.filter(id => id !== habitId)
        : [...prev, habitId]
    );
  };

  const openHabitEditor = (habitId: string) => {
    // For now, just show an alert - can implement proper edit modal later
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      alert(`Edit ${habit.name} - Feature coming soon!`);
    }
  };

  const handleDayClick = (date: Date, dayHabits: HabitCompletion[]) => {
    setSelectedDay(date);
  };

  const handleToggleHabit = async (habitId: string, date: Date) => {
    try {
      const dateString = date.toISOString().split('T')[0];
      
      // First, get current status
      const response = await fetch(`/api/habits/${habitId}/logs?startDate=${dateString}&endDate=${dateString}`);
      if (!response.ok) throw new Error('Failed to fetch current status');
      
      const logs = await response.json();
      const currentLog = logs.find((log: any) => log.date === dateString);
      const currentStatus = currentLog?.completed || false;
      
      // Toggle the status
      const updateResponse = await fetch(`/api/habits/${habitId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          date: dateString,
          completed: !currentStatus
        })
      });
      
      if (!updateResponse.ok) {
        throw new Error('Failed to update habit');
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      throw error;
    }
  };

  const getHexColor = (colorName: string): string => {
    const colorMap: Record<string, string> = {
      blue: '#3b82f6',
      green: '#10b981',
      purple: '#8b5cf6',
      orange: '#f97316',
      pink: '#ec4899',
      indigo: '#6366f1',
      red: '#ef4444',
      yellow: '#eab308',
      emerald: '#059669',
      cyan: '#06b6d4'
    };
    return colorMap[colorName] || colorName;
  };

  const toggleHabitActive = async (habitId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: habitId, isActive }),
      });

      if (response.ok) {
        fetchHabits();
      }
    } catch (error) {
      console.error('Error updating habit:', error);
    }
  };

  const deleteHabit = async (habitId: string) => {
    if (confirm('Are you sure you want to delete this habit?')) {
      try {
        const response = await fetch(`/api/habits?id=${habitId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchHabits();
        }
      } catch (error) {
        console.error('Error deleting habit:', error);
      }
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      orange: 'bg-orange-100 text-orange-800 border-orange-200',
      pink: 'bg-pink-100 text-pink-800 border-pink-200',
      indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Habit Tracker</h1>
                <p className="text-gray-600 text-sm">Manage and track your daily habits</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400"
              >
                ← Back to Journal
              </Link>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Add New Habit
              </button>
            </div>
          </div>

          {/* Summary Stats Cards */}
          {habits.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{habits.filter(h => h.isActive).length}</p>
                    <p className="text-gray-600 text-sm">Active Habits</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(Object.values(habitStats).reduce((acc, stat) => acc + stat.completionRate, 0) / Math.max(Object.values(habitStats).length, 1))}%
                    </p>
                    <p className="text-gray-600 text-sm">Completion Rate</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.max(...Object.values(habitStats).map(stat => stat.streak), 0)}
                    </p>
                    <p className="text-gray-600 text-sm">Best Streak</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Create Habit Form */}
          {showCreateForm && (
            <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Habit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="e.g., Morning Exercise"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newHabit.category}
                    onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="e.g., Health, Learning"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newHabit.description}
                    onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white placeholder-gray-500"
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { name: 'Blue', value: '#3b82f6' },
                      { name: 'Green', value: '#10b981' },
                      { name: 'Purple', value: '#8b5cf6' },
                      { name: 'Orange', value: '#f97316' },
                      { name: 'Pink', value: '#ec4899' },
                      { name: 'Indigo', value: '#6366f1' },
                      { name: 'Red', value: '#ef4444' },
                      { name: 'Yellow', value: '#eab308' },
                      { name: 'Emerald', value: '#059669' },
                      { name: 'Cyan', value: '#06b6d4' }
                    ].map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setNewHabit({ ...newHabit, color: color.value })}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          newHabit.color === color.value ? 'border-gray-800 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Frequency
                  </label>
                  <select
                    value={newHabit.targetFrequency}
                    onChange={(e) => setNewHabit({ ...newHabit, targetFrequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createHabit}
                  disabled={!newHabit.name}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Habit
                </button>
              </div>
            </div>
          )}

          {/* Compact Habits Overview */}
          {habits.length === 0 ? (
            <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl border border-gray-200 p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-6 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No habits yet</h3>
              <p className="text-gray-600 mb-6">Start building better habits by creating your first one!</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Habit
              </button>
            </div>
          ) : (
            <>
              {/* Modern Habit Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {habits.map((habit) => {
                  const stats = habitStats[habit.id];
                  const completionPercentage = stats ? Math.round(stats.completionRate) : 0;
                  return (
                    <div
                      key={habit.id}
                      className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900 text-lg">{habit.name}</h3>
                          {habit.category && (
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {habit.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleHabitActive(habit.id, !habit.isActive)}
                            className={`text-sm px-3 py-1 rounded-full transition-colors ${
                              habit.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {habit.isActive ? 'Active' : 'Inactive'}
                          </button>
                          <button
                            onClick={() => deleteHabit(habit.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {stats && (
                        <>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                <span className="text-gray-600">{stats.streak}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <div 
                                  className="w-2 h-2 rounded-full"
                                  style={{ backgroundColor: getHexColor(habit.color || '#3b82f6') }}
                                ></div>
                                <span className="text-gray-600">{stats.bestStreak}</span>
                              </span>
                              <span className="font-semibold text-gray-900">{completionPercentage}%</span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {stats.completedDays}/{stats.totalDays}
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="text-xs text-gray-600 mb-2">Progress</div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all duration-500 ease-out"
                                style={{ 
                                  width: `${completionPercentage}%`,
                                  backgroundColor: getHexColor(habit.color || '#3b82f6')
                                }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>Current: {stats.streak}</span>
                              <span>Goal: {stats.bestStreak}</span>
                              <span>{completionPercentage}% Done</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Habit Legend */}
              <HabitLegend
                habits={habits.map(h => ({ ...h, color: getHexColor(h.color || '#3b82f6') }))}
                visibleHabits={visibleHabits}
                onToggleHabit={toggleHabitVisibility}
                onEditHabit={openHabitEditor}
                onAddHabit={() => setShowCreateForm(true)}
              />

              {/* Activity Heatmap Section */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Activity Heatmap</h2>
                        <p className="text-gray-600 text-sm">Track your habit consistency over time</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Less</span>
                          <div className="flex space-x-1">
                            <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-400 rounded-sm"></div>
                            <div className="w-3 h-3 bg-green-600 rounded-sm"></div>
                          </div>
                          <span className="text-sm text-gray-600">More</span>
                        </div>
                        <div className="text-sm text-blue-600 font-medium">
                          Showing all {habits.length} habits
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <UnifiedCalendar
                    habits={habits.map(h => ({ ...h, color: getHexColor(h.color || '#3b82f6') }))}
                    visibleHabits={visibleHabits}
                    onDayClick={handleDayClick}
                  />
                </div>
                
                {/* Bottom Statistics */}
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="p-2 bg-blue-100 rounded-lg inline-flex mb-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.values(habitStats).reduce((acc, stat) => acc + stat.completedDays, 0)}
                      </p>
                      <p className="text-gray-600 text-sm">Active Days</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="p-2 bg-green-100 rounded-lg inline-flex mb-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.max(...Object.values(habitStats).map(stat => stat.streak), 0)}
                      </p>
                      <p className="text-gray-600 text-sm">Current Streak</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="p-2 bg-purple-100 rounded-lg inline-flex mb-2">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.max(...Object.values(habitStats).map(stat => stat.bestStreak), 0)}
                      </p>
                      <p className="text-gray-600 text-sm">Longest Streak</p>
                    </div>
                    
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="p-2 bg-orange-100 rounded-lg inline-flex mb-2">
                        <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {habits.length > 0 ? (Object.values(habitStats).reduce((acc, stat) => acc + stat.completedDays, 0) / habits.length).toFixed(1) : '0'}
                      </p>
                      <p className="text-gray-600 text-sm">Daily Average</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Day Detail Modal */}
          {selectedDay && (
            <DayDetailModal
              date={selectedDay}
              habits={habits.map(h => ({ ...h, color: getHexColor(h.color || '#3b82f6') }))}
              onClose={() => setSelectedDay(null)}
              onToggleHabit={handleToggleHabit}
            />
          )}
        </div>
      </div>
    </div>
  );
}