import HabitsDashboard from '@/components/habits/HabitsDashboard';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { HabitData } from '@/lib/habits';

export default async function HabitsPage() {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  const res = await fetch(`${protocol}://${host}/api/habits/data`, {
    cache: 'no-store',
    headers: {
      cookie: headersList.get('cookie') || '',
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error('Failed to fetch habit data:', res.status, errorBody);
    throw new Error(`Failed to fetch habit data. Status: ${res.status}`);
  }

  const habitData: HabitData = await res.json();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HabitsDashboard initialHabitData={habitData} />
    </Suspense>
  );
}
