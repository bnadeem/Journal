import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import { headers } from 'next/headers';

async function getYears(host: string | null, cookie: string | null): Promise<string[]> {
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
  
  const res = await fetch(`${protocol}://${host}/api/entries`, {
    cache: 'no-store',
    headers: {
      cookie: cookie || '',
    },
  });

  if (!res.ok) {
    console.error('Failed to fetch years', await res.text());
    return [];
  }

  const data = await res.json();
  return data.years || [];
}

export default async function Home() {
  const headersList = await headers();
  const host = headersList.get('host');
  const cookie = headersList.get('cookie');
  const years = await getYears(host, cookie);
  return <UnifiedDashboard years={years} />;
}
