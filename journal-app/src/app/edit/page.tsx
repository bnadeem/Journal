'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JournalEditor from '@/components/journal/JournalEditor';
import { MONTH_NAMES, MONTH_FULL_NAMES, MonthName } from '@/types/journal';

export default function EditEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get date parameters from URL
  const year = searchParams.get('year');
  const month = searchParams.get('month') as MonthName;
  const day = searchParams.get('day');

  useEffect(() => {
    if (!year || !month || !day) {
      setIsFetching(false);
      return;
    }

    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/entries/${year}/${month}/${day}`);
        
        if (response.status === 404) {
          // Entry doesn't exist, start with empty content
          setContent('');
        } else if (response.ok) {
          const data = await response.json();
          setContent(data.entry.content || '');
        } else {
          throw new Error('Failed to fetch entry');
        }
      } catch (err) {
        setError('Failed to load entry');
        console.error('Error fetching entry:', err);
      } finally {
        setIsFetching(false);
      }
    };

    fetchEntry();
  }, [year, month, day]);

  const handleSave = async (newContent: string) => {
    if (!year || !month || !day) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/entries/${year}/${month}/${day}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newContent,
          frontmatter: {}
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save entry');
      }

      setContent(newContent);
      return Promise.resolve();
    } catch (err) {
      setError('Failed to save entry');
      console.error('Error saving entry:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSave = async (newContent: string) => {
    try {
      await handleSave(newContent);
      // Navigate back to the entry view only on manual save
      router.push(`/entry/${year}/${month}/${day}`);
    } catch (err) {
      // Error already handled in handleSave
    }
  };

  const handleCancel = () => {
    if (year && month && day) {
      router.push(`/entry/${year}/${month}/${day}`);
    } else {
      router.push('/');
    }
  };

  if (!year || !month || !day) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Missing Parameters</h1>
          <p className="text-gray-600 mb-6">Please provide year, month, and day in the URL parameters.</p>
          <button 
            onClick={() => router.push('/')}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Journal
          </button>
        </div>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading entry...</p>
        </div>
      </div>
    );
  }

  const title = `${MONTH_FULL_NAMES[month]} ${day}, ${year}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Navigation */}
          <div className="mb-6">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <button 
                onClick={() => router.push('/')}
                className="hover:text-blue-600 transition-colors"
              >
                All Years
              </button>
              <span>/</span>
              <button 
                onClick={() => router.push(`/year/${year}`)}
                className="hover:text-blue-600 transition-colors"
              >
                {year}
              </button>
              <span>/</span>
              <button 
                onClick={() => router.push(`/month/${year}/${month}`)}
                className="hover:text-blue-600 transition-colors"
              >
                {MONTH_FULL_NAMES[month]}
              </button>
              <span>/</span>
              <span className="text-gray-900 font-medium">Edit Entry</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Journal Editor */}
          <JournalEditor
            initialContent={content}
            title={title}
            onSave={handleSave}
            onManualSave={handleManualSave}
            onCancel={handleCancel}
            isLoading={isLoading}
            enableAutoSave={true}
            autoSaveDelay={3000}
          />
        </div>
      </div>
    </div>
  );
}