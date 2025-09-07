import EnhancedHabitsDashboard from '@/components/habits/EnhancedHabitsDashboard';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { HabitData } from '@/lib/habits';

interface JournalEntry {
  year: string;
  month: string;
  day: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

async function getHabitData(host: string | null, cookie: string | null): Promise<HabitData> {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  const res = await fetch(`${protocol}://${host}/api/habits/data`, {
    cache: 'no-store',
    headers: {
      cookie: cookie || '',
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch habit data:', await res.text());
    throw new Error(`Failed to fetch habit data. Status: ${res.status}`);
  }

  return await res.json();
}

async function getRecentEntries(host: string | null, cookie: string | null): Promise<JournalEntry[]> {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  const res = await fetch(`${protocol}://${host}/api/entries?recent=true&limit=7`, {
    cache: 'no-store',
    headers: {
      cookie: cookie || '',
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch recent entries', await res.text());
    return [];
  }

  const data = await res.json();
  return data.recent || [];
}

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get('host');
  const cookie = headersList.get('cookie');
  
  const [habitData, recentEntries] = await Promise.all([
    getHabitData(host, cookie),
    getRecentEntries(host, cookie)
  ]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <EnhancedHabitsDashboard 
        initialHabitData={habitData} 
        initialRecentEntries={recentEntries}
      />
    </Suspense>
  );
}
