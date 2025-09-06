'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Habit, HabitStats } from '@/types/journal';
import UnifiedCalendar from '@/components/habits/UnifiedCalendar';
import HabitLegend from '@/components/habits/HabitLegend';
import DayDetailModal from '@/components/habits/DayDetailModal';
import HabitEditModal from '@/components/habits/HabitEditModal';
import { HabitCompletion } from '@/components/habits/UnifiedCalendarDay';
import { calculateHabitPermanence, getHabitStatusMessage, getNextMilestone, HABIT_FORMATION_STAGES, assessHabitRisk, HabitRiskAssessment } from '@/lib/habit-permanence';
import '@/components/habits/unified-calendar.css';
import '@/components/habits/habit-legend.css';
import '@/components/habits/day-detail-modal.css';

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitStats, setHabitStats] = useState<Record<string, HabitStats>>({});
  const [habitPermanence, setHabitPermanence] = useState<Record<string, any>>({});
  const [habitRisks, setHabitRisks] = useState<Record<string, HabitRiskAssessment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [visibleHabits, setVisibleHabits] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
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
        
        // Calculate habit permanence metrics for each habit
        const permanencePromises = habitsData.map(async (habit: Habit) => {
          try {
            // Fetch full log history for permanence calculation
            // Go back further than createdAt to capture any historical data
            const createdDate = new Date(habit.createdAt || habit.id);
            const earlierStartDate = new Date(createdDate);
            earlierStartDate.setMonth(createdDate.getMonth() - 2); // Go back 2 more months
            
            const startDate = earlierStartDate.toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];
            
            const logsResponse = await fetch(`/api/habits/${habit.id}/logs?startDate=${startDate}&endDate=${endDate}`);
            if (logsResponse.ok) {
              const logs = await logsResponse.json();
              
              // Debug logging
              if (habit.name === 'Kettlebell Swings') {
                console.log('Debug Kettlebell Swings:');
                console.log('- Habit created:', habit.createdAt);
                console.log('- Start date for API:', startDate);
                console.log('- End date for API:', endDate);
                console.log('- Logs received:', logs.length);
                console.log('- Completed logs:', logs.filter((l: any) => l.completed).length);
                console.log('- Sample logs:', logs.slice(0, 5));
              }
              
              // Use the earliest log date or createdAt, whichever is earlier
              const createdAtDate = new Date(habit.createdAt || habit.id);
              const completedLogs = logs.filter((l: any) => l.completed);
              
              let actualStartDate = createdAtDate;
              if (completedLogs.length > 0) {
                const sortedLogs = completedLogs.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
                const earliestLogDate = new Date(sortedLogs[0].date);
                if (earliestLogDate < createdAtDate) {
                  actualStartDate = earliestLogDate;
                }
              }
              
              const permanenceMetrics = calculateHabitPermanence(logs, actualStartDate);
              
              // Debug logging for permanence
              if (habit.name === 'Kettlebell Swings') {
                console.log('- Created at date:', createdAtDate);
                console.log('- Actual start date used:', actualStartDate);
                console.log('- Permanence metrics:', permanenceMetrics);
              }
              
              return { habitId: habit.id, permanence: permanenceMetrics };
            }
          } catch (error) {
            console.error(`Error calculating permanence for habit ${habit.id}:`, error);
          }
          return { habitId: habit.id, permanence: null };
        });
        
        const permanenceResults = await Promise.all(permanencePromises);
        const permanenceMap: Record<string, any> = {};
        const riskMap: Record<string, HabitRiskAssessment> = {};
        
        permanenceResults.forEach(({ habitId, permanence }) => {
          if (permanence) {
            permanenceMap[habitId] = permanence;
            
            // Calculate risk assessment for each habit
            const habit = habitsData.find((h: Habit) => h.id === habitId);
            if (habit) {
              // Get the logs for risk assessment
              const createdDate = new Date(habit.createdAt || habit.id);
              const earlierStartDate = new Date(createdDate);
              earlierStartDate.setMonth(createdDate.getMonth() - 2);
              
              const startDate = earlierStartDate.toISOString().split('T')[0];
              const endDate = new Date().toISOString().split('T')[0];
              
              // Use cached logs from permanence calculation if available
              fetch(`/api/habits/${habitId}/logs?startDate=${startDate}&endDate=${endDate}`)
                .then(res => res.json())
                .then(logs => {
                  const risk = assessHabitRisk(logs, permanence);
                  setHabitRisks(prev => ({ ...prev, [habitId]: risk }));
                })
                .catch(err => console.error(`Error assessing risk for habit ${habitId}:`, err));
            }
          }
        });
        
        setHabitPermanence(permanenceMap);
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
    const habit = habits.find(h => h.id === habitId);
    if (habit) {
      setEditingHabit(habit);
    }
  };

  const handleEditHabit = async (habitId: string, updates: Partial<Habit>) => {
    try {
      const response = await fetch('/api/habits', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: habitId, ...updates }),
      });

      if (response.ok) {
        fetchHabits();
      } else {
        throw new Error('Failed to update habit');
      }
    } catch (error) {
      console.error('Error updating habit:', error);
      throw error;
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
      
      // Refresh habit data to update risk assessments
      fetchHabits();
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

          {/* Progressive Risk Alert System */}
          {Object.values(habitRisks).some((risk) => risk.riskLevel !== 'safe') && (
            <div className="mb-8">
              {Object.entries(habitRisks)
                .filter(([_, risk]) => risk.riskLevel !== 'safe')
                .sort(([,a], [,b]) => b.urgencyScore - a.urgencyScore) // Sort by urgency
                .map(([habitId, risk]) => {
                  const habit = habits.find(h => h.id === habitId);
                  if (!habit) return null;
                  
                  const getAlertStyles = (riskLevel: string, urgencyScore: number) => {
                    switch (riskLevel) {
                      case 'critical':
                        return {
                          bg: 'bg-red-50 border-2 border-red-200',
                          icon: '🚨',
                          iconBg: 'bg-red-100 text-red-800',
                          text: 'text-red-800',
                          button: 'bg-red-600 hover:bg-red-700 text-white animate-pulse',
                          animation: 'animate-bounce'
                        };
                      case 'warning':
                        return {
                          bg: 'bg-orange-50 border-2 border-orange-200',
                          icon: '⚠️',
                          iconBg: 'bg-orange-100 text-orange-800',
                          text: 'text-orange-800',
                          button: 'bg-orange-600 hover:bg-orange-700 text-white',
                          animation: 'animate-pulse'
                        };
                      default: // caution
                        return {
                          bg: 'bg-yellow-50 border border-yellow-200',
                          icon: '⚡',
                          iconBg: 'bg-yellow-100 text-yellow-800',
                          text: 'text-yellow-800',
                          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                          animation: ''
                        };
                    }
                  };
                  
                  const alertStyles = getAlertStyles(risk.riskLevel, risk.urgencyScore);
                  
                  return (
                    <div 
                      key={habitId}
                      className={`${alertStyles.bg} rounded-xl p-6 shadow-md mb-4 ${alertStyles.animation}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 ${alertStyles.iconBg} rounded-lg text-xl`}>
                            {alertStyles.icon}
                          </div>
                          <div>
                            <h3 className={`font-semibold text-lg ${alertStyles.text}`}>
                              {habit.name} - Formation at Risk
                            </h3>
                            <p className={`text-sm ${alertStyles.text} mb-2`}>
                              {risk.interventionMessage}
                            </p>
                            <div className="flex items-center space-x-4 text-sm">
                              <span className={alertStyles.text}>
                                💪 Regression Risk: {risk.regressionRisk}%
                              </span>
                              <span className={alertStyles.text}>
                                ⏱️ Days Since Last: {risk.daysSinceLastCompletion}
                              </span>
                              {risk.consecutiveMissedDays > 0 && (
                                <span className={alertStyles.text}>
                                  📉 Consecutive Misses: {risk.consecutiveMissedDays}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            // Mark today as complete
                            const today = new Date();
                            handleToggleHabit(habitId, today);
                          }}
                          className={`px-6 py-3 rounded-lg font-medium transition-all ${alertStyles.button} shadow-lg`}
                        >
                          {risk.riskLevel === 'critical' ? 'RESCUE NOW!' : 'Complete Today'}
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Science-Based Summary Stats */}
          {habits.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <span className="text-xl">🌱</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{habits.filter(h => h.isActive).length}</p>
                    <p className="text-gray-600 text-sm">Habits in Formation</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <span className="text-xl">🧠</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.values(habitPermanence).length > 0 
                        ? Math.round(Object.values(habitPermanence).reduce((acc: number, perm: any) => acc + (perm?.automaticityScore || 0), 0) / Object.values(habitPermanence).length)
                        : 0}%
                    </p>
                    <p className="text-gray-600 text-sm">Avg Automaticity</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <span className="text-xl">🏆</span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.values(habitPermanence).filter((perm: any) => perm?.permanenceStage === 'automatic').length}
                    </p>
                    <p className="text-gray-600 text-sm">Permanent Habits</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    Object.values(habitRisks).some(risk => risk?.riskLevel === 'critical' || risk?.riskLevel === 'warning')
                      ? 'bg-red-100' 
                      : Object.values(habitRisks).some(risk => risk?.riskLevel === 'caution')
                      ? 'bg-yellow-100'
                      : 'bg-green-100'
                  }`}>
                    <span className="text-xl">
                      {Object.values(habitRisks).some(risk => risk?.riskLevel === 'critical') 
                        ? '🚨' 
                        : Object.values(habitRisks).some(risk => risk?.riskLevel === 'warning')
                        ? '⚠️'
                        : Object.values(habitRisks).some(risk => risk?.riskLevel === 'caution')
                        ? '⚡'
                        : '✅'
                      }
                    </span>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900">
                      {Object.values(habitRisks).filter(risk => risk?.riskLevel !== 'safe').length}
                    </p>
                    <p className="text-gray-600 text-sm">Habits Needing Attention</p>
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
              {/* Science-Based Habit Formation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {habits.map((habit) => {
                  const stats = habitStats[habit.id];
                  const permanence = habitPermanence[habit.id];
                  const risk = habitRisks[habit.id];
                  const currentStage = permanence ? HABIT_FORMATION_STAGES.find(s => s.name.toLowerCase() === permanence.permanenceStage) || HABIT_FORMATION_STAGES[0] : HABIT_FORMATION_STAGES[0];
                  const statusMessage = permanence ? getHabitStatusMessage(permanence) : 'Calculating permanence...';
                  const nextMilestone = permanence ? getNextMilestone(permanence) : null;
                  
                  // Determine card border based on risk level
                  const getRiskBorder = (riskLevel?: string) => {
                    switch (riskLevel) {
                      case 'critical':
                        return 'border-red-300 shadow-red-100 shadow-lg';
                      case 'warning':
                        return 'border-orange-300 shadow-orange-100 shadow-lg';
                      case 'caution':
                        return 'border-yellow-300 shadow-yellow-100 shadow-md';
                      default:
                        return 'border-gray-200 shadow-sm';
                    }
                  };
                  
                  return (
                    <div
                      key={habit.id}
                      className={`bg-white rounded-xl border p-6 hover:shadow-md transition-all ${getRiskBorder(risk?.riskLevel)}`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-gray-900 text-lg">{habit.name}</h3>
                          {habit.category && (
                            <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              {habit.category}
                            </span>
                          )}
                          {/* Risk indicator badge */}
                          {risk && risk.riskLevel !== 'safe' && (
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                              risk.riskLevel === 'critical' 
                                ? 'bg-red-100 text-red-700 animate-pulse' 
                                : risk.riskLevel === 'warning'
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {risk.riskLevel === 'critical' ? '🚨 CRITICAL' : 
                               risk.riskLevel === 'warning' ? '⚠️ WARNING' : '⚡ CAUTION'}
                            </div>
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
                            onClick={() => openHabitEditor(habit.id)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit habit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteHabit(habit.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete habit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* Science-Based Formation Stage */}
                      {permanence ? (
                        <div className="mb-4">
                          <div className="flex items-center space-x-3 mb-3">
                            <span className="text-2xl">{currentStage.icon}</span>
                            <div>
                              <h4 className="font-semibold text-gray-900" style={{ color: currentStage.color }}>
                                {currentStage.name} Phase
                              </h4>
                              <p className="text-sm text-gray-600">{currentStage.description}</p>
                            </div>
                          </div>
                          
                          {/* Formation Progress Bar */}
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Formation Progress</span>
                              <span>{Math.round(permanence.permanencePercentage)}% toward permanent</span>
                            </div>
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full transition-all duration-700 ease-out rounded-full"
                                style={{ 
                                  width: `${Math.max(2, permanence.permanencePercentage)}%`, // Minimum 2% for visibility
                                  backgroundColor: currentStage.color
                                }}
                              />
                            </div>
                          </div>
                          
                          {/* Status Message */}
                          <div className="text-sm text-gray-700 mb-2">
                            {statusMessage}
                          </div>
                          
                          {/* Risk Assessment Display */}
                          {risk && risk.riskLevel !== 'safe' && (
                            <div className={`rounded-lg p-3 mb-3 ${
                              risk.riskLevel === 'critical' 
                                ? 'bg-red-50 border border-red-200' 
                                : risk.riskLevel === 'warning'
                                ? 'bg-orange-50 border border-orange-200'
                                : 'bg-yellow-50 border border-yellow-200'
                            }`}>
                              <div className={`text-xs font-medium mb-1 ${
                                risk.riskLevel === 'critical' 
                                  ? 'text-red-700' 
                                  : risk.riskLevel === 'warning'
                                  ? 'text-orange-700'
                                  : 'text-yellow-700'
                              }`}>
                                Formation Risk Analysis
                              </div>
                              <div className={`text-sm mb-2 ${
                                risk.riskLevel === 'critical' 
                                  ? 'text-red-800' 
                                  : risk.riskLevel === 'warning'
                                  ? 'text-orange-800'
                                  : 'text-yellow-800'
                              }`}>
                                {risk.interventionMessage}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className={risk.riskLevel === 'critical' ? 'text-red-700' : risk.riskLevel === 'warning' ? 'text-orange-700' : 'text-yellow-700'}>
                                  📉 Risk: {risk.regressionRisk}%
                                </div>
                                {risk.consecutiveMissedDays > 0 && (
                                  <div className={risk.riskLevel === 'critical' ? 'text-red-700' : risk.riskLevel === 'warning' ? 'text-orange-700' : 'text-yellow-700'}>
                                    ⏱️ Missed: {risk.consecutiveMissedDays} days
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {/* Next Milestone */}
                          {nextMilestone && nextMilestone.daysUntil > 0 && (
                            <div className="bg-gray-50 rounded-lg p-3">
                              <div className="text-xs text-gray-600 mb-1">Next Milestone</div>
                              <div className="font-medium text-gray-900">{nextMilestone.milestone}</div>
                              <div className="text-sm text-gray-600">
                                ~{nextMilestone.daysUntil} days: {nextMilestone.encouragement}
                              </div>
                            </div>
                          )}
                          
                          {/* Automaticity & Resilience Metrics */}
                          <div className="grid grid-cols-3 gap-3 mt-4">
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                {Math.round(permanence.automaticityScore)}%
                              </div>
                              <div className="text-xs text-gray-500">Automaticity</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold text-gray-900">
                                Day {permanence.daysSinceStart}
                              </div>
                              <div className="text-xs text-gray-500">Formation</div>
                            </div>
                            <div className="text-center">
                              <div className="text-lg font-bold" style={{ color: currentStage.color }}>
                                {permanence.strengthLevel}
                              </div>
                              <div className="text-xs text-gray-500">Strength</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-gray-500 py-8">
                          Calculating habit formation metrics...
                        </div>
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
                
                {/* Science-Based Formation Insights */}
                <div className="px-6 pb-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-red-50 rounded-lg p-4 text-center">
                      <div className="p-2 bg-red-100 rounded-lg inline-flex mb-2">
                        <span className="text-lg">🌱</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.values(habitPermanence).filter((perm: any) => perm?.permanenceStage === 'initiation').length}
                      </p>
                      <p className="text-gray-600 text-sm">Initiation Phase</p>
                    </div>
                    
                    <div className="bg-yellow-50 rounded-lg p-4 text-center">
                      <div className="p-2 bg-yellow-100 rounded-lg inline-flex mb-2">
                        <span className="text-lg">🌿</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.values(habitPermanence).filter((perm: any) => perm?.permanenceStage === 'development').length}
                      </p>
                      <p className="text-gray-600 text-sm">Neural Development</p>
                    </div>
                    
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="p-2 bg-green-100 rounded-lg inline-flex mb-2">
                        <span className="text-lg">🌳</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.values(habitPermanence).filter((perm: any) => perm?.permanenceStage === 'stabilization').length}
                      </p>
                      <p className="text-gray-600 text-sm">Stabilizing</p>
                    </div>
                    
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="p-2 bg-purple-100 rounded-lg inline-flex mb-2">
                        <span className="text-lg">🏆</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {Object.values(habitPermanence).filter((perm: any) => perm?.permanenceStage === 'automatic').length}
                      </p>
                      <p className="text-gray-600 text-sm">Automatic Habits</p>
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

          {/* Habit Edit Modal */}
          <HabitEditModal
            habit={editingHabit}
            isOpen={editingHabit !== null}
            onClose={() => setEditingHabit(null)}
            onSave={handleEditHabit}
          />
        </div>
      </div>
    </div>
  );
}