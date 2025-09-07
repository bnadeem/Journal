import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/libsql';
import { MONTH_NAMES, MONTH_FULL_NAMES, MonthName } from '@/types/journal';

interface Params {
  year: string;
  month: string;
}

// GET /api/summaries/[year]/[month] - Get monthly summary and related data
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { year, month } = await params;
    const monthName = month as MonthName;

    if (!MONTH_NAMES.includes(monthName)) {
      return NextResponse.json(
        { error: 'Invalid month name' },
        { status: 400 }
      );
    }

    let summaryContent = '';
    let entriesCount = 0;

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
        const countRow = entriesResult.rows[0];
        // Handle potential BigInt from Turso/libsql
        entriesCount = typeof countRow.count === 'bigint' ? Number(countRow.count) : (countRow.count as number || 0);
    }

    // If no existing summary, provide a template
    if (!summaryContent && entriesCount > 0) {
      summaryContent = `# ${MONTH_FULL_NAMES[monthName]} ${year} Summary\n\n## Key Themes\n\n### [Theme 1]\n- \n\n### [Theme 2]\n- \n\n## Notable Entries\n- **[Date]**: [Brief description]\n\n## Overall Reflection\n${entriesCount} entries this month. \n\n## Looking Forward\n`;
    }

    return NextResponse.json({
      summaryContent,
      entriesCount
    });

  } catch (error) {
    console.error('Error reading summary data:', error);
    return NextResponse.json(
      { error: 'Failed to read summary data' },
      { status: 500 }
    );
  }
}

// PUT /api/summaries/[year]/[month] - Create or update monthly summary
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { year, month } = await params;

    if (!MONTH_NAMES.includes(month as any)) {
      return NextResponse.json(
        { error: 'Invalid month name' },
        { status: 400 }
      );
    }

    const { content } = await request.json();

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // Check if summary exists
    const existingResult = await client.execute({
      sql: 'SELECT id FROM MonthlySummary WHERE year = ? AND month = ?',
      args: [parseInt(year), month]
    });

    let summary;
    if (existingResult.rows.length > 0) {
      // Update existing summary
      await client.execute({
        sql: 'UPDATE MonthlySummary SET content = ?, updatedAt = ? WHERE year = ? AND month = ?',
        args: [content, now, parseInt(year), month]
      });
      
      const updatedResult = await client.execute({
        sql: 'SELECT * FROM MonthlySummary WHERE year = ? AND month = ?',
        args: [parseInt(year), month]
      });
      
      summary = updatedResult.rows[0];
    } else {
      // Create new summary
      await client.execute({
        sql: 'INSERT INTO MonthlySummary (id, year, month, content, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?)',
        args: [crypto.randomUUID(), parseInt(year), month, content, now, now]
      });
      
      const newResult = await client.execute({
        sql: 'SELECT * FROM MonthlySummary WHERE year = ? AND month = ?',
        args: [parseInt(year), month]
      });
      
      summary = newResult.rows[0];
    }

    return NextResponse.json({ 
      summary: {
        year: String(summary.year),
        month: summary.month as string,
        content: summary.content as string,
        createdAt: summary.createdAt as string,
        updatedAt: summary.updatedAt as string
      }
    });

  } catch (error) {
    console.error('Error updating summary:', error);
    return NextResponse.json(
      { error: 'Failed to update summary' },
      { status: 500 }
    );
  }
}