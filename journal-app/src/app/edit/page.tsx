'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JournalEditor from '@/components/journal/JournalEditor';
import HabitTrackerWrapper from '@/components/habits/HabitTrackerWrapper';
import { MONTH_FULL_NAMES, MonthName } from '@/types/journal';

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
    } catch {
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading entry...</p>
        </div>
      </div>
    );
  }

  const title = `${MONTH_FULL_NAMES[month]} ${day}, ${year}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Entry</h1>
                <p className="text-gray-600 text-sm">Modify your journal entry for {title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 text-sm"
              >
                All Years
              </button>
              <button
                onClick={() => router.push(`/year/${year}`)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 text-sm"
              >
                {year}
              </button>
              <button
                onClick={() => router.push(`/month/${year}/${month}`)}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400 text-sm"
              >
                {MONTH_FULL_NAMES[month]}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400"
              >
                ← Back to Entry
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Main Content: Journal Editor and Habits Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Journal Editor */}
            <div className="lg:col-span-2">
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

            {/* Habit Tracker Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                <HabitTrackerWrapper 
                  year={year}
                  month={month}
                  day={day}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}