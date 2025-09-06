import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';

export default async function Home() {
  // Fetch years from database API
  const yearsRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/entries`, {
    cache: 'no-store'
  });
  
  let years: string[] = [];
  if (yearsRes.ok) {
    const data = await yearsRes.json();
    years = data.years || [];
  }

  return <UnifiedDashboard years={years} />;
}
