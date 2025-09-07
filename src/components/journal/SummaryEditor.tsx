'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import JournalEditor from '@/components/journal/JournalEditor';
import { saveSummaryAction } from '@/app/actions';
import { MonthName } from '@/types/journal';

interface SummaryEditorProps {
  year: string;
  month: MonthName;
  initialContent: string;
  entriesCount: number;
}

export default function SummaryEditor({ year, month, initialContent, entriesCount }: SummaryEditorProps) {
  const router = useRouter();
  const [content, setContent] = useState(initialContent);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (newContent: string) => {
    startTransition(async () => {
      try {
        await saveSummaryAction(year, month, newContent);
        router.push(`/month/${year}/${month}`);
      } catch (err) {
        setError('Failed to save summary');
        console.error('Error saving summary:', err);
      }
    });
  };

  const handleCancel = () => {
    router.push(`/month/${year}/${month}`);
  };

  const title = `${month} ${year} Summary`;

  return (
    <div>
        {/* Error Message */}
        {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
            </div>
        )}
        <JournalEditor
            initialContent={content}
            title={title}
            onSave={handleSave}
            onCancel={handleCancel}
            isLoading={isPending}
            showPreview={false}
        />
    </div>
  );
}