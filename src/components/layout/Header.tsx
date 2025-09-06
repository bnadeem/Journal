'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpenIcon, ChartBarIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export default function Header() {
  const pathname = usePathname();

  // Don't show header on auth pages
  if (pathname === '/login' || pathname === '/logout') {
    return null;
  }

  const isJournalPage = pathname === '/' || pathname.startsWith('/year') || pathname.startsWith('/month') || pathname.startsWith('/entry') || pathname.startsWith('/edit') || pathname.startsWith('/summary');
  const isHabitsPage = pathname.startsWith('/habits');

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-lg">
              <BookOpenIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Personal Journal</h1>
              <p className="text-xs text-gray-500">Your thoughts & habits</p>
            </div>
          </Link>

          {/* Main Navigation */}
          <nav className="flex items-center space-x-1">
            <Link
              href="/"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isJournalPage
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <BookOpenIcon className="w-4 h-4" />
              <span>Journal</span>
            </Link>

            <Link
              href="/habits"
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isHabitsPage
                  ? 'bg-green-50 text-green-700 border border-green-200'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ChartBarIcon className="w-4 h-4" />
              <span>Habits</span>
            </Link>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions */}
            <div className="hidden sm:flex items-center space-x-2">
              <Link
                href="/entry/new"
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
              >
                New Entry
              </Link>
            </div>

            {/* Settings/Profile */}
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                <Cog6ToothIcon className="w-5 h-5" />
              </button>
              <Link
                href="/logout"
                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}