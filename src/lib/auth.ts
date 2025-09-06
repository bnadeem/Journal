import { NextRequest } from 'next/server';

const SESSION_COOKIE_NAME = 'auth-session';
const SESSION_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

export interface AuthCredentials {
  username: string;
  password: string;
}

export function validateCredentials(credentials: AuthCredentials): boolean {
  const validUsername = process.env.AUTH_USERNAME;
  const validPassword = process.env.AUTH_PASSWORD;
  
  if (!validUsername || !validPassword) {
    console.error('AUTH_USERNAME and AUTH_PASSWORD must be set in environment variables');
    return false;
  }
  
  return credentials.username === validUsername && credentials.password === validPassword;
}

export function createSessionToken(): string {
  // Simple session token - in production, consider using a proper JWT or UUID
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2);
  return `${timestamp}-${random}`;
}

export function isValidSessionToken(token: string): boolean {
  if (!token) {
    console.log('Token validation: no token provided');
    return false;
  }
  
  try {
    const [timestamp] = token.split('-');
    const tokenAge = Date.now() - parseInt(timestamp);
    const isValid = tokenAge < SESSION_DURATION;
    
    console.log('Token validation:', {
      timestamp: parseInt(timestamp),
      tokenAge,
      SESSION_DURATION,
      isValid,
      tokenStart: token.substring(0, 20) + '...'
    });
    
    return isValid;
  } catch (error) {
    console.log('Token validation error:', error);
    return false;
  }
}

export async function getSessionFromRequest(request: NextRequest): Promise<string | null> {
  return request.cookies.get(SESSION_COOKIE_NAME)?.value || null;
}

// Client-side function to get session from document.cookie
export function getSessionFromClientCookies(): string | null {
  if (typeof document === 'undefined') return null;
  
  const cookies = document.cookie.split(';');
  const sessionCookie = cookies.find(cookie => 
    cookie.trim().startsWith(`${SESSION_COOKIE_NAME}=`)
  );
  
  console.log('Cookie parsing debug:', {
    allCookies: document.cookie,
    splitCookies: cookies,
    foundCookie: sessionCookie,
    sessionCookieName: SESSION_COOKIE_NAME,
    cookieSearchPattern: `${SESSION_COOKIE_NAME}=`
  });
  
  if (!sessionCookie) return null;
  
  // More robust parsing - handle cookies with = in the value
  const cookieValue = sessionCookie.substring(sessionCookie.indexOf('=') + 1);
  
  console.log('Extracted cookie value:', cookieValue ? cookieValue.substring(0, 20) + '...' : null);
  
  return cookieValue || null;
}

export function isAuthenticated(sessionToken: string | null): boolean {
  return sessionToken ? isValidSessionToken(sessionToken) : false;
}

export const AUTH_CONFIG = {
  SESSION_COOKIE_NAME,
  SESSION_DURATION,
} as const;