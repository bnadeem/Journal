import { NextRequest, NextResponse } from 'next/server';
import client from '@/lib/libsql';
import { MONTH_NAMES } from '@/types/journal';
import { getHabitData } from '@/lib/habits'; // Import habit data function

interface Params {
  slug: string[];
}

// GET /api/entries/[year]/[month]/[day] - Get specific entry
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    const [year, month, day] = slug;

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: 'Missing required parameters: year, month, day' },
        { status: 400 }
      );
    }

    if (!MONTH_NAMES.includes(month as any)) {
      return NextResponse.json(
        { error: 'Invalid month name' },
        { status: 400 }
      );
    }

    // Fetch journal entry
    const entryResult = await client.execute({
      sql: 'SELECT * FROM JournalEntry WHERE year = ? AND month = ? AND day = ?',
      args: [parseInt(year), month, parseInt(day)]
    });

    const entry = entryResult.rows[0] || null;
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Parse frontmatter if it exists
    const frontmatter = entry.frontmatter ? JSON.parse(entry.frontmatter as string) : {};

    // Fetch habit data
    const habitData = await getHabitData();

    return NextResponse.json({ 
      entry: {
        year: String(entry.year),
        month: entry.month as string,
        day: String(entry.day),
        content: entry.content as string,
        frontmatter
      },
      habitData // Include habit data in the response
    });

  } catch (error) {
    console.error('Error reading entry:', error);
    return NextResponse.json(
      { error: 'Failed to read entry' },
      { status: 500 }
    );
  }
}

// PUT /api/entries/[year]/[month]/[day] - Update entry
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    const [year, month, day] = slug;

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: 'Missing required parameters: year, month, day' },
        { status: 400 }
      );
    }

    if (!MONTH_NAMES.includes(month as any)) {
      return NextResponse.json(
        { error: 'Invalid month name' },
        { status: 400 }
      );
    }

    const { content, frontmatter } = await request.json();

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();
    const frontmatterStr = frontmatter && Object.keys(frontmatter).length > 0 ? JSON.stringify(frontmatter) : null;

    // Check if entry exists
    const existingResult = await client.execute({
      sql: 'SELECT id FROM JournalEntry WHERE year = ? AND month = ? AND day = ?',
      args: [parseInt(year), month, parseInt(day)]
    });

    let entry;
    if (existingResult.rows.length > 0) {
      // Update existing entry
      await client.execute({
        sql: 'UPDATE JournalEntry SET content = ?, frontmatter = ?, updatedAt = ? WHERE year = ? AND month = ? AND day = ?',
        args: [content, frontmatterStr, now, parseInt(year), month, parseInt(day)]
      });
      
      entry = {
        year: parseInt(year),
        month,
        day: parseInt(day),
        content,
        frontmatter: frontmatterStr
      };
    } else {
      // Create new entry
      await client.execute({
        sql: 'INSERT INTO JournalEntry (id, year, month, day, content, frontmatter, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        args: [crypto.randomUUID(), parseInt(year), month, parseInt(day), content, frontmatterStr, now, now]
      });
      
      entry = {
        year: parseInt(year),
        month,
        day: parseInt(day),
        content,
        frontmatter: frontmatterStr
      };
    }

    // Return the entry in expected format
    return NextResponse.json({ 
      entry: {
        year: String(entry.year),
        month: entry.month as string,
        day: String(entry.day),
        content: entry.content as string,
        frontmatter: entry.frontmatter ? JSON.parse(entry.frontmatter as string) : {}
      }
    });

  } catch (error) {
    console.error('Error updating entry:', error);
    return NextResponse.json(
      { error: 'Failed to update entry' },
      { status: 500 }
    );
  }
}

// DELETE /api/entries/[year]/[month]/[day] - Delete entry
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug } = await params;
    const [year, month, day] = slug;

    if (!year || !month || !day) {
      return NextResponse.json(
        { error: 'Missing required parameters: year, month, day' },
        { status: 400 }
      );
    }

    if (!MONTH_NAMES.includes(month as any)) {
      return NextResponse.json(
        { error: 'Invalid month name' },
        { status: 400 }
      );
    }

    await client.execute({
      sql: 'DELETE FROM JournalEntry WHERE year = ? AND month = ? AND day = ?',
      args: [parseInt(year), month, parseInt(day)]
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}