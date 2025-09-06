'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Habit, HabitStats } from '@/types/journal';
import DayDetailModal from '@/components/habits/DayDetailModal';
import HabitEditModal from '@/components/habits/HabitEditModal';
import NewEntryButton from '@/components/ui/NewEntryButton';
import { HabitCompletion } from '@/components/habits/UnifiedCalendarDay';
import { calculateHabitPermanence, HABIT_FORMATION_STAGES, assessHabitRisk, HabitRiskAssessment } from '@/lib/habit-permanence';
import '@/components/habits/unified-calendar.css';
import '@/components/habits/habit-legend.css';
import '@/components/habits/day-detail-modal.css';

interface UnifiedDashboardProps {
  years: string[];
}

export default function UnifiedDashboard({ years }: UnifiedDashboardProps) {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitStats, setHabitStats] = useState<Record<string, HabitStats>>({});
  const [habitPermanence, setHabitPermanence] = useState<Record<string, any>>({});
  const [habitRisks, setHabitRisks] = useState<Record<string, HabitRiskAssessment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [visibleHabits, setVisibleHabits] = useState<string[]>([]);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [showHabitSection, setShowHabitSection] = useState(true);
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
            const createdDate = new Date(habit.createdAt || habit.id);
            const earlierStartDate = new Date(createdDate);
            earlierStartDate.setMonth(createdDate.getMonth() - 2);
            
            const startDate = earlierStartDate.toISOString().split('T')[0];
            const endDate = new Date().toISOString().split('T')[0];
            
            const logsResponse = await fetch(`/api/habits/${habit.id}/logs?startDate=${startDate}&endDate=${endDate}`);
            if (logsResponse.ok) {
              const logs = await logsResponse.json();
              
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
            
            const habit = habitsData.find((h: Habit) => h.id === habitId);
            if (habit) {
              const createdDate = new Date(habit.createdAt || habit.id);
              const earlierStartDate = new Date(createdDate);
              earlierStartDate.setMonth(createdDate.getMonth() - 2);
              
              const startDate = earlierStartDate.toISOString().split('T')[0];
              const endDate = new Date().toISOString().split('T')[0];
              
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

  const handleDayClick = (date: Date, _dayHabits: HabitCompletion[]) => {
    setSelectedDay(date);
  };

  const handleToggleHabit = async (habitId: string, date: Date) => {
    try {
      const dateString = date.toISOString().split('T')[0];
      
      const response = await fetch(`/api/habits/${habitId}/logs?startDate=${dateString}&endDate=${dateString}`);
      if (!response.ok) throw new Error('Failed to fetch current status');
      
      const logs = await response.json();
      const currentLog = logs.find((log: any) => log.date === dateString);
      const currentStatus = currentLog?.completed || false;
      
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Personal Journal & Habits</h1>
                <p className="text-gray-600 text-sm">Your integrated dashboard for journaling and habit tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/entry/new"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                New Entry
              </Link>
            </div>
          </div>

          {/* Progressive Risk Alert System */}
          {Object.values(habitRisks).some((risk) => risk.riskLevel !== 'safe') && (
            <div className="mb-8">
              {Object.entries(habitRisks)
                .filter(([_, risk]) => risk.riskLevel !== 'safe')
                .sort(([,a], [,b]) => b.urgencyScore - a.urgencyScore)
                .slice(0, 3) // Show only top 3 most urgent
                .map(([habitId, risk]) => {
                  const habit = habits.find(h => h.id === habitId);
                  if (!habit) return null;
                  
                  const getAlertStyles = (riskLevel: string) => {
                    switch (riskLevel) {
                      case 'critical':
                        return {
                          bg: 'bg-red-50 border-2 border-red-200',
                          icon: '🚨',
                          iconBg: 'bg-red-100 text-red-800',
                          text: 'text-red-800',
                          button: 'bg-red-600 hover:bg-red-700 text-white animate-pulse',
                        };
                      case 'warning':
                        return {
                          bg: 'bg-orange-50 border border-orange-200',
                          icon: '⚠️',
                          iconBg: 'bg-orange-100 text-orange-800',
                          text: 'text-orange-800',
                          button: 'bg-orange-600 hover:bg-orange-700 text-white',
                        };
                      default:
                        return {
                          bg: 'bg-yellow-50 border border-yellow-200',
                          icon: '⚡',
                          iconBg: 'bg-yellow-100 text-yellow-800',
                          text: 'text-yellow-800',
                          button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
                        };
                    }
                  };
                  
                  const alertStyles = getAlertStyles(risk.riskLevel);
                  
                  return (
                    <div 
                      key={habitId}
                      className={`${alertStyles.bg} rounded-xl p-4 shadow-md mb-3`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 ${alertStyles.iconBg} rounded-lg text-lg`}>
                            {alertStyles.icon}
                          </div>
                          <div>
                            <h3 className={`font-semibold ${alertStyles.text}`}>
                              {habit.name} needs attention
                            </h3>
                            <p className={`text-sm ${alertStyles.text}`}>
                              {risk.interventionMessage}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            const today = new Date();
                            handleToggleHabit(habitId, today);
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-all ${alertStyles.button}`}
                        >
                          Complete Today
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-xl">📅</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{years.length}</p>
                  <p className="text-gray-600 text-sm">Years of Journaling</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-xl">🌱</span>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{habits.filter(h => h.isActive).length}</p>
                  <p className="text-gray-600 text-sm">Active Habits</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
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
                <div className="p-2 bg-orange-100 rounded-lg">
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
          </div>

          {/* Two-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Journal Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Journal Archive</h2>
                      <p className="text-gray-600 text-sm">Browse your journal entries by year</p>
                    </div>
                  </div>
                  <Link
                    href="/entry/new"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    New Entry
                  </Link>
                </div>
              </div>
              
              <div className="p-6">
                {years.length > 0 ? (
                  <div className="space-y-3">
                    {years.slice(0, 5).map((year) => (
                      <Link
                        key={year}
                        href={`/year/${year}`}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-200 group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-bold text-gray-900 group-hover:text-blue-600">
                            {year}
                          </div>
                          <div className="text-sm text-gray-600 group-hover:text-blue-600">
                            View entries from {year}
                          </div>
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ))}
                    {years.length > 5 && (
                      <div className="text-center pt-2">
                        <Link href="/year" className="text-blue-600 hover:text-blue-800 text-sm">
                          View all {years.length} years →
                        </Link>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No journal entries yet</h3>
                    <p className="text-gray-600 mb-4">Start your journaling journey!</p>
                    <Link
                      href="/entry/new"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Your First Entry
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Habit Tracking Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Today's Habits</h2>
                      <p className="text-gray-600 text-sm">Track your daily habit progress</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      Add Habit
                    </button>
                    <Link
                      href="/habits"
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 text-sm"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              </div>
              
              <div className="p-6">
                {habits.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No habits yet</h3>
                    <p className="text-gray-600 mb-4">Start building better habits!</p>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Create Your First Habit
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {habits.filter(h => h.isActive).slice(0, 5).map((habit) => {
                      const permanence = habitPermanence[habit.id];
                      const risk = habitRisks[habit.id];
                      const currentStage = permanence ? HABIT_FORMATION_STAGES.find(s => s.name.toLowerCase() === permanence.permanenceStage) || HABIT_FORMATION_STAGES[0] : HABIT_FORMATION_STAGES[0];
                      
                      return (
                        <div
                          key={habit.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all"
                        >
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: getHexColor(habit.color || '#3b82f6') }}
                            />
                            <div>
                              <h4 className="font-medium text-gray-900">{habit.name}</h4>
                              {permanence && (
                                <p className="text-sm text-gray-600">
                                  {currentStage.name} • {Math.round(permanence.automaticityScore)}% automatic
                                </p>
                              )}
                            </div>
                            {risk && risk.riskLevel !== 'safe' && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                risk.riskLevel === 'critical' 
                                  ? 'bg-red-100 text-red-700' 
                                  : risk.riskLevel === 'warning'
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {risk.riskLevel === 'critical' ? '🚨' : risk.riskLevel === 'warning' ? '⚠️' : '⚡'}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => handleToggleHabit(habit.id, new Date())}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        </div>
                      );
                    })}
                    {habits.filter(h => h.isActive).length > 5 && (
                      <div className="text-center pt-2">
                        <Link href="/habits" className="text-green-600 hover:text-green-800 text-sm">
                          View all {habits.filter(h => h.isActive).length} habits →
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Create Habit Form */}
          {showCreateForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Create New Habit</h3>
                <div className="space-y-4">
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
                        { name: 'Red', value: '#ef4444' },
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
            </div>
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
      <NewEntryButton />
    </div>
  );
}