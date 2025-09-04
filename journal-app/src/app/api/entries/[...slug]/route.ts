import { NextRequest, NextResponse } from 'next/server';
import { readEntry, writeEntry, deleteEntry } from '@/lib/file-operations';
import { MONTH_NAMES } from '@/types/journal';

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

    const entry = await readEntry(year, month as any, day);
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ entry });

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

    const success = await writeEntry(year, month as any, day, content, frontmatter);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to write entry' },
        { status: 500 }
      );
    }

    // Return the updated entry
    const entry = await readEntry(year, month as any, day);
    return NextResponse.json({ entry });

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

    const success = await deleteEntry(year, month as any, day);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete entry or entry not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting entry:', error);
    return NextResponse.json(
      { error: 'Failed to delete entry' },
      { status: 500 }
    );
  }
}