import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const cookie = (await cookies()).get('token') 

  if (cookie) {
    // User is already authenticated (has a cookie)
    if (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup') {
      return NextResponse.redirect(new URL('/', request.url)) 
    }
  } else {
    // User is not authenticated
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/builder') {
      return NextResponse.redirect(new URL('/login', request.url)) 
    }
  }

  return NextResponse.next() 
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/login', '/signup', '/', '/builder'],
}