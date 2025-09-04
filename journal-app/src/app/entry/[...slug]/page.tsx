import Link from 'next/link';
import { readEntry } from '@/lib/file-operations';
import { MONTH_NAMES, MONTH_FULL_NAMES, MonthName } from '@/types/journal';
import { ReactMarkdown, markdownOptions } from '@/lib/markdown';
import { formatDate } from '@/lib/utils';

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export default async function EntryPage({ params }: PageProps) {
  const { slug } = await params;
  const [year, month, day] = slug;

  if (!year || !month || !day) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
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

  if (!entry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
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
              href={`/entry/${year}/${month}/${day}/edit`}
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Navigation */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <Link 
                href="/" 
                className="text-blue-600 hover:text-blue-800"
              >
                All Years
              </Link>
              <span className="text-gray-300">/</span>
              <Link 
                href={`/year/${year}`} 
                className="text-blue-600 hover:text-blue-800"
              >
                {year}
              </Link>
              <span className="text-gray-300">/</span>
              <Link 
                href={`/month/${year}/${month}`} 
                className="text-blue-600 hover:text-blue-800"
              >
                {MONTH_FULL_NAMES[month as MonthName]}
              </Link>
            </div>
          </div>

          {/* Journal Entry */}
          <div className="bg-white/90 backdrop-blur rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {formatDate(entryDate)}
                  </h1>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>{entry.wordCount} words</span>
                    <span>•</span>
                    <span>{MONTH_FULL_NAMES[month as MonthName]} {day}, {year}</span>
                  </div>
                </div>
                <Link
                  href={`/entry/${year}/${month}/${day}/edit`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Edit Entry
                </Link>
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
                    {Array.from({ length: 50 }, (_, i) => (
                      <div key={i} className="h-px bg-blue-100 opacity-30"></div>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="relative pl-16 pr-4 py-2">
                  <div className="prose prose-lg max-w-none">
                    <ReactMarkdown {...markdownOptions}>
                      {entry.content}
                    </ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation between entries */}
          <div className="mt-8 flex justify-center">
            <Link
              href={`/month/${year}/${month}`}
              className="px-6 py-3 bg-white/80 text-gray-700 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 border border-gray-200"
            >
              ← Back to {MONTH_FULL_NAMES[month as MonthName]} {year}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}