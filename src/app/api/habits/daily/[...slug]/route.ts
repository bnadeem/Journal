import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/libsql';
import { MonthName, MONTH_NAMES } from '@/types/journal';

interface RouteParams {
  params: Promise<{ slug: string[] }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const [year, month, day] = slug;

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: 'Year, month, and day are required' },
        { status: 400 }
      );
    }

    const monthNumber = MONTH_NAMES.indexOf(month as MonthName) + 1;
    const date = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Get all active habits
    const habitsResult = await client.execute(
      'SELECT * FROM Habit WHERE isActive = 1'
    );

    // Get habit logs for this date
    const logsResult = await client.execute({
      sql: 'SELECT * FROM HabitLog WHERE date = ?',
      args: [date]
    });

    const logsMap = new Map(logsResult.rows.map(row => [row.habitId as string, {
      habitId: row.habitId as string,
      date: row.date as string,
      completed: Boolean(row.completed)
    }]));

    // Create daily habits structure
    const habits = habitsResult.rows.map(habit => {
      const existingLog = logsMap.get(habit.id as string);
      return {
        habitId: habit.id as string,
        date,
        completed: existingLog?.completed || false,
        completedAt: existingLog?.completed ? new Date().toISOString() : undefined
      };
    });

    const dailyHabits = {
      date,
      habits
    };

    return NextResponse.json(dailyHabits);
  } catch (error) {
    console.error('Error fetching daily habits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch daily habits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const [year, month, day] = slug;
    const body = await request.json();
    const { habitId } = body;

    if (!year || !month || !day || !habitId) {
      return NextResponse.json(
        { error: 'Year, month, day, and habitId are required' },
        { status: 400 }
      );
    }

    const monthNumber = MONTH_NAMES.indexOf(month as MonthName) + 1;
    const date = `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Check if habit log exists
    const existingResult = await client.execute({
      sql: 'SELECT * FROM HabitLog WHERE habitId = ? AND date = ?',
      args: [habitId, date]
    });

    const currentlyCompleted = existingResult.rows.length > 0 ? Boolean(existingResult.rows[0].completed) : false;
    const newCompleted = !currentlyCompleted;

    // Toggle the habit
    await client.execute({
      sql: `INSERT OR REPLACE INTO HabitLog (id, habitId, date, completed, createdAt) 
            VALUES (?, ?, ?, ?, datetime('now'))`,
      args: [
        `${habitId}-${date}`,
        habitId,
        date,
        newCompleted ? 1 : 0
      ]
    });

    // Return updated daily habits (reuse GET logic)
    // Get all active habits
    const habitsResult = await client.execute(
      'SELECT * FROM Habit WHERE isActive = 1'
    );

    // Get habit logs for this date
    const logsResult = await client.execute({
      sql: 'SELECT * FROM HabitLog WHERE date = ?',
      args: [date]
    });

    const logsMap = new Map(logsResult.rows.map(row => [row.habitId as string, {
      habitId: row.habitId as string,
      date: row.date as string,
      completed: Boolean(row.completed)
    }]));

    // Create daily habits structure
    const habits = habitsResult.rows.map(habit => {
      const existingLog = logsMap.get(habit.id as string);
      return {
        habitId: habit.id as string,
        date,
        completed: existingLog?.completed || false,
        completedAt: existingLog?.completed ? new Date().toISOString() : undefined
      };
    });

    const dailyHabits = {
      date,
      habits
    };

    return NextResponse.json(dailyHabits);
  } catch (error) {
    console.error('Error toggling habit:', error);
    return NextResponse.json(
      { error: 'Failed to toggle habit' },
      { status: 500 }
    );
  }
}