import Link from 'next/link';
import { getYearMonths } from '@/lib/file-operations';
import { MONTH_FULL_NAMES } from '@/types/journal';

interface PageProps {
  params: Promise<{ year: string }>;
}

export default async function YearPage({ params }: PageProps) {
  const { year } = await params;
  const months = await getYearMonths(year);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
            >
              ← Back to Years
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {year} Journal Entries
            </h1>
            <p className="text-lg text-gray-600">
              Select a month to view your entries
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur rounded-lg shadow-lg p-8 border border-gray-200">
            {months.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {months.map((month) => (
                  <Link
                    key={month}
                    href={`/month/${year}/${month}`}
                    className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                      {MONTH_FULL_NAMES[month]}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {month} {year}
                    </div>
                    <div className="text-sm text-blue-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      View entries →
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  No entries found for {year}.
                </div>
                <Link
                  href="/entry/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create First Entry
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}