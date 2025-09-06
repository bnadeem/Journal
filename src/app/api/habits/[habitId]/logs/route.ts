import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/libsql';
import { HabitLog } from '@/types/journal';

interface RouteParams {
  params: Promise<{ habitId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { habitId } = await params;

    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    // Get date range from query params (optional)
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Generate date range for the last 3 months if no dates provided
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : new Date();
    
    if (!startDate) {
      startDateObj.setMonth(endDateObj.getMonth() - 3);
    }

    // Get existing habit logs from database
    const result = await client.execute({
      sql: `SELECT date, completed FROM HabitLog 
            WHERE habitId = ? AND date >= ? AND date <= ?`,
      args: [
        habitId,
        startDateObj.toISOString().split('T')[0],
        endDateObj.toISOString().split('T')[0]
      ]
    });

    // Convert to a map for quick lookup
    const logsMap = new Map(result.rows.map(row => [row.date as string, Boolean(row.completed)]));

    // Generate all dates in the range
    const habitLogs: HabitLog[] = [];
    const currentDate = new Date(startDateObj);
    
    while (currentDate <= endDateObj) {
      const dateString = currentDate.toISOString().split('T')[0];
      const completed = logsMap.get(dateString) || false;
      
      habitLogs.push({
        habitId,
        date: dateString,
        completed
      });
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return NextResponse.json(habitLogs);
  } catch (error) {
    console.error('Error fetching habit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit logs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { habitId } = await params;
    
    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { date, completed } = body;
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Use upsert-like logic with LibSQL
    await client.execute({
      sql: `INSERT OR REPLACE INTO HabitLog (id, habitId, date, completed, createdAt) 
            VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [
        `${habitId}-${date}`, // Simple ID based on habitId and date
        habitId,
        date,
        completed ? 1 : 0
      ]
    });

    // Return the habit log in expected format
    const response: HabitLog = {
      habitId,
      date,
      completed: completed ?? false
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating habit log:', error);
    return NextResponse.json(
      { error: 'Failed to update habit log' },
      { status: 500 }
    );
  }
}