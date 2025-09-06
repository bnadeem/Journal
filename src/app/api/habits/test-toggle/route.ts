import { NextRequest, NextResponse } from 'next/server';
import { toggleHabit, getAllHabits } from '@/lib/file-operations';

export async function POST(request: NextRequest) {
  try {
    const { habitId, year, month, day } = await request.json();

    if (!habitId || !year || !month || !day) {
      return NextResponse.json(
        { error: 'habitId, year, month, and day are required' },
        { status: 400 }
      );
    }

    // Toggle the habit
    const success = await toggleHabit(year, month, day, habitId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to toggle habit' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: `Habit toggled for ${year}/${month}/${day}` });
  } catch (error) {
    console.error('Error toggling habit for test:', error);
    return NextResponse.json(
      { error: 'Failed to toggle habit' },
      { status: 500 }
    );
  }
}

// GET endpoint to get all active habits for testing
export async function GET() {
  try {
    const habits = await getAllHabits();
    const activeHabits = habits.filter(h => h.isActive);
    return NextResponse.json(activeHabits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}