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

    const now = new Date().toISOString();
    const result = await client.execute({
      sql: 'INSERT INTO Habit (id, name, description, category, color, targetFrequency, isActive, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [
        crypto.randomUUID(),
        name,
        description || '',
        category,
        color,
        targetFrequency,
        isActive !== undefined ? isActive : true,
        now,
        now
      ]
    });

    const habit = {
      id: result.lastInsertRowid,
      name,
      description: description || '',
      category,
      color,
      targetFrequency,
      isActive: isActive !== undefined ? isActive : true,
      createdAt: now,
      updatedAt: now
    };

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

    const now = new Date().toISOString();
    const updateFields = [];
    const args = [];
    
    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id') {
        updateFields.push(`${key} = ?`);
        args.push(value);
      }
    });
    
    updateFields.push('updatedAt = ?');
    args.push(now);
    args.push(id);

    await client.execute({
      sql: `UPDATE Habit SET ${updateFields.join(', ')} WHERE id = ?`,
      args
    });

    const result = await client.execute({
      sql: 'SELECT * FROM Habit WHERE id = ?',
      args: [id]
    });

    const habit = result.rows[0] ? {
      id: result.rows[0].id,
      name: result.rows[0].name,
      description: result.rows[0].description || '',
      category: result.rows[0].category,
      color: result.rows[0].color,
      targetFrequency: result.rows[0].targetFrequency,
      isActive: Boolean(result.rows[0].isActive),
      createdAt: result.rows[0].createdAt,
      updatedAt: result.rows[0].updatedAt
    } : null;

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

    await client.execute({
      sql: 'DELETE FROM Habit WHERE id = ?',
      args: [id]
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