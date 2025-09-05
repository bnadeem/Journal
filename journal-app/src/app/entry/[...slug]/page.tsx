import Link from 'next/link';
import { readEntry, getAdjacentEntries } from '@/lib/file-operations';
import { MONTH_NAMES, MONTH_FULL_NAMES, MonthName } from '@/types/journal';
import { formatDate } from '@/lib/utils';
import HabitTrackerWrapper from '@/components/habits/HabitTrackerWrapper';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function EntryPage({ params }: PageProps) {
  const { slug } = await params;
  const [year, month, day] = slug;

  if (!year || !month || !day) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Entry URL</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Journal
          </Link>
        </div>
      </div>
    );
  }

  const entry = await readEntry(year, month as MonthName, day);
  const { prevEntry, nextEntry } = await getAdjacentEntries(year, month as MonthName, day);

  if (!entry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Entry Not Found</h1>
          <p className="text-gray-600 mb-6">
            No journal entry found for {MONTH_FULL_NAMES[month as MonthName]} {day}, {year}
          </p>
          <div className="space-x-4">
            <Link 
              href={`/month/${year}/${month}`}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to {MONTH_FULL_NAMES[month as MonthName]}
            </Link>
            <Link
              href={`/edit?year=${year}&month=${month}&day=${day}`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Entry
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const entryDate = `${year}-${MONTH_NAMES.indexOf(month as MonthName) + 1}-${day}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{formatDate(entryDate)}</h1>
                <p className="text-gray-600 text-sm">{entry.wordCount} words • {MONTH_FULL_NAMES[month as MonthName]} {day}, {year}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 text-sm"
              >
                All Years
              </Link>
              <Link
                href={`/year/${year}`}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 text-sm"
              >
                {year}
              </Link>
              <Link
                href={`/month/${year}/${month}`}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 text-sm"
              >
                {MONTH_FULL_NAMES[month as MonthName]}
              </Link>
              <Link
                href={`/edit?year=${year}&month=${month}&day=${day}`}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Edit Entry
              </Link>
            </div>
          </div>

          {/* Main Content: Journal Entry and Habits Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Journal Entry */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Journal Entry</h2>
                      <p className="text-gray-600 text-sm">Your thoughts and reflections for this day</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-8">
                  {/* Notebook Lines Background */}
                  <div className="relative">
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Left margin line */}
                      <div className="absolute left-12 top-0 bottom-0 w-px bg-red-200"></div>
                      
                      {/* Horizontal lines */}
                      <div className="space-y-6">
                        {Array.from({ length: Math.max(20, Math.ceil(entry.content.split('\n').length * 1.5)) }, (_, i) => (
                          <div key={i} className="h-px bg-blue-100 opacity-30"></div>
                        ))}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="relative pl-16 pr-4 py-2">
                      <div className="font-kalam text-gray-800 text-lg leading-6 whitespace-pre-wrap">
                        {entry.content}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Habit Tracker Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <HabitTrackerWrapper 
                  year={year}
                  month={month}
                  day={day}
                />
              </div>
            </div>
          </div>

          {/* Navigation between entries */}
          <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex justify-between items-center">
              {/* Previous Entry */}
              {prevEntry ? (
                <Link
                  href={`/entry/${prevEntry.year}/${prevEntry.month}/${prevEntry.day}`}
                  className="flex items-center px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 border border-gray-200 hover:border-blue-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <div className="text-left">
                    <div className="text-xs text-gray-500">Previous Entry</div>
                    <div className="font-medium">{MONTH_FULL_NAMES[prevEntry.month as MonthName]} {prevEntry.day}, {prevEntry.year}</div>
                  </div>
                </Link>
              ) : (
                <div className="invisible flex items-center px-4 py-3">
                  <div className="w-4 h-4 mr-2"></div>
                  <div className="text-left">
                    <div className="text-xs">Previous Entry</div>
                    <div className="font-medium">No previous entry</div>
                  </div>
                </div>
              )}

              {/* Back to Month */}
              <Link
                href={`/month/${year}/${month}`}
                className="px-6 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-200 border border-blue-200 font-medium"
              >
                ← {MONTH_FULL_NAMES[month as MonthName]} {year}
              </Link>

              {/* Next Entry */}
              {nextEntry ? (
                <Link
                  href={`/entry/${nextEntry.year}/${nextEntry.month}/${nextEntry.day}`}
                  className="flex items-center px-4 py-3 bg-gray-50 text-gray-700 rounded-lg hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 border border-gray-200 hover:border-blue-200"
                >
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Next Entry</div>
                    <div className="font-medium">{MONTH_FULL_NAMES[nextEntry.month as MonthName]} {nextEntry.day}, {nextEntry.year}</div>
                  </div>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ) : (
                <div className="invisible flex items-center px-4 py-3">
                  <div className="text-right">
                    <div className="text-xs">Next Entry</div>
                    <div className="font-medium">No next entry</div>
                  </div>
                  <div className="w-4 h-4 ml-2"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}