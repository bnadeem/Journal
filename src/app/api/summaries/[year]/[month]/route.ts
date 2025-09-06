import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MONTH_NAMES } from '@/types/journal';

interface Params {
  year: string;
  month: string;
}

// GET /api/summaries/[year]/[month] - Get monthly summary
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { year, month } = await params;

    if (!MONTH_NAMES.includes(month as any)) {
      return NextResponse.json(
        { error: 'Invalid month name' },
        { status: 400 }
      );
    }

    const summary = await prisma.monthlySummary.findUnique({
      where: {
        year_month: {
          year: parseInt(year),
          month: month as any
        }
      }
    });
    
    if (!summary) {
      return NextResponse.json(
        { error: 'Summary not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      summary: {
        year: summary.year.toString(),
        month: summary.month,
        content: summary.content,
        createdAt: summary.createdAt,
        updatedAt: summary.updatedAt
      }
    });

  } catch (error) {
    console.error('Error reading summary:', error);
    return NextResponse.json(
      { error: 'Failed to read summary' },
      { status: 500 }
    );
  }
}

// PUT /api/summaries/[year]/[month] - Create or update monthly summary
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { year, month } = await params;

    if (!MONTH_NAMES.includes(month as any)) {
      return NextResponse.json(
        { error: 'Invalid month name' },
        { status: 400 }
      );
    }

    const { content } = await request.json();

    if (typeof content !== 'string') {
      return NextResponse.json(
        { error: 'Content must be a string' },
        { status: 400 }
      );
    }

    const summary = await prisma.monthlySummary.upsert({
      where: {
        year_month: {
          year: parseInt(year),
          month: month as any
        }
      },
      update: {
        content,
        updatedAt: new Date()
      },
      create: {
        year: parseInt(year),
        month: month as any,
        content
      }
    });

    return NextResponse.json({ 
      summary: {
        year: summary.year.toString(),
        month: summary.month,
        content: summary.content,
        createdAt: summary.createdAt,
        updatedAt: summary.updatedAt
      }
    });

  } catch (error) {
    console.error('Error updating summary:', error);
    return NextResponse.json(
      { error: 'Failed to update summary' },
      { status: 500 }
    );
  }
}