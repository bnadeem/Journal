import Link from 'next/link';
import { headers } from 'next/headers';
import { MONTH_FULL_NAMES, MonthName } from '@/types/journal';
import SummaryEditor from '@/components/journal/SummaryEditor';
import { Suspense } from 'react';

interface PageProps {
  params: { 
    year: string;
    month: MonthName;
  };
}

async function getSummaryData(year: string, month: MonthName, host: string | null, cookie: string | null) {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  const url = `${protocol}://${host}/api/summaries/${year}/${month}`;

  const res = await fetch(url, {
    cache: 'no-store',
    headers: {
      cookie: cookie || '',
    },
  });

  if (!res.ok) {
    console.error(`Failed to fetch summary data: ${res.statusText}`);
    // Return default values on error
    return { summaryContent: '', entriesCount: 0 };
  }
  return res.json();
}

export default async function MonthlySummaryPage({ params }: PageProps) {
  const { year, month } = params;

  if (!year || !month) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid URL</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Journal
          </Link>
        </div>
      </div>
    );
  }

  const headersList = headers();
  const host = headersList.get('host');
  const cookie = headersList.get('cookie');
  const { summaryContent, entriesCount } = await getSummaryData(year, month, host, cookie);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <Link href="/" className="hover:text-blue-600 transition-colors">
                All Years
              </Link>
              <span>/</span>
              <Link 
                href={`/year/${year}`}
                className="hover:text-blue-600 transition-colors"
              >
                {year}
              </Link>
              <span>/</span>
              <Link 
                href={`/month/${year}/${month}`}
                className="hover:text-blue-600 transition-colors"
              >
                {MONTH_FULL_NAMES[month]}
              </Link>
              <span>/</span>
              <span className="text-gray-900 font-medium">Monthly Summary</span>
            </div>
          </div>

          {/* Summary Info */}
          <div className="mb-6 bg-white/80 backdrop-blur rounded-lg shadow-lg p-6 border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Monthly Summary</h2>
                <p className="text-gray-600">
                  Reflect on your {entriesCount} journal {entriesCount === 1 ? 'entry' : 'entries'} from {MONTH_FULL_NAMES[month]} {year}
                </p>
              </div>
              <Link
                href={`/month/${year}/${month}`}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                View Entries
              </Link>
            </div>
            
            {entriesCount === 0 && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-yellow-800 text-sm">
                  No journal entries found for this month. Consider creating some entries before writing a summary.
                </p>
              </div>
            )}
          </div>

          <Suspense fallback={<div>Loading editor...</div>}>
            <SummaryEditor 
              year={year} 
              month={month} 
              initialContent={summaryContent} 
              entriesCount={entriesCount} 
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}