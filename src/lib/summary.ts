import client from '@/lib/libsql';
import { MONTH_FULL_NAMES, MonthName } from '@/types/journal';

export interface SummaryData {
  summaryContent: string;
  entriesCount: number;
}

export async function getSummaryData(year: string, month: MonthName): Promise<SummaryData> {
  let summaryContent = '';
  let entriesCount = 0;

  try {
    // Fetch existing summary
    const summaryResult = await client.execute({
      sql: 'SELECT content FROM MonthlySummary WHERE year = ? AND month = ?',
      args: [parseInt(year), month],
    });

    if (summaryResult.rows.length > 0) {
      summaryContent = summaryResult.rows[0].content as string || '';
    }

    // Fetch entries count
    const entriesResult = await client.execute({
        sql: 'SELECT COUNT(*) as count FROM JournalEntry WHERE year = ? AND month = ?',
        args: [parseInt(year), month],
    });

    if (entriesResult.rows.length > 0) {
        entriesCount = entriesResult.rows[0].count as number || 0;
    }

    // If no existing summary, provide a template
    if (!summaryContent && entriesCount > 0) {
      summaryContent = `# ${MONTH_FULL_NAMES[month]} ${year} Summary\n\n## Key Themes\n\n### [Theme 1]\n- \n\n### [Theme 2]\n- \n\n## Notable Entries\n- **[Date]**: [Brief description]\n\n## Overall Reflection\n${entriesCount} entries this month. \n\n## Looking Forward\n`;
    }
  } catch (err) {
    console.error('Error fetching summary data:', err);
  }

  return { summaryContent, entriesCount };
}
