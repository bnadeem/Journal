import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';
import client from '@/lib/libsql';

export default async function Home() {
  // Fetch years directly from database (no API call needed for server-side rendering)
  let years: string[] = [];
  
  try {
    const result = await client.execute(
      'SELECT DISTINCT year FROM JournalEntry ORDER BY year DESC'
    );
    years = result.rows.map(row => row.year?.toString() || '');
  } catch (error) {
    console.error('Error fetching years:', error);
  }

  return <UnifiedDashboard years={years} />;
}
