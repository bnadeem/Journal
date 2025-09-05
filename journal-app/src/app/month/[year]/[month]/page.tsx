import Link from 'next/link';
import { getMonthEntries, readSummary } from '@/lib/file-operations';
import { MONTH_FULL_NAMES, MonthName } from '@/types/journal';
import { ReactMarkdown } from '@/lib/markdown';
import NewEntryButton from '@/components/ui/NewEntryButton';

interface PageProps {
  params: Promise<{ year: string; month: string }>;
}

export default async function MonthPage({ params }: PageProps) {
  const { year, month } = await params;
  const monthName = month as MonthName;
  
  const [entries, summary] = await Promise.all([
    getMonthEntries(year, monthName),
    readSummary(year, monthName)
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-800"
              >
                ← All Years
              </Link>
              <span className="text-gray-300">/</span>
              <Link 
                href={`/year/${year}`} 
                className="text-blue-600 hover:text-blue-800"
              >
                {year}
              </Link>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {MONTH_FULL_NAMES[monthName]} {year}
            </h1>
            <p className="text-lg text-gray-600">
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'} this month
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Journal Entries */}
            <div className="lg:col-span-2">
              <div className="bg-white/80 backdrop-blur rounded-lg shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-2xl font-semibold text-gray-800">
                    Daily Entries
                  </h2>
                </div>
                
                <div className="p-6">
                  {entries.length > 0 ? (
                    <div className="space-y-4">
                      {entries.map((entry) => (
                        <Link
                          key={entry.id}
                          href={`/entry/${year}/${month}/${entry.day}`}
                          className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
                              {monthName} {entry.day}, {year}
                            </div>
                            <div className="text-sm text-gray-500">
                              {entry.wordCount} words
                            </div>
                          </div>
                          {entry.excerpt && (
                            <p className="text-gray-600 text-sm line-clamp-2">
                              {entry.excerpt}
                            </p>
                          )}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="text-gray-500 mb-4">
                        No entries for {MONTH_FULL_NAMES[monthName]} {year}.
                      </div>
                      <Link
                        href="/entry/new"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
              <div className="bg-white/80 backdrop-blur rounded-lg shadow-lg border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">
                    Monthly Summary
                  </h2>
                </div>
                
                <div className="p-6">
                  {summary ? (
                    <div className="prose prose-sm max-w-none">
                      <ReactMarkdown>{summary.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-500 mb-4 text-sm">
                        No summary available yet.
                      </div>
                      <Link
                        href={`/summary/${year}/${month}`}
                        className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Create Summary
                      </Link>
                    </div>
                  )}
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