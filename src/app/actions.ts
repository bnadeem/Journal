'use server';

import client from '@/lib/libsql';
import { revalidatePath } from 'next/cache';

import { MonthName } from '@/types/journal';

export async function toggleHabitAction(habitId: string, date: Date, slug: {year: string, month: string, day: string} | null) {
  const dateString = date.toISOString().split('T')[0];

  // Check if habit log exists
  const existingResult = await client.execute({
    sql: 'SELECT * FROM HabitLog WHERE habitId = ? AND date = ?',
    args: [habitId, dateString],
  });

  const currentlyCompleted = existingResult.rows.length > 0 ? Boolean(existingResult.rows[0].completed) : false;
  const newCompleted = !currentlyCompleted;

  // Toggle the habit
  await client.execute({
    sql: `INSERT OR REPLACE INTO HabitLog (id, habitId, date, completed, createdAt) 
          VALUES (?, ?, ?, ?, datetime('now'))`,
    args: [
      `${habitId}-${dateString}`,
      habitId,
      dateString,
      newCompleted ? 1 : 0,
    ],
  });

  revalidatePath('/habits');
  if (slug) {
    revalidatePath(`/entry/${slug.year}/${slug.month}/${slug.day}`);
  }
}

export async function saveSummaryAction(year: string, month: MonthName, content: string) {
  try {
    await client.execute({
      sql: `
        INSERT OR REPLACE INTO MonthlySummary (year, month, content, updatedAt)
        VALUES (?, ?, ?, datetime('now'))
      `,
      args: [parseInt(year), month, content],
    });
    revalidatePath(`/month/${year}/${month}`);
    revalidatePath(`/summary/${year}/${month}`);
  } catch (error) {
    console.error('Error saving summary:', error);
    throw new Error('Failed to save summary');
  }
}

export async function createHabitAction(formData: FormData) {
  const habit = {
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    color: formData.get('color') as string,
    targetFrequency: formData.get('targetFrequency') as string,
  };

  try {
    await client.execute({
      sql: 'INSERT INTO Habit (name, description, category, color, targetFrequency) VALUES (?, ?, ?, ?, ?)',
      args: [habit.name, habit.description, habit.category, habit.color, habit.targetFrequency],
    });
    revalidatePath('/habits');
  } catch (error) {
    console.error('Error creating habit:', error);
    throw new Error('Failed to create habit');
  }
}

export async function updateHabitAction(formData: FormData) {
  const habit = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    category: formData.get('category') as string,
    color: formData.get('color') as string,
    targetFrequency: formData.get('targetFrequency') as string,
  };

  try {
    await client.execute({
      sql: 'UPDATE Habit SET name = ?, description = ?, category = ?, color = ?, targetFrequency = ? WHERE id = ?',
      args: [habit.name, habit.description, habit.category, habit.color, habit.targetFrequency, habit.id],
    });
    revalidatePath('/habits');
  } catch (error) {
    console.error('Error updating habit:', error);
    throw new Error('Failed to update habit');
  }
}

export async function toggleHabitActiveAction(habitId: string, isActive: boolean) {
  try {
    await client.execute({
      sql: 'UPDATE Habit SET isActive = ? WHERE id = ?',
      args: [isActive ? 1 : 0, habitId],
    });
    revalidatePath('/habits');
  } catch (error) {
    console.error('Error toggling habit active state:', error);
    throw new Error('Failed to toggle habit active state');
  }
}

export async function deleteHabitAction(habitId: string) {
  try {
    await client.execute({
      sql: 'DELETE FROM Habit WHERE id = ?',
      args: [habitId],
    });
    revalidatePath('/habits');
  } catch (error) {
    console.error('Error deleting habit:', error);
    throw new Error('Failed to delete habit');
  }
}