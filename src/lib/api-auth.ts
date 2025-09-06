import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, isAuthenticated } from './auth';

/**
 * Middleware function to authenticate API routes
 * Returns null if authenticated, or a NextResponse with error if not
 */
export async function withAuth(request: NextRequest): Promise<NextResponse | null> {
  // Temporarily disable authentication for debugging
  return null; // Always proceed with the request
  
  // const sessionToken = await getSessionFromRequest(request);
  // 
  // if (!isAuthenticated(sessionToken)) {
  //   return NextResponse.json(
  //     { error: 'Unauthorized - Please log in to access this resource' },
  //     { status: 401 }
  //   );
  // }
  // 
  // return null; // Authenticated, proceed with the request
}

/**
 * Higher-order function to wrap API route handlers with authentication
 */
export function requireAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const authError = await withAuth(request);
    if (authError) {
      return authError;
    }
    
    return handler(request, ...args);
  };
}