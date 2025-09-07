import Link from 'next/link';
import { headers } from 'next/headers';
import NewEntryButton from '@/components/ui/NewEntryButton';

async function getYears(host: string | null, cookie: string | null): Promise<string[]> {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  const res = await fetch(`${protocol}://${host}/api/entries`, {
    cache: 'no-store',
    headers: {
      cookie: cookie || '',
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch years', await res.text());
    return [];
  }

  const data = await res.json();
  return data.years || [];
}

export default async function AllYearsPage() {
  const headersList = await headers();
  const host = headersList.get('host');
  const cookie = headersList.get('cookie');
  const years = await getYears(host, cookie);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Journal Archive</h1>
                <p className="text-gray-600 text-sm">Browse all your journal entries by year</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href="/"
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400"
              >
                ← Back to Dashboard
              </Link>
              <Link
                href="/entry/new"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                New Entry
              </Link>
            </div>
          </div>

          {/* Years Overview */}
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
                    <h2 className="text-lg font-semibold text-gray-900">Yearly Archives</h2>
                    <p className="text-gray-600 text-sm">Browse your journal entries by year</p>
                  </div>
                </div>
                <div className="text-sm text-blue-600 font-medium">
                  {years.length} {years.length === 1 ? 'year' : 'years'} of journaling
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {years.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {years.map((year) => (
                    <Link
                      key={year}
                      href={`/year/${year}`}
                      className="block p-6 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all duration-200 group hover:bg-blue-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xl font-bold text-gray-900 group-hover:text-blue-600">
                          {year}
                        </div>
                        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                      <div className="text-sm text-gray-600 group-hover:text-blue-600 transition-colors">
                        View entries from {year}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 mx-auto mb-6 text-gray-400">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">No journal entries yet</h3>
                  <p className="text-gray-600 mb-6">Start your journaling journey by creating your first entry!</p>
                  <Link
                    href="/entry/new"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create Your First Entry
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