import Link from 'next/link';
import { headers } from 'next/headers';
import { MONTH_FULL_NAMES } from '@/types/journal';
import NewEntryButton from '@/components/ui/NewEntryButton';

interface PageProps {
  params: Promise<{ year: string }>;
}

async function getMonths(year: string, host: string | null, cookie: string | null): Promise<string[]> {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  const res = await fetch(`${protocol}://${host}/api/entries?year=${year}`, {
    cache: 'no-store',
    headers: {
      cookie: cookie || '',
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch months', await res.text());
    return [];
  }

  const data = await res.json();
  return data.months || [];
}

export default async function YearPage({ params }: PageProps) {
  const { year } = await params;
  
  const headersList = await headers();
  const host = headersList.get('host');
  const cookie = headersList.get('cookie');
  const months = await getMonths(year, host, cookie);


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{year} Journal Entries</h1>
                <p className="text-gray-600 text-sm">Select a month to view your entries</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400"
              >
                ← Back to Years
              </Link>
              <Link
                href="/entry/new"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                New Entry
              </Link>
            </div>
          </div>

          {/* Monthly Overview */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Monthly Archives</h2>
                    <p className="text-gray-600 text-sm">Browse your {year} journal entries by month</p>
                  </div>
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  {months.length} {months.length === 1 ? 'month' : 'months'} available
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {months.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {months.map((month) => (
                    <Link
                      key={month}
                      href={`/month/${year}/${month}`}
                      className="block p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 group hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xl font-bold text-gray-900 group-hover:text-blue-600">
                          {MONTH_FULL_NAMES[month as keyof typeof MONTH_FULL_NAMES]}
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                        {month} {year} entries
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No entries for {year}</h3>
                  <p className="text-gray-600 mb-6">Start documenting your journey by creating your first entry!</p>
                  <Link
                    href="/entry/new"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Entry
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <NewEntryButton />
    </div>
  );
}