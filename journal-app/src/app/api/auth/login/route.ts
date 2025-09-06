import { NextRequest, NextResponse } from 'next/server';
import { 
  validateCredentials, 
  createSessionToken, 
  AUTH_CONFIG,
  type AuthCredentials 
} from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body: AuthCredentials = await request.json();
    
    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    if (!validateCredentials(body)) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session token
    const sessionToken = createSessionToken();
    
    // Create response with session cookie
    const response = NextResponse.json(
      { message: 'Login successful' },
      { status: 200 }
    );
    
    // Set secure cookie (accessible to JS for client-side auth checks)
    response.cookies.set({
      name: AUTH_CONFIG.SESSION_COOKIE_NAME,
      value: sessionToken,
      httpOnly: false, // Allow JS access for client-side auth checks
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: AUTH_CONFIG.SESSION_DURATION / 1000, // maxAge expects seconds
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  // Logout endpoint
  const response = NextResponse.json(
    { message: 'Logout successful' },
    { status: 200 }
  );
  
  // Clear the session cookie
  response.cookies.set({
    name: AUTH_CONFIG.SESSION_COOKIE_NAME,
    value: '',
    httpOnly: false, // Match the login cookie settings
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0, // Immediately expire
    path: '/',
  });
  
  return response;
}