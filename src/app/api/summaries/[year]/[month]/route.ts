import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/libsql';
import { MONTH_NAMES } from '@/types/journal';

interface Params {
  year: string;
  month: string;
}

// GET /api/summaries/[year]/[month] - Get monthly summary
export async function GET(
  _request: NextRequest,
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

    const result = await client.execute({
      sql: 'SELECT * FROM MonthlySummary WHERE year = ? AND month = ?',
      args: [parseInt(year), month]
    });

    const summary = result.rows[0] || null;
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
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
    console.error('Error reading summary:', error);
    return NextResponse.json(
      { error: 'Failed to read summary' },
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