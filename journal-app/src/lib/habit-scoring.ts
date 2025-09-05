import { Habit, HabitLog } from '@/types/journal';

export interface HabitScore {
  habitId: string;
  importanceScore: number;
  streakBonus: number;
  frequencyWeight: number;
  totalScore: number;
  priority: 'high' | 'medium' | 'low';
  size: 'large' | 'medium' | 'small';
}

export interface HabitMetrics {
  currentStreak: number;
  completionRate: number;
  recencyScore: number;
  consistencyScore: number;
  totalDays: number;
}

export const calculateHabitMetrics = (logs: HabitLog[]): HabitMetrics => {
  if (!logs || logs.length === 0) {
    return {
      currentStreak: 0,
      completionRate: 0,
      recencyScore: 0,
      consistencyScore: 0,
      totalDays: 0
    };
  }

  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const totalDays = logs.length;
  const completedDays = logs.filter(log => log.completed).length;
  const completionRate = totalDays > 0 ? completedDays / totalDays : 0;

  // Calculate current streak
  let currentStreak = 0;
  for (const log of sortedLogs) {
    if (log.completed) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Calculate recency score (how recently was this habit completed)
  const recentCompletions = sortedLogs.slice(0, 7).filter(log => log.completed).length;
  const recencyScore = recentCompletions / Math.min(7, sortedLogs.length);

  // Calculate consistency score (how consistent is the habit completion)
  const weeklyChunks = [];
  for (let i = 0; i < sortedLogs.length; i += 7) {
    const week = sortedLogs.slice(i, i + 7);
    const weeklyRate = week.filter(log => log.completed).length / week.length;
    weeklyChunks.push(weeklyRate);
  }
  
  const consistencyScore = weeklyChunks.length > 0 
    ? 1 - (weeklyChunks.reduce((acc, rate) => acc + Math.abs(rate - completionRate), 0) / weeklyChunks.length)
    : 0;

  return {
    currentStreak,
    completionRate,
    recencyScore,
    consistencyScore,
    totalDays
  };
};

export const calculateHabitImportance = (habit: Habit, logs: HabitLog[]): HabitScore => {
  const metrics = calculateHabitMetrics(logs);
  
  // Importance scoring factors
  const streakWeight = 0.4;
  const frequencyWeight = 0.3;
  const recencyWeight = 0.2;
  const consistencyWeight = 0.1;
  
  // Calculate base importance score (0-1)
  const baseScore = 
    (Math.min(metrics.currentStreak, 30) / 30) * streakWeight +
    metrics.completionRate * frequencyWeight +
    metrics.recencyScore * recencyWeight +
    metrics.consistencyScore * consistencyWeight;
  
  // Apply streak bonus
  let streakBonus = 1.0;
  if (metrics.currentStreak >= 30) streakBonus = 1.5;
  else if (metrics.currentStreak >= 14) streakBonus = 1.3;
  else if (metrics.currentStreak >= 7) streakBonus = 1.2;
  else if (metrics.currentStreak >= 3) streakBonus = 1.1;
  
  const totalScore = baseScore * streakBonus;
  
  // Determine priority and visual size
  let priority: 'high' | 'medium' | 'low' = 'low';
  let size: 'large' | 'medium' | 'small' = 'small';
  
  if (totalScore >= 0.7) {
    priority = 'high';
    size = 'large';
  } else if (totalScore >= 0.4) {
    priority = 'medium';
    size = 'medium';
  } else {
    priority = 'low';
    size = 'small';
  }
  
  return {
    habitId: habit.id,
    importanceScore: baseScore,
    streakBonus,
    frequencyWeight: metrics.completionRate,
    totalScore,
    priority,
    size
  };
};

export const sortHabitsByImportance = (
  habits: Habit[], 
  scores: Record<string, HabitScore>
): Habit[] => {
  return [...habits].sort((a, b) => {
    const scoreA = scores[a.id]?.totalScore || 0;
    const scoreB = scores[b.id]?.totalScore || 0;
    return scoreB - scoreA;
  });
};

export const groupHabitsByPriority = (
  completedHabits: any[], 
  scores: Record<string, HabitScore>
): {
  primary: any[];
  secondary: any[];
  tertiary: any[];
} => {
  const sorted = [...completedHabits].sort((a, b) => {
    const scoreA = scores[a.habitId]?.totalScore || 0;
    const scoreB = scores[b.habitId]?.totalScore || 0;
    return scoreB - scoreA;
  });
  
  return {
    primary: sorted.slice(0, 1), // Most important habit
    secondary: sorted.slice(1, 3), // Next 2 important habits
    tertiary: sorted.slice(3) // Remaining habits
  };
};