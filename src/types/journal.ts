export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  year: string;
  month: string;
  day: string;
  filePath: string;
  frontmatter?: Record<string, any>;
  excerpt?: string;
  wordCount?: number;
}

export interface MonthlySummary {
  year: string;
  month: string;
  content: string;
  filePath: string;
  entries: JournalEntry[];
  themes?: string[];
}

export interface CalendarEntry {
  date: string;
  hasEntry: boolean;
  entry?: JournalEntry;
}

export interface MonthData {
  year: string;
  month: string;
  entries: JournalEntry[];
  summary?: MonthlySummary;
  calendar: CalendarEntry[];
}

export type MonthName = 
  | 'Jan' | 'Feb' | 'Mar' | 'Apr' | 'May' | 'Jun'
  | 'Jul' | 'Aug' | 'Sep' | 'Oct' | 'Nov' | 'Dec';

export const MONTH_NAMES: MonthName[] = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export const MONTH_FULL_NAMES: Record<MonthName, string> = {
  Jan: 'January',
  Feb: 'February', 
  Mar: 'March',
  Apr: 'April',
  May: 'May',
  Jun: 'June',
  Jul: 'July',
  Aug: 'August',
  Sep: 'September',
  Oct: 'October',
  Nov: 'November',
  Dec: 'December'
};

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category?: string;
  color?: string;
  targetFrequency?: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  isActive: boolean;
}

export interface HabitLog {
  habitId: string;
  date: string;
  completed: boolean;
  notes?: string;
  completedAt?: string;
}

export interface DailyHabits {
  date: string;
  habits: HabitLog[];
}

export interface HabitStats {
  habitId: string;
  totalDays: number;
  completedDays: number;
  streak: number;
  bestStreak: number;
  completionRate: number;
  lastCompleted?: string;
}