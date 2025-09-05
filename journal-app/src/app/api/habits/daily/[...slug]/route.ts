import { NextRequest, NextResponse } from 'next/server';
import { getDailyHabits, toggleHabit } from '@/lib/file-operations';
import { MonthName } from '@/types/journal';

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

    const dailyHabits = await getDailyHabits(year, month as MonthName, day);
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

    const success = await toggleHabit(year, month as MonthName, day, habitId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to toggle habit' },
        { status: 500 }
      );
    }

    // Return updated daily habits
    const dailyHabits = await getDailyHabits(year, month as MonthName, day);
    return NextResponse.json(dailyHabits);
  } catch (error) {
    console.error('Error toggling habit:', error);
    return NextResponse.json(
      { error: 'Failed to toggle habit' },
      { status: 500 }
    );
  }
}