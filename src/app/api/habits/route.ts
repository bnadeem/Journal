import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/libsql';
import { withAuth } from '@/lib/api-auth';

export async function GET(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;
  try {
    const result = await client.execute(
      'SELECT * FROM Habit WHERE isActive = 1 ORDER BY createdAt DESC'
    );
    
    const habits = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      description: row.description || '',
      category: row.category,
      color: row.color,
      targetFrequency: row.targetFrequency,
      isActive: Boolean(row.isActive),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
    
    return NextResponse.json(habits);
  } catch (error) {
    console.error('Error fetching habits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch habits' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;
  
  try {
    const body = await request.json();
    const { name, description, category, color, targetFrequency, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.create({
      data: {
        name,
        description: description || '',
        category,
        color,
        targetFrequency,
        isActive: isActive !== undefined ? isActive : true,
      }
    });

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    console.error('Error creating habit:', error);
    return NextResponse.json(
      { error: 'Failed to create habit' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authError = await withAuth(request);
  if (authError) return authError;
  
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    const habit = await prisma.habit.update({
      where: { id },
      data: updates
    });

    return NextResponse.json(habit);
  } catch (error) {
    console.error('Error updating habit:', error);
    return NextResponse.json(
      { error: 'Failed to update habit' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    await prisma.habit.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}