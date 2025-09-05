import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { JournalEntry, MonthlySummary, MonthName, MONTH_NAMES, Habit, HabitLog, DailyHabits, HabitStats } from '@/types/journal';
import { generateId, getExcerpt, getWordCount } from '@/lib/utils';

// Get the journal root directory (parent of journal-app)
const JOURNAL_ROOT = path.resolve(process.cwd(), '../');

export async function getJournalRoot(): Promise<string> {
  return JOURNAL_ROOT;
}

export async function getEntryPath(year: string, month: MonthName, day: string): Promise<string> {
  const root = await getJournalRoot();
  return path.join(root, year, month, `${day}.md`);
}

export async function getSummaryPath(year: string, month: MonthName): Promise<string> {
  const root = await getJournalRoot();
  return path.join(root, year, month, 'summary.md');
}

export async function readEntry(year: string, month: MonthName, day: string): Promise<JournalEntry | null> {
  try {
    const filePath = await getEntryPath(year, month, day);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    
    return {
      id: generateId(year, month, day),
      title: frontmatter.title || `${month} ${day}, ${year}`,
      content,
      date: `${year}-${MONTH_NAMES.indexOf(month) + 1}-${day}`,
      year,
      month,
      day,
      filePath,
      frontmatter,
      excerpt: getExcerpt(content),
      wordCount: getWordCount(content)
    };
  } catch (error) {
    console.error(`Error reading entry ${year}/${month}/${day}:`, error);
    return null;
  }
}

export async function writeEntry(year: string, month: MonthName, day: string, content: string, frontmatter?: Record<string, any>): Promise<boolean> {
  try {
    const filePath = await getEntryPath(year, month, day);
    const dir = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Prepare content with frontmatter
    let fileContent = content;
    if (frontmatter && Object.keys(frontmatter).length > 0) {
      const frontmatterString = matter.stringify('', frontmatter);
      fileContent = frontmatterString + content;
    }

    fs.writeFileSync(filePath, fileContent, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing entry ${year}/${month}/${day}:`, error);
    return false;
  }
}

export async function deleteEntry(year: string, month: MonthName, day: string): Promise<boolean> {
  try {
    const filePath = await getEntryPath(year, month, day);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error deleting entry ${year}/${month}/${day}:`, error);
    return false;
  }
}

export async function getMonthEntries(year: string, month: MonthName): Promise<JournalEntry[]> {
  try {
    const root = await getJournalRoot();
    const monthDir = path.join(root, year, month);
    
    if (!fs.existsSync(monthDir)) {
      return [];
    }

    const files = fs.readdirSync(monthDir)
      .filter(file => file.endsWith('.md') && file !== 'summary.md')
      .map(file => file.replace('.md', ''));

    const entries: JournalEntry[] = [];
    
    for (const day of files) {
      const entry = await readEntry(year, month, day);
      if (entry) {
        entries.push(entry);
      }
    }

    // Sort by day
    entries.sort((a, b) => parseInt(a.day) - parseInt(b.day));
    
    return entries;
  } catch (error) {
    console.error(`Error reading month entries ${year}/${month}:`, error);
    return [];
  }
}

export async function readSummary(year: string, month: MonthName): Promise<MonthlySummary | null> {
  try {
    const filePath = await getSummaryPath(year, month);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);
    const entries = await getMonthEntries(year, month);
    
    return {
      year,
      month,
      content,
      filePath,
      entries,
      themes: frontmatter.themes || []
    };
  } catch (error) {
    console.error(`Error reading summary ${year}/${month}:`, error);
    return null;
  }
}

