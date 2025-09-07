import { NextRequest, NextResponse } from 'next/server';
import { getHabitData } from '@/lib/habits';
import { withAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;

  try {
    const habitData = await getHabitData();
    return NextResponse.json(habitData);
  } catch (error) {
    console.error('Error fetching habit data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit data' },
      { status: 500 }
    );
  }
}
