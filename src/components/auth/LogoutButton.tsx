'use client';

import { useRouter } from 'next/navigation';
import { ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/outline';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    router.push('/logout');
  };

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      title="Sign out"
    >
      <ArrowRightStartOnRectangleIcon className="h-4 w-4" />
      Sign out
    </button>
  );
}