export async function writeSummary(year: string, month: MonthName, content: string, themes?: string[]): Promise<boolean> {
  try {
    const filePath = await getSummaryPath(year, month);
    const dir = path.dirname(filePath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Prepare content with frontmatter
    let fileContent = content;
    if (themes && themes.length > 0) {
      const frontmatterString = matter.stringify('', { themes });
      fileContent = frontmatterString + content;
    }

    fs.writeFileSync(filePath, fileContent, 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error writing summary ${year}/${month}:`, error);
    return false;
  }
}

export async function getAllYears(): Promise<string[]> {
  try {
    const root = await getJournalRoot();
    const items = fs.readdirSync(root, { withFileTypes: true });
    
    const years = items
      .filter(item => item.isDirectory() && /^\d{4}$/.test(item.name))
      .map(item => item.name)
      .sort();
    
    return years;
  } catch (error) {
    console.error('Error reading years:', error);
    return [];
  }
}

export async function getYearMonths(year: string): Promise<MonthName[]> {
  try {
    const root = await getJournalRoot();
    const yearDir = path.join(root, year);
    
    if (!fs.existsSync(yearDir)) {
      return [];
    }

    const items = fs.readdirSync(yearDir, { withFileTypes: true });
    
    const months = items
      .filter(item => item.isDirectory() && MONTH_NAMES.includes(item.name as MonthName))
      .map(item => item.name as MonthName)
      .sort((a, b) => MONTH_NAMES.indexOf(a) - MONTH_NAMES.indexOf(b));
    
    return months;
  } catch (error) {
    console.error(`Error reading months for year ${year}:`, error);
    return [];
  }
}

export async function getAllEntries(): Promise<JournalEntry[]> {
  try {
    const years = await getAllYears();
    const allEntries: JournalEntry[] = [];
    
    for (const year of years) {
      const months = await getYearMonths(year);
      for (const month of months) {
        const entries = await getMonthEntries(year, month);
        allEntries.push(...entries);
      }
    }
    
    // Sort entries by date
    allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    return allEntries;
  } catch (error) {
    console.error('Error getting all entries:', error);
    return [];
  }
}

export async function getAdjacentEntries(year: string, month: MonthName, day: string): Promise<{ prevEntry: JournalEntry | null; nextEntry: JournalEntry | null }> {
  try {
    const allEntries = await getAllEntries();
    const currentEntryId = generateId(year, month, day);
    
    const currentIndex = allEntries.findIndex(entry => entry.id === currentEntryId);
    
    if (currentIndex === -1) {
      return { prevEntry: null, nextEntry: null };
    }
    
    const prevEntry = currentIndex > 0 ? allEntries[currentIndex - 1] : null;
    const nextEntry = currentIndex < allEntries.length - 1 ? allEntries[currentIndex + 1] : null;
    
    return { prevEntry, nextEntry };
  } catch (error) {
    console.error('Error getting adjacent entries:', error);
    return { prevEntry: null, nextEntry: null };
  }
}

// Habit tracking functions
export async function getHabitsPath(): Promise<string> {
  const root = await getJournalRoot();
  return path.join(root, 'habits.json');
}

export async function getDailyHabitsPath(year: string, month: MonthName, day: string): Promise<string> {
  const root = await getJournalRoot();
  return path.join(root, year, month, `${day}-habits.json`);
}

export async function getAllHabits(): Promise<Habit[]> {
  try {
    const habitsPath = await getHabitsPath();
    
    if (!fs.existsSync(habitsPath)) {
      return [];
    }
    
    const habitsData = fs.readFileSync(habitsPath, 'utf-8');
    return JSON.parse(habitsData);
  } catch (error) {
    console.error('Error reading habits:', error);
    return [];
  }
}

export async function saveHabits(habits: Habit[]): Promise<boolean> {
  try {
    const habitsPath = await getHabitsPath();
    fs.writeFileSync(habitsPath, JSON.stringify(habits, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error('Error saving habits:', error);
    return false;
  }
}

export async function createHabit(habit: Omit<Habit, 'id' | 'createdAt'>): Promise<Habit | null> {
  try {
    const habits = await getAllHabits();
    const newHabit: Habit = {
      ...habit,
      id: generateId(new Date().toISOString(), 'habit', Math.random().toString()),
      createdAt: new Date().toISOString(),
    };
    
    habits.push(newHabit);
    const success = await saveHabits(habits);
    
    return success ? newHabit : null;
  } catch (error) {
    console.error('Error creating habit:', error);
    return null;
  }
}

export async function updateHabit(habitId: string, updates: Partial<Habit>): Promise<boolean> {
  try {
    const habits = await getAllHabits();
    const habitIndex = habits.findIndex(h => h.id === habitId);
    
    if (habitIndex === -1) {
      return false;
    }
    
    habits[habitIndex] = { ...habits[habitIndex], ...updates };
    return await saveHabits(habits);
  } catch (error) {
    console.error('Error updating habit:', error);
    return false;
  }
}

export async function deleteHabit(habitId: string): Promise<boolean> {
  try {
    const habits = await getAllHabits();
    const filteredHabits = habits.filter(h => h.id !== habitId);
    return await saveHabits(filteredHabits);
  } catch (error) {
    console.error('Error deleting habit:', error);
    return false;
  }
}

export async function getDailyHabits(year: string, month: MonthName, day: string): Promise<DailyHabits> {
  try {
    const dailyHabitsPath = await getDailyHabitsPath(year, month, day);
    const date = `${year}-${MONTH_NAMES.indexOf(month) + 1}-${day}`;
    
    if (!fs.existsSync(dailyHabitsPath)) {
      // Create default daily habits from all active habits
      const allHabits = await getAllHabits();
      const activeHabits = allHabits.filter(h => h.isActive);
      
      const defaultDailyHabits: DailyHabits = {
        date,
        habits: activeHabits.map(habit => ({
          habitId: habit.id,
          date,
          completed: false
        }))
      };
      
      return defaultDailyHabits;
    }
    
    const dailyHabitsData = fs.readFileSync(dailyHabitsPath, 'utf-8');
    return JSON.parse(dailyHabitsData);
  } catch (error) {
    console.error(`Error reading daily habits ${year}/${month}/${day}:`, error);
    const date = `${year}-${MONTH_NAMES.indexOf(month) + 1}-${day}`;
    return { date, habits: [] };
  }
}

export async function saveDailyHabits(year: string, month: MonthName, day: string, dailyHabits: DailyHabits): Promise<boolean> {
  try {
    const dailyHabitsPath = await getDailyHabitsPath(year, month, day);
    const dir = path.dirname(dailyHabitsPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(dailyHabitsPath, JSON.stringify(dailyHabits, null, 2), 'utf-8');
    return true;
  } catch (error) {
    console.error(`Error saving daily habits ${year}/${month}/${day}:`, error);
    return false;
  }
}

export async function toggleHabit(year: string, month: MonthName, day: string, habitId: string): Promise<boolean> {
  try {
    const dailyHabits = await getDailyHabits(year, month, day);
    const habitIndex = dailyHabits.habits.findIndex(h => h.habitId === habitId);
    
    if (habitIndex === -1) {
      // Add new habit log
      dailyHabits.habits.push({
        habitId,
        date: dailyHabits.date,
        completed: true,
        completedAt: new Date().toISOString()
      });
    } else {
      // Toggle existing habit
      const habit = dailyHabits.habits[habitIndex];
      habit.completed = !habit.completed;
      habit.completedAt = habit.completed ? new Date().toISOString() : undefined;
    }
    
    return await saveDailyHabits(year, month, day, dailyHabits);
  } catch (error) {
    console.error('Error toggling habit:', error);
    return false;
  }
}

export async function getHabitStats(habitId: string): Promise<HabitStats> {
  try {
    const years = await getAllYears();
    let totalDays = 0;
    let completedDays = 0;
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    let lastCompleted: string | undefined;
    
    const allLogs: HabitLog[] = [];
    
    // Collect all habit logs for this habit
    for (const year of years) {
      const months = await getYearMonths(year);
      for (const month of months) {
        const entries = await getMonthEntries(year, month);
        for (const entry of entries) {
          const dailyHabits = await getDailyHabits(year, month, entry.day);
          const habitLog = dailyHabits.habits.find(h => h.habitId === habitId);
          if (habitLog) {
            allLogs.push(habitLog);
            totalDays++;
            if (habitLog.completed) {
              completedDays++;
              if (habitLog.completedAt && (!lastCompleted || habitLog.completedAt > lastCompleted)) {
                lastCompleted = habitLog.completedAt;
              }
            }
          }
        }
      }
    }
    
    // Sort logs by date to calculate streaks
    allLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate streaks
    for (let i = allLogs.length - 1; i >= 0; i--) {
      if (allLogs[i].completed) {
        currentStreak = currentStreak === 0 ? 1 : currentStreak;
        tempStreak++;
        if (i === allLogs.length - 1) {
          currentStreak = tempStreak;
        }
      } else {
        if (tempStreak > bestStreak) {
          bestStreak = tempStreak;
        }
        if (i === allLogs.length - 1) {
          currentStreak = 0;
        }
        tempStreak = 0;
      }
    }
    
    if (tempStreak > bestStreak) {
      bestStreak = tempStreak;
    }
    
    return {
      habitId,
      totalDays,
      completedDays,
      streak: currentStreak,
      bestStreak,
      completionRate: totalDays > 0 ? (completedDays / totalDays) * 100 : 0,
      lastCompleted
    };
  } catch (error) {
    console.error(`Error calculating habit stats for ${habitId}:`, error);
    return {
      habitId,
      totalDays: 0,
      completedDays: 0,
      streak: 0,
      bestStreak: 0,
      completionRate: 0
    };
  }
}