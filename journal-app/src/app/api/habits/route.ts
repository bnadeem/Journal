import { NextRequest, NextResponse } from 'next/server';
import { getAllHabits, createHabit, updateHabit, deleteHabit } from '@/lib/file-operations';

export async function GET() {
  try {
    const habits = await getAllHabits();
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
  try {
    const body = await request.json();
    const { name, description, category, color, targetFrequency, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Habit name is required' },
        { status: 400 }
      );
    }

    const habit = await createHabit({
      name,
      description,
      category,
      color,
      targetFrequency,
      isActive: isActive !== undefined ? isActive : true,
    });

    if (!habit) {
      return NextResponse.json(
        { error: 'Failed to create habit' },
        { status: 500 }
      );
    }

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
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Habit ID is required' },
        { status: 400 }
      );
    }

    const success = await updateHabit(id, updates);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update habit' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
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

    const success = await deleteHabit(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete habit' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting habit:', error);
    return NextResponse.json(
      { error: 'Failed to delete habit' },
      { status: 500 }
    );
  }
}