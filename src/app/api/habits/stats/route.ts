import { NextRequest, NextResponse } from 'next/server';
import { getHabitStats } from '@/lib/file-operations';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const habitId = searchParams.get('habitId');

    if (!habitId) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    const stats = await getHabitStats(habitId);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching habit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit stats' },
      { status: 500 }
    );
  }
}