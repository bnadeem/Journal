'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getSessionFromClientCookies, isAuthenticated } from '@/lib/auth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuth, setIsAuth] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = () => {
      // Public routes that don't require authentication
      const publicRoutes = ['/login', '/logout'];
      
      if (publicRoutes.includes(pathname)) {
        setIsAuth(true);
        setIsLoading(false);
        return;
      }

      try {
        const sessionToken = getSessionFromClientCookies();
        const authenticated = isAuthenticated(sessionToken);
        
        console.log('Auth check:', { 
          pathname,
          sessionToken: sessionToken ? sessionToken.substring(0, 20) + '...' : null,
          sessionTokenExists: !!sessionToken,
          authenticated,
          cookieString: document.cookie
        });
        
        if (!authenticated) {
          // Reset auth state
          setIsAuth(false);
          // Redirect to login with current path as redirect
          const loginUrl = `/login?redirect=${encodeURIComponent(pathname)}`;
          router.push(loginUrl);
          return;
        }
        
        setIsAuth(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuth(false);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Also check auth when the page becomes visible (e.g., after login redirect)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuth();
      }
    };
    
    // Add event listeners for auth state changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkAuth);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkAuth);
    };
  }, [pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuth) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}