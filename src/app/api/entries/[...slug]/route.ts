import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

    const entry = await prisma.journalEntry.findUnique({
      where: {
        year_month_day: {
          year: parseInt(year),
          month: month as any,
          day: parseInt(day)
        }
      }
    });
    
    if (!entry) {
      return NextResponse.json(
        { error: 'Entry not found' },
        { status: 404 }
      );
    }

    // Parse frontmatter if it exists
    const frontmatter = entry.frontmatter ? JSON.parse(entry.frontmatter) : {};

    return NextResponse.json({ 
      entry: {
        year: entry.year.toString(),
        month: entry.month,
        day: entry.day.toString(),
        content: entry.content,
        frontmatter
      }
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

    // Upsert the journal entry
    const entry = await prisma.journalEntry.upsert({
      where: {
        year_month_day: {
          year: parseInt(year),
          month: month as any,
          day: parseInt(day)
        }
      },
      update: {
        content,
        frontmatter: frontmatter && Object.keys(frontmatter).length > 0 ? JSON.stringify(frontmatter) : null,
        updatedAt: new Date()
      },
      create: {
        year: parseInt(year),
        month: month as any,
        day: parseInt(day),
        content,
        frontmatter: frontmatter && Object.keys(frontmatter).length > 0 ? JSON.stringify(frontmatter) : null
      }
    });

    // Return the entry in expected format
    return NextResponse.json({ 
      entry: {
        year: entry.year.toString(),
        month: entry.month,
        day: entry.day.toString(),
        content: entry.content,
        frontmatter: entry.frontmatter ? JSON.parse(entry.frontmatter) : {}
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

    await prisma.journalEntry.delete({
      where: {
        year_month_day: {
          year: parseInt(year),
          month: month as any,
          day: parseInt(day)
        }
      }
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