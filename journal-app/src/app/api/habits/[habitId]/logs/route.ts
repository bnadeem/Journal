import { NextRequest, NextResponse } from 'next/server';
import { getAllYears, getYearMonths, getMonthEntries, getDailyHabits } from '@/lib/file-operations';
import { HabitLog, MONTH_NAMES } from '@/types/journal';

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

    const habitLogs: HabitLog[] = [];
    
    // Get all years
    const years = await getAllYears();
    
    for (const year of years) {
      const months = await getYearMonths(year);
      
      for (const month of months) {
        const entries = await getMonthEntries(year, month);
        
        for (const entry of entries) {
          try {
            const dailyHabits = await getDailyHabits(year, month, entry.day);
            const habitLog = dailyHabits.habits.find(h => h.habitId === habitId);
            
            if (habitLog) {
              // Apply date filtering if provided
              if (startDate || endDate) {
                const logDate = new Date(habitLog.date);
                
                if (startDate && logDate < new Date(startDate)) {
                  continue;
                }
                
                if (endDate && logDate > new Date(endDate)) {
                  continue;
                }
              }
              
              habitLogs.push(habitLog);
            } else {
              // Create a default habit log for this day if none exists
              const monthIndex = MONTH_NAMES.indexOf(month);
              const defaultLog = {
                habitId,
                date: `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(entry.day).padStart(2, '0')}`,
                completed: false
              };
              
              // Apply date filtering
              if (startDate || endDate) {
                const logDate = new Date(defaultLog.date);
                
                if (startDate && logDate < new Date(startDate)) {
                  continue;
                }
                
                if (endDate && logDate > new Date(endDate)) {
                  continue;
                }
              }
              
              habitLogs.push(defaultLog);
            }
          } catch (error) {
            console.error(`Error processing entry ${year}/${month}/${entry.day}:`, error);
          }
        }
      }
    }

    // Sort by date
    habitLogs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json(habitLogs);
  } catch (error) {
    console.error('Error fetching habit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habit logs' },
      { status: 500 }
    );
  }
}