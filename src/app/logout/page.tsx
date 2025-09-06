'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, ArrowRightStartOnRectangleIcon } from '@heroicons/react/24/solid';
import Link from 'next/link';

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setIsComplete(true);
          // Wait 2 seconds before redirecting to login
          setTimeout(() => {
            router.push('/login');
          }, 2000);
        } else {
          console.error('Logout failed');
          // Redirect to login anyway in case of error
          router.push('/login');
        }
      } catch (error) {
        console.error('Logout error:', error);
        // Redirect to login anyway in case of error
        router.push('/login');
      } finally {
        setIsLoggingOut(false);
      }
    };

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        {isLoggingOut ? (
          <>
            <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Signing you out...
              </h2>
              <p className="text-gray-600">
                Please wait while we securely log you out.
              </p>
            </div>
          </>
        ) : isComplete ? (
          <>
            <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Successfully signed out
              </h2>
              <p className="text-gray-600 mb-6">
                You have been securely logged out of your journal. 
                <br />
                Redirecting to login page...
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <ArrowRightStartOnRectangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Logout Error
              </h2>
              <p className="text-gray-600 mb-6">
                There was an issue logging you out. For security, you'll be redirected to the login page.
              </p>
              <Link
                href="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Go to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}