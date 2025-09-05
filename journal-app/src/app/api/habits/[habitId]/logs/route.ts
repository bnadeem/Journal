import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
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

    const habitLogs: HabitLog[] = [];
    
    // Generate date range for the last 3 months if no dates provided
    const endDateObj = endDate ? new Date(endDate) : new Date();
    const startDateObj = startDate ? new Date(startDate) : new Date();
    
    if (!startDate) {
      startDateObj.setMonth(endDateObj.getMonth() - 3);
    }

    // Generate all dates in the range
    const currentDate = new Date(startDateObj);
    while (currentDate <= endDateObj) {
      const year = currentDate.getFullYear().toString();
      const month = currentDate.toLocaleString('default', { month: 'short' });
      const day = currentDate.getDate().toString();
      
      // Check if habit log file exists for this date
      const journalRoot = path.resolve(process.cwd(), '../');
      const habitFilePath = path.join(journalRoot, year, month, `${day}-habits.json`);
      
      let completed = false;
      
      if (fs.existsSync(habitFilePath)) {
        try {
          const habitData = JSON.parse(fs.readFileSync(habitFilePath, 'utf-8'));
          const habitLog = habitData.habits?.find((h: any) => h.habitId === habitId);
          completed = habitLog?.completed || false;
        } catch (error) {
          console.error(`Error reading habit file ${habitFilePath}:`, error);
        }
      }
      
      // Create habit log entry
      const dateString = currentDate.toISOString().split('T')[0];
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

    // Parse the date to get year, month, day
    const targetDate = new Date(date);
    const year = targetDate.getFullYear().toString();
    const month = targetDate.toLocaleString('default', { month: 'short' });
    const day = targetDate.getDate().toString();
    
    // Create directory structure if it doesn't exist
    const journalRoot = path.resolve(process.cwd(), '../');
    const monthDir = path.join(journalRoot, year, month);
    const habitFilePath = path.join(monthDir, `${day}-habits.json`);
    
    if (!fs.existsSync(monthDir)) {
      fs.mkdirSync(monthDir, { recursive: true });
    }

    // Read existing habit data or create new structure
    let habitData: { habits: any[] } = { habits: [] };
    if (fs.existsSync(habitFilePath)) {
      try {
        habitData = JSON.parse(fs.readFileSync(habitFilePath, 'utf-8'));
      } catch (error) {
        console.error(`Error reading habit file ${habitFilePath}:`, error);
        // Use default structure if file is corrupted
      }
    }

    // Ensure habits array exists
    if (!habitData.habits) {
      habitData.habits = [];
    }

    // Find existing habit log or create new one
    const existingLogIndex = habitData.habits.findIndex((h: any) => h.habitId === habitId);
    
    if (existingLogIndex >= 0) {
      // Update existing log
      habitData.habits[existingLogIndex].completed = completed;
      habitData.habits[existingLogIndex].updatedAt = new Date().toISOString();
    } else {
      // Create new log
      habitData.habits.push({
        habitId,
        completed,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Write updated data back to file
    fs.writeFileSync(habitFilePath, JSON.stringify(habitData, null, 2));

    // Return the updated habit log
    const habitLog: HabitLog = {
      habitId,
      date,
      completed
    };

    return NextResponse.json(habitLog);
  } catch (error) {
    console.error('Error updating habit log:', error);
    return NextResponse.json(
      { error: 'Failed to update habit log' },
      { status: 500 }
    );
  }
}