'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import JournalEditor from '@/components/journal/JournalEditor';
import { MONTH_FULL_NAMES, MonthName } from '@/types/journal';

export default function MonthlySummaryPage() {
  const router = useRouter();
  const params = useParams();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entriesCount, setEntriesCount] = useState(0);

  const year = params.year as string;
  const month = params.month as MonthName;

  useEffect(() => {
    if (!year || !month) return;

    const fetchData = async () => {
      try {
        // Fetch existing summary
        const summaryResponse = await fetch(`/api/summaries/${year}/${month}`);
        let summaryContent = '';
        
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          summaryContent = summaryData.summary.content || '';
        }

        // Fetch entries count
        const entriesResponse = await fetch(`/api/entries?year=${year}&month=${month}`);
        let count = 0;
        
        if (entriesResponse.ok) {
          const entriesData = await entriesResponse.json();
          count = entriesData.entries?.length || 0;
        }

        // If no existing summary, provide a template
        if (!summaryContent && count > 0) {
          summaryContent = `# ${MONTH_FULL_NAMES[month]} ${year} Summary

## Key Themes

### [Theme 1]
- 

### [Theme 2]
- 

## Notable Entries
- **[Date]**: [Brief description]

## Overall Reflection
${count} entries this month. 

## Looking Forward
`;
        }

        setContent(summaryContent);
        setEntriesCount(count);
      } catch (err) {
        setError('Failed to load summary data');
        console.error('Error fetching summary:', err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [year, month]);

  const handleSave = async (newContent: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/summaries/${year}/${month}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent,
          themes: [] // TODO: Extract themes from content
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save summary');
      }

      // Navigate back to the month view
      router.push(`/month/${year}/${month}`);
    } catch (err) {
      setError('Failed to save summary');
      console.error('Error saving summary:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/month/${year}/${month}`);
  };

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

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading summary...</p>
        </div>
      </div>
    );
  }

  const title = `${MONTH_FULL_NAMES[month]} ${year} Summary`;

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

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Summary Editor */}
          <JournalEditor
            initialContent={content}
            title={title}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isLoading}
            showPreview={false}
          />
        </div>
      </div>
    </div>
  );
}