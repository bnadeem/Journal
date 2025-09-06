'use client';

import { useState, useEffect, useCallback } from 'react';
import { Habit, HabitStats, HabitLog } from '@/types/journal';
import { calculateHabitPermanence, assessHabitRisk, HabitRiskAssessment } from '@/lib/habit-permanence';

interface HabitData {
  habits: Habit[];
  habitStats: Record<string, HabitStats>;
  habitLogs: Record<string, HabitLog[]>;
  habitPermanence: Record<string, unknown>;
  habitRisks: Record<string, HabitRiskAssessment>;
  isLoading: boolean;
  error: string | null;
}

// Global cache to prevent duplicate API calls
const habitDataCache = new Map<string, { data: HabitLog[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchHabitLogsWithCache = async (habitId: string, startDate: string, endDate: string): Promise<HabitLog[]> => {
  const cacheKey = `${habitId}-${startDate}-${endDate}`;
  const cached = habitDataCache.get(cacheKey);
  
  // Return cached data if it's still valid
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // Fetch new data
  const response = await fetch(`/api/habits/${habitId}/logs?startDate=${startDate}&endDate=${endDate}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch logs for habit ${habitId}`);
  }
  
  const logs = await response.json();
  
  // Cache the result
  habitDataCache.set(cacheKey, { data: logs, timestamp: Date.now() });
  
  return logs;
};

export const useHabitData = (): HabitData & {
  refreshHabits: () => Promise<void>;
  toggleHabit: (habitId: string, date: Date) => Promise<void>;
} => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitStats, setHabitStats] = useState<Record<string, HabitStats>>({});
  const [habitLogs, setHabitLogs] = useState<Record<string, HabitLog[]>>({});
  const [habitPermanence, setHabitPermanence] = useState<Record<string, unknown>>({});
  const [habitRisks, setHabitRisks] = useState<Record<string, HabitRiskAssessment>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllHabitData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch habits
      const habitsResponse = await fetch('/api/habits');
      if (!habitsResponse.ok) throw new Error('Failed to fetch habits');
      
      const habitsData: Habit[] = await habitsResponse.json();
      setHabits(habitsData);

      if (habitsData.length === 0) {
        setIsLoading(false);
        return;
      }

      // Calculate optimal date range (last 3 months for comprehensive analysis)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);
      const startDateStr = startDate.toISOString().split('T')[0];

      // Fetch all habit logs in parallel with deduplication
      const logPromises = habitsData.map(async (habit) => {
        const logs = await fetchHabitLogsWithCache(habit.id, startDateStr, endDate);
        return { habitId: habit.id, logs };
      });

      const logResults = await Promise.all(logPromises);
      
      // Build logs map
      const logsMap: Record<string, HabitLog[]> = {};
      logResults.forEach(({ habitId, logs }) => {
        logsMap[habitId] = logs;
      });
      setHabitLogs(logsMap);

      // Calculate all metrics in parallel using the same data
      const statsMap: Record<string, HabitStats> = {};
      const permanenceMap: Record<string, unknown> = {};
      const risksMap: Record<string, HabitRiskAssessment> = {};

      for (const habit of habitsData) {
        const logs = logsMap[habit.id] || [];
        
        // Calculate stats
        const completedLogs = logs.filter(log => log.completed);
        const totalDays = logs.length;
        const completionRate = totalDays > 0 ? (completedLogs.length / totalDays) * 100 : 0;
        
        // Calculate streaks
        const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        let currentStreak = 0;
        let bestStreak = 0;
        let tempStreak = 0;
        
        for (const log of sortedLogs) {
          if (log.completed) {
            tempStreak++;
            if (currentStreak === 0) currentStreak = tempStreak;
          } else {
            bestStreak = Math.max(bestStreak, tempStreak);
            if (tempStreak > 0) currentStreak = 0;
            tempStreak = 0;
          }
        }
        bestStreak = Math.max(bestStreak, tempStreak);

        // Check if completed today
        const today = new Date().toISOString().split('T')[0];
        const todayLog = logs.find(log => log.date === today);
        const completedToday = todayLog?.completed || false;

        statsMap[habit.id] = {
          currentStreak,
          bestStreak,
          completionRate,
          completedToday
        };

        // Calculate permanence metrics
        const createdDate = new Date(habit.createdAt || habit.id);
        const actualStartDate = logs.length > 0 
          ? logs.reduce((earliest, log) => log.completed && log.date < earliest ? log.date : earliest, logs[0].date)
          : createdDate.toISOString().split('T')[0];
        
        const permanenceMetrics = calculateHabitPermanence(logs, actualStartDate);
        permanenceMap[habit.id] = permanenceMetrics;

        // Calculate risk assessment
        const riskAssessment = assessHabitRisk(logs, permanenceMetrics);
        risksMap[habit.id] = riskAssessment;
      }

      setHabitStats(statsMap);
      setHabitPermanence(permanenceMap);
      setHabitRisks(risksMap);

    } catch (err) {
      console.error('Error fetching habit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load habit data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshHabits = useCallback(async () => {
    // Clear cache and refetch
    habitDataCache.clear();
    await fetchAllHabitData();
  }, [fetchAllHabitData]);

  const toggleHabit = useCallback(async (habitId: string, date: Date) => {
    try {
      const dateString = date.toISOString().split('T')[0];
      
      // Use the new daily habits API endpoint for toggling
      const year = date.getFullYear().toString();
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const day = date.getDate().toString();

      const response = await fetch(`/api/habits/daily/${year}/${month}/${day}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ habitId }),
      });

      if (!response.ok) throw new Error('Failed to toggle habit');

      // Invalidate cache for this habit and refresh data
      habitDataCache.forEach((_, key) => {
        if (key.startsWith(habitId)) {
          habitDataCache.delete(key);
        }
      });
      
      await refreshHabits();

    } catch (err) {
      console.error('Error toggling habit:', err);
      setError(err instanceof Error ? err.message : 'Failed to toggle habit');
    }
  }, [refreshHabits]);

  useEffect(() => {
    fetchAllHabitData();
  }, [fetchAllHabitData]);

  return {
    habits,
    habitStats,
    habitLogs,
    habitPermanence,
    habitRisks,
    isLoading,
    error,
    refreshHabits,
    toggleHabit,
  };
};