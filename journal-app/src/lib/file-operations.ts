import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { JournalEntry, MonthlySummary, MonthName, MONTH_NAMES } from '@/types/journal';
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