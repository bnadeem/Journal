import { getAllYears } from '@/lib/file-operations';
import UnifiedDashboard from '@/components/dashboard/UnifiedDashboard';

export default async function Home() {
  const years = await getAllYears();

  return <UnifiedDashboard years={years} />;
}
