import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/libsql';
import { withAuth } from '@/lib/api-auth';

// GET /api/entries - Get all years, or months for a year, or entries for a month
export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // If no params, return all years
    if (!year) {
      const result = await client.execute(
        'SELECT DISTINCT year FROM JournalEntry ORDER BY year DESC'
      );
      const years = result.rows.map(row => row.year?.toString() || '');
      return NextResponse.json({ years });
    }

    // If only year, return months for that year
    if (!month) {
      const result = await client.execute({
        sql: 'SELECT DISTINCT month FROM JournalEntry WHERE year = ? ORDER BY month',
        args: [parseInt(year)]
      });
      const months = result.rows.map(row => row.month as string);
      return NextResponse.json({ year, months });
    }

    // If both year and month, return entries for that month
    const result = await client.execute({
      sql: 'SELECT day, createdAt, updatedAt FROM JournalEntry WHERE year = ? AND month = ? ORDER BY day',
      args: [parseInt(year), month]
    });

    // Format entries to match expected structure
    const formattedEntries = result.rows.map(row => ({
      day: row.day?.toString() || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));

    return NextResponse.json({ year, month, entries: formattedEntries });

  } catch (error) {
    console.error('Error in entries API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}