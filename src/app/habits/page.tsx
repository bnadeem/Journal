import { getHabitData } from '@/lib/habits';
import HabitsDashboard from '@/components/habits/HabitsDashboard';
import { Suspense } from 'react';

export default async function HabitsPage() {
  const habitData = await getHabitData();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HabitsDashboard initialHabitData={habitData} />
    </Suspense>
  );
}