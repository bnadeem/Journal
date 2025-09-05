'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Habit, HabitStats } from '@/types/journal';
import HabitCalendar from '@/components/habits/HabitCalendar';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitStats, setHabitStats] = useState<Record<string, HabitStats>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    category: '',
    color: 'blue',
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
          color: 'blue',
          targetFrequency: 'daily',
        });
        fetchHabits();
      }
    } catch (error) {
      console.error('Error creating habit:', error);
    }
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Habit Tracker</h1>
              <p className="text-gray-600">Manage and track your daily habits</p>
            </div>
            <div className="flex space-x-4">
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                ← Back to Journal
              </Link>
              <button
                onClick={() => setShowCreateForm(true)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add New Habit
              </button>
            </div>
          </div>

          {/* Create Habit Form */}
          {showCreateForm && (
            <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl border border-gray-200 p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Create New Habit</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Habit Name *
                  </label>
                  <input
                    type="text"
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional description..."
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <select
                    value={newHabit.color}
                    onChange={(e) => setNewHabit({ ...newHabit, color: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="blue">Blue</option>
                    <option value="green">Green</option>
                    <option value="purple">Purple</option>
                    <option value="orange">Orange</option>
                    <option value="pink">Pink</option>
                    <option value="indigo">Indigo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Target Frequency
                  </label>
                  <select
                    value={newHabit.targetFrequency}
                    onChange={(e) => setNewHabit({ ...newHabit, targetFrequency: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

          {/* Habits List */}
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
            <div className="grid gap-6">
              {habits.map((habit) => {
                const stats = habitStats[habit.id];
                return (
                  <div
                    key={habit.id}
                    className="bg-white/90 backdrop-blur rounded-lg shadow-xl border border-gray-200 p-6"
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">{habit.name}</h3>
                          {habit.category && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getColorClasses(habit.color || 'blue')}`}>
                              {habit.category}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            habit.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {habit.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        {habit.description && (
                          <p className="text-gray-600 mb-4">{habit.description}</p>
                        )}

                        {stats && (
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="font-semibold text-gray-900">{stats.completionRate.toFixed(1)}%</div>
                              <div className="text-gray-600">Success Rate</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="font-semibold text-gray-900">{stats.streak}</div>
                              <div className="text-gray-600">Current Streak</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="font-semibold text-gray-900">{stats.bestStreak}</div>
                              <div className="text-gray-600">Best Streak</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="font-semibold text-gray-900">{stats.completedDays}</div>
                              <div className="text-gray-600">Completed</div>
                            </div>
                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                              <div className="font-semibold text-gray-900">{stats.totalDays}</div>
                              <div className="text-gray-600">Total Days</div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => toggleHabitActive(habit.id, !habit.isActive)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            habit.isActive
                              ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          }`}
                        >
                          {habit.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteHabit(habit.id)}
                          className="px-3 py-1 bg-red-100 text-red-800 rounded-md text-sm font-medium hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {/* Activity Calendar */}
                    <HabitCalendar habit={habit} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}