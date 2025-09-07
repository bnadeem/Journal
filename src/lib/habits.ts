import client from '@/lib/libsql';
import { Habit, HabitStats, HabitLog } from '@/types/journal';
import { calculateHabitPermanence, assessHabitRisk, HabitRiskAssessment } from '@/lib/habit-permanence';

export interface HabitData {
  habits: Habit[];
  habitStats: Record<string, HabitStats>;
  habitLogs: Record<string, HabitLog[]>;
  habitPermanence: Record<string, any>;
  habitRisks: Record<string, HabitRiskAssessment>;
}

export async function getHabitData(): Promise<HabitData> {
  // Fetch habits
  const habitsResult = await client.execute('SELECT * FROM Habit');
  const habits: Habit[] = habitsResult.rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    color: row.color,
    targetFrequency: row.targetFrequency,
    createdAt: row.createdAt,
    isActive: Boolean(row.isActive),
  }));

  if (habits.length === 0) {
    return {
      habits: [],
      habitStats: {},
      habitLogs: {},
      habitPermanence: {},
      habitRisks: {},
    };
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  // Fetch all habit logs
  const logsResult = await client.execute({
    sql: 'SELECT * FROM HabitLog WHERE date >= ? AND date <= ?',
    args: [startDateStr, endDateStr],
  });

  const allLogs: HabitLog[] = logsResult.rows.map((row: any) => ({
    habitId: row.habitId,
    date: row.date,
    completed: Boolean(row.completed),
  }));

  // Group logs by habit
  const logsMap: Record<string, HabitLog[]> = {};
  for (const log of allLogs) {
    if (!logsMap[log.habitId]) {
      logsMap[log.habitId] = [];
    }
    logsMap[log.habitId].push(log);
  }

  // Calculate metrics
  const statsMap: Record<string, HabitStats> = {};
  const permanenceMap: Record<string, any> = {};
  const risksMap: Record<string, HabitRiskAssessment> = {};

  for (const habit of habits) {
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

    statsMap[habit.id] = {
      habitId: habit.id,
      totalDays: logs.length,
      completedDays: logs.filter(log => log.completed).length,
      streak: currentStreak,
      bestStreak,
      completionRate,
      lastCompleted: logs.find(log => log.completed)?.date,
    };

    // Calculate permanence metrics
    const createdDate = new Date(habit.createdAt || habit.id);
    const actualStartDate = logs.length > 0 
      ? new Date(logs.reduce((earliest, log) => log.completed && new Date(log.date) < new Date(earliest) ? log.date : earliest, logs[0].date))
      : createdDate;
    
    const permanenceMetrics = calculateHabitPermanence(logs, actualStartDate);
    permanenceMap[habit.id] = permanenceMetrics;

    // Calculate risk assessment
    const riskAssessment = assessHabitRisk(logs, permanenceMetrics);
    risksMap[habit.id] = riskAssessment;
  }

  return {
    habits,
    habitStats: statsMap,
    habitLogs: logsMap,
    habitPermanence: permanenceMap,
    habitRisks: risksMap,
  };
}