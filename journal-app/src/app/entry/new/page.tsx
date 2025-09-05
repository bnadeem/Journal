'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JournalEditor from '@/components/journal/JournalEditor';
import { MONTH_NAMES, MONTH_FULL_NAMES, MonthName } from '@/types/journal';
import { format } from 'date-fns';

export default function NewEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get date from URL params or default to today
  const urlDate = searchParams.get('date');
  const today = new Date();
  const defaultDate = urlDate ? new Date(urlDate) : today;
  
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract date components
  const year = selectedDate.getFullYear().toString();
  const monthIndex = selectedDate.getMonth();
  const month = MONTH_NAMES[monthIndex] as MonthName;
  const day = selectedDate.getDate().toString();

  const handleSave = async (content: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/entries/${year}/${month}/${day}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          frontmatter: {}
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create entry');
      }

      // Navigate to the new entry
      router.push(`/entry/${year}/${month}/${day}`);
    } catch (err) {
      setError('Failed to create entry');
      console.error('Error creating entry:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    setSelectedDate(newDate);
  };

  const title = `${MONTH_FULL_NAMES[month]} ${day}, ${year}`;
  const dateInputValue = format(selectedDate, 'yyyy-MM-dd');

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
              <span className="text-gray-900 font-medium">New Entry</span>
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-6 bg-white/80 backdrop-blur rounded-lg shadow-lg p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Entry</h2>
            <div className="flex items-center space-x-4">
              <label htmlFor="entry-date" className="text-sm font-medium text-gray-700">
                Entry Date:
              </label>
              <input
                id="entry-date"
                type="date"
                value={dateInputValue}
                onChange={handleDateChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="text-sm text-gray-600">
                Selected: <span className="font-medium text-gray-900">{title}</span>
              </div>
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
            initialContent=""
            title={title}
            onManualSave={handleSave}
            onCancel={handleCancel}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}