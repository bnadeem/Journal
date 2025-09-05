'use client';

import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

interface NewEntryButtonProps {
  className?: string;
}

export default function NewEntryButton({ className = '' }: NewEntryButtonProps) {
  return (
    <Link
      href="/entry/new"
      className={`
        fixed bottom-6 right-6 z-50
        w-14 h-14 bg-blue-600 hover:bg-blue-700 
        text-white rounded-full shadow-lg hover:shadow-xl
        flex items-center justify-center
        transition-all duration-200 transform hover:scale-105
        ${className}
      `}
      title="Create New Entry"
    >
      <PlusIcon className="w-6 h-6" />
    </Link>
  );
}