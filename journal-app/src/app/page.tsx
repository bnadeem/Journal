import Link from 'next/link';
import { getAllYears } from '@/lib/file-operations';
import NewEntryButton from '@/components/ui/NewEntryButton';

export default async function Home() {
  const years = await getAllYears();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Personal Journal
          </h1>
          <p className="text-lg text-gray-600 mb-12">
            Your thoughts, reflections, and journey through life
          </p>

          <div className="bg-white/80 backdrop-blur rounded-lg shadow-lg p-8 border border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
              Journal Years
            </h2>
            
            {years.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {years.map((year) => (
                  <Link
                    key={year}
                    href={`/year/${year}`}
                    className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group"
                  >
                    <div className="text-xl font-semibold text-gray-900 group-hover:text-blue-600">
                      {year}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      View entries →
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-500 mb-4">
                  No journal entries found yet.
                </div>
                <Link
                  href="/entry/new"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Writing
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <NewEntryButton />
    </div>
  );
}
