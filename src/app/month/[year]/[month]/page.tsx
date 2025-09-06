import Link from 'next/link';
import { MONTH_FULL_NAMES, MonthName } from '@/types/journal';
import { ReactMarkdown } from '@/lib/markdown';
import NewEntryButton from '@/components/ui/NewEntryButton';
import client from '@/lib/libsql';

interface PageProps {
  params: Promise<{ year: string; month: string }>;
}

export default async function MonthPage({ params }: PageProps) {
  const { year, month } = await params;
  const monthName = month as MonthName;
  
  // Fetch entries directly from database
  let entries: any[] = [];
  
  try {
    const result = await client.execute({
      sql: 'SELECT day, content, createdAt, updatedAt FROM JournalEntry WHERE year = ? AND month = ? ORDER BY day',
      args: [parseInt(year), month]
    });

    entries = result.rows.map(row => ({
      day: row.day?.toString() || '',
      content: row.content as string || '',
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }));
  } catch (error) {
    console.error('Error fetching entries:', error);
  }
  
  // For now, we'll skip summary functionality as it requires separate API implementation
  const summary = null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{MONTH_FULL_NAMES[monthName]} {year}</h1>
                <p className="text-gray-600 text-sm">{entries.length} {entries.length === 1 ? 'entry' : 'entries'} this month</p>
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
                href="/entry/new"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                New Entry
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Journal Entries */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Daily Entries</h2>
                        <p className="text-gray-600 text-sm">Your journal entries for this month</p>
                      </div>
                    </div>
                    <div className="text-sm text-blue-600 font-medium">
                      {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {entries.length > 0 ? (
                    <div className="space-y-4">
                      {entries.map((entry) => (
                        <Link
                          key={entry.id}
                          href={`/entry/${year}/${month}/${entry.day}`}
                          className="block p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 group hover:bg-blue-50"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                              {monthName} {entry.day}, {year}
                            </div>
                            <div className="flex items-center space-x-3">
                              <div className="text-sm text-gray-500 bg-white px-2 py-1 rounded-full">
                                {entry.content ? entry.content.split(/\s+/).filter((word: string) => word.length > 0).length : 0} words
                              </div>
                              <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                          {entry.content && (
                            <p className="text-gray-600 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {entry.content.slice(0, 200)}...
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-20 h-20 mx-auto mb-6 text-gray-400">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No entries for {MONTH_FULL_NAMES[monthName]} {year}</h3>
                      <p className="text-gray-600 mb-6">Start documenting this month by creating your first entry!</p>
                      <Link
                        href="/entry/new"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Create Entry
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Monthly Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="p-6 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Monthly Summary</h2>
                      <p className="text-gray-600 text-sm">Reflections and key themes</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <h4 className="font-medium text-gray-900 mb-2">Summary feature temporarily disabled</h4>
                    <p className="text-gray-600 mb-4 text-sm">Monthly summaries will be re-enabled in a future update</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <NewEntryButton />
    </div>
  );
}