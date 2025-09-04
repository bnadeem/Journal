import { NextRequest, NextResponse } from 'next/server';
import { getAllYears, getYearMonths, getMonthEntries } from '@/lib/file-operations';

// GET /api/entries - Get all years, or months for a year, or entries for a month
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    // If no params, return all years
    if (!year) {
      const years = await getAllYears();
      return NextResponse.json({ years });
    }

    // If only year, return months for that year
    if (!month) {
      const months = await getYearMonths(year);
      return NextResponse.json({ year, months });
    }

    // If both year and month, return entries for that month
    const entries = await getMonthEntries(year, month as any);
    return NextResponse.json({ year, month, entries });

  } catch (error) {
    console.error('Error in entries API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 }
    );
  }
}