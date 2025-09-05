'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import JournalEditor from '@/components/journal/JournalEditor';
import HabitTrackerWrapper from '@/components/habits/HabitTrackerWrapper';
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Modern Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-600 rounded-xl">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Entry</h1>
                <p className="text-gray-600 text-sm">Document your thoughts and experiences</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors border border-gray-300 rounded-lg hover:border-gray-400"
              >
                ← Back to Journal
              </button>
            </div>
          </div>

          {/* Date Selection */}
          <div className="mb-8 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Entry Date</h2>
                  <p className="text-gray-600 text-sm">Select the date for your journal entry</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-3">
                  <label htmlFor="entry-date" className="text-sm font-medium text-gray-700">
                    Date:
                  </label>
                  <input
                    id="entry-date"
                    type="date"
                    value={dateInputValue}
                    onChange={handleDateChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Selected:</span>
                  <span className="text-sm font-medium text-gray-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">{title}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Main Content: Journal Editor and Habits Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Journal Editor */}
            <div className="lg:col-span-2">
              <JournalEditor
                initialContent=""
                title={title}
                onManualSave={handleSave}
                onCancel={handleCancel}
                isLoading={isLoading}
